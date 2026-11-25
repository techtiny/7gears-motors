package com.sevengears.motors.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.MaterialApprovalRepository;
import com.sevengears.motors.repository.ServiceUpdateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Customer approval of a job's material estimate via a WhatsApp link. */
@Service
public class MaterialApprovalService {

    /** Links stop working after this many days. */
    public static final int LINK_VALID_DAYS = 30;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final MaterialApprovalRepository approvalRepo;
    private final ServiceUpdateRepository updateRepo;
    private final ObjectMapper objectMapper;

    @Value("${app.public-url:http://localhost:5174}")
    private String publicUrl;

    public MaterialApprovalService(MaterialApprovalRepository approvalRepo,
                                   ServiceUpdateRepository updateRepo,
                                   ObjectMapper objectMapper) {
        this.approvalRepo = approvalRepo;
        this.updateRepo = updateRepo;
        this.objectMapper = objectMapper;
    }

    /** Creates a new pending approval (superseding older pending ones) and returns it. */
    @Transactional
    public MaterialApproval create(ServiceJob job, List<MaterialConsumed> items, String sentBy) {
        List<MaterialApproval> replaced = new ArrayList<>();
        for (MaterialApproval old : approvalRepo.findByJobIdAndStatus(job.getId(), MaterialApproval.Status.PENDING)) {
            old.setStatus(MaterialApproval.Status.SUPERSEDED);
            old.setSupersededAt(LocalDateTime.now());
            replaced.add(old);
        }
        for (MaterialApproval old : replaced) {
            logEvent(job, "♻️ Earlier estimate of ₹" + money(old.getGrandTotal())
                    + " (sent " + old.getSentAt().format(SHOW) + ") was replaced by a revised estimate — no customer response recorded for it.");
        }

        BigDecimal parts = BigDecimal.ZERO, labour = BigDecimal.ZERO;
        List<Map<String, Object>> snapshot = new ArrayList<>();
        for (MaterialConsumed m : items) {
            BigDecimal l = m.getLabour() != null ? m.getLabour() : BigDecimal.ZERO;
            parts = parts.add(m.getAmount());
            labour = labour.add(l);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("description", m.getDescription());
            row.put("remarks", m.getRemarks());
            row.put("quantity", m.getQuantity());
            row.put("amount", m.getAmount());
            row.put("labour", l);
            row.put("total", m.getLineTotal());
            snapshot.add(row);
        }

        MaterialApproval a = new MaterialApproval();
        a.setJob(job);
        a.setToken(newToken());
        a.setPartsTotal(parts);
        a.setLabourTotal(labour);
        a.setGrandTotal(parts.add(labour));
        a.setSentBy(sentBy);
        try {
            a.setItemsSnapshot(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            throw new RuntimeException("Could not save estimate snapshot", e);
        }
        return approvalRepo.save(a);
    }

    /** Adds an entry to the job's history timeline (shown on the right, as sent by the shop). */
    @Transactional
    public void logEvent(ServiceJob job, String message) {
        ServiceUpdate u = new ServiceUpdate();
        u.setServiceJob(job);
        u.setMessage(message);
        u.setSentBy("7Gears Team");
        u.setWhatsappSent(true); // already went out on WhatsApp — no "Send" button
        updateRepo.save(u);
    }

    /** Logged after the estimate, PDF and poll went out to the customer. */
    @Transactional
    public void logSent(MaterialApproval a, int itemCount) {
        logEvent(a.getJob(), "📤 Material estimate sent to customer for approval on WhatsApp\n"
                + itemCount + " item" + (itemCount == 1 ? "" : "s") + " · Parts ₹" + money(a.getPartsTotal())
                + " · Labour ₹" + money(a.getLabourTotal()) + " · *Total ₹" + money(a.getGrandTotal()) + "*"
                + (a.getSentBy() != null ? "\nSent by " + a.getSentBy() : ""));
    }

    /** Logged when the same pending estimate is sent again. */
    @Transactional
    public void logResent(MaterialApproval a, String by) {
        MaterialApproval fresh = approvalRepo.findById(a.getId()).orElse(a);
        fresh.setResendCount(fresh.getResendCount() + 1);
        fresh.setLastResentAt(LocalDateTime.now());
        approvalRepo.save(fresh);
        logEvent(fresh.getJob(), "🔁 Estimate of ₹" + money(fresh.getGrandTotal()) + " re-sent to customer for approval"
                + " (reminder " + fresh.getResendCount() + ")" + (by != null ? "\nSent by " + by : ""));
    }

    /** Every estimate sent for this job, newest first — the approval history. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> historyForJob(Long jobId) {
        return approvalRepo.findByJobIdOrderBySentAtDescIdDesc(jobId).stream().map(a -> toMap(a, false)).toList();
    }

    private static final DateTimeFormatter SHOW = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private static String money(BigDecimal v) {
        java.text.NumberFormat nf = java.text.NumberFormat.getNumberInstance(new Locale("en", "IN"));
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(v != null ? v : BigDecimal.ZERO);
    }

    /** Latest approval still waiting on the customer, if any. */
    @Transactional(readOnly = true)
    public Optional<MaterialApproval> latestPending(Long jobId) {
        return approvalRepo.findFirstByJobIdOrderBySentAtDescIdDesc(jobId)
                .filter(a -> a.getStatus() == MaterialApproval.Status.PENDING && !isExpired(a));
    }

    public String linkFor(MaterialApproval a) {
        return publicUrl.replaceAll("/+$", "") + "/approve/" + a.getToken();
    }

    /** Latest approval for the staff portal (null if never sent). */
    @Transactional(readOnly = true)
    public Map<String, Object> latestForJob(Long jobId) {
        return approvalRepo.findFirstByJobIdOrderBySentAtDescIdDesc(jobId)
                .map(a -> toMap(a, false))
                .orElse(null);
    }

    /** Public view for the customer link. */
    @Transactional(readOnly = true)
    public Map<String, Object> publicView(String token) {
        return toMap(find(token), true);
    }

    /** Poll options sent on WhatsApp — index 0 approves, index 1 rejects. */
    public static final List<String> POLL_OPTIONS = List.of("✅ Approve", "❌ Reject");

    public String pollQuestion(MaterialApproval a) {
        ServiceJob job = a.getJob();
        return "7GEARS MOTORS – Material estimate ₹" + a.getGrandTotal().toPlainString()
                + " for " + job.getVehicle().getRegistrationNumber()
                + " (Job " + job.getJobNumber() + "). Do you approve? Tap one option:";
    }

    /**
     * Handles a vote from the WhatsApp poll. Returns the reply text to send back to the customer.
     */
    @Transactional
    public String respondFromPoll(String token, int optionIndex) {
        String decision = optionIndex == 0 ? "APPROVED" : optionIndex == 1 ? "REJECTED" : null;
        if (decision == null) throw new IllegalArgumentException("Unknown poll option");
        MaterialApproval a = find(token);
        try {
            respond(token, decision, null, "WhatsApp");
        } catch (IllegalArgumentException e) {
            if (a.getStatus() == MaterialApproval.Status.APPROVED || a.getStatus() == MaterialApproval.Status.REJECTED) {
                return "You have already " + (a.getStatus() == MaterialApproval.Status.APPROVED ? "*approved*" : "*rejected*")
                        + " this estimate. To make a change, please call 7GEARS MOTORS at +91 78260 47847.";
            }
            return e.getMessage();
        }
        return "APPROVED".equals(decision)
                ? "✅ Thank you! Your approval for ₹" + a.getGrandTotal().toPlainString()
                  + " (Job " + a.getJob().getJobNumber() + ") has been recorded. Our team will proceed with the work.\n\n*7GEARS MOTORS*"
                : "❌ Noted — you have rejected the estimate for Job " + a.getJob().getJobNumber()
                  + ". Our team will contact you shortly.\n\n*7GEARS MOTORS*";
    }

    @Transactional
    public Map<String, Object> respond(String token, String decision, String comment) {
        return respond(token, decision, comment, "approval page");
    }

    @Transactional
    public Map<String, Object> respond(String token, String decision, String comment, String via) {
        MaterialApproval a = find(token);
        if (isExpired(a))
            throw new IllegalArgumentException("This approval request has expired. Please contact 7GEARS MOTORS at +91 78260 47847.");
        if (a.getStatus() == MaterialApproval.Status.SUPERSEDED)
            throw new IllegalArgumentException("This estimate has been replaced by a newer one. Please respond to the latest estimate we sent you.");
        if (a.getStatus() != MaterialApproval.Status.PENDING)
            throw new IllegalArgumentException("You have already responded to this estimate.");

        MaterialApproval.Status status;
        if ("APPROVED".equalsIgnoreCase(decision)) status = MaterialApproval.Status.APPROVED;
        else if ("REJECTED".equalsIgnoreCase(decision)) status = MaterialApproval.Status.REJECTED;
        else throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");

        String cleanComment = comment == null ? null : comment.trim();
        if (cleanComment != null && cleanComment.isEmpty()) cleanComment = null;
        if (cleanComment != null && cleanComment.length() > 1000) cleanComment = cleanComment.substring(0, 1000);

        a.setStatus(status);
        a.setRespondedAt(LocalDateTime.now());
        a.setCustomerComment(cleanComment);

        // Log it on the job's message timeline (shown as an incoming customer message)
        ServiceUpdate u = new ServiceUpdate();
        u.setServiceJob(a.getJob());
        u.setMessage((status == MaterialApproval.Status.APPROVED
                ? "✅ Customer APPROVED the material estimate of ₹" + money(a.getGrandTotal())
                : "❌ Customer REJECTED the material estimate of ₹" + money(a.getGrandTotal()))
                + " (via " + via + ")"
                + "\nSent " + a.getSentAt().format(SHOW) + " · responded " + a.getRespondedAt().format(SHOW)
                + (cleanComment != null ? "\nComment: " + cleanComment : ""));
        u.setSentBy("Customer");
        u.setWhatsappSent(false);
        updateRepo.save(u);

        return toMap(a, true);
    }

    // ── helpers ─────────────────────────────────────────────

    private MaterialApproval find(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{20,64}"))
            throw new IllegalArgumentException("Invalid approval link");
        return approvalRepo.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid approval link"));
    }

    private boolean isExpired(MaterialApproval a) {
        return a.getSentAt() != null && a.getSentAt().plusDays(LINK_VALID_DAYS).isBefore(LocalDateTime.now());
    }

    private static String newToken() {
        byte[] b = new byte[24];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private Map<String, Object> toMap(MaterialApproval a, boolean forCustomer) {
        ServiceJob job = a.getJob();
        Vehicle v = job.getVehicle();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("status", a.getStatus().name());
        m.put("expired", a.getStatus() == MaterialApproval.Status.PENDING && isExpired(a));
        m.put("jobNumber", job.getJobNumber());
        m.put("vehicleNumber", v != null ? v.getRegistrationNumber() : null);
        m.put("vehicleName", v != null ? (Objects.toString(v.getMake(), "") + " " + Objects.toString(v.getModel(), "")).trim() : null);
        m.put("customerName", v != null && v.getCustomer() != null ? v.getCustomer().getName() : null);
        m.put("partsTotal", a.getPartsTotal());
        m.put("labourTotal", a.getLabourTotal());
        m.put("grandTotal", a.getGrandTotal());
        m.put("sentAt", a.getSentAt() != null ? a.getSentAt().format(FMT) : null);
        m.put("respondedAt", a.getRespondedAt() != null ? a.getRespondedAt().format(FMT) : null);
        m.put("customerComment", a.getCustomerComment());
        if (!forCustomer) {
            m.put("resendCount", a.getResendCount());
            m.put("lastResentAt", a.getLastResentAt() != null ? a.getLastResentAt().format(FMT) : null);
            m.put("supersededAt", a.getSupersededAt() != null ? a.getSupersededAt().format(FMT) : null);
        }
        try {
            m.put("items", objectMapper.readValue(a.getItemsSnapshot() == null ? "[]" : a.getItemsSnapshot(),
                    new TypeReference<List<Map<String, Object>>>() {}));
        } catch (Exception e) {
            m.put("items", List.of());
        }
        if (forCustomer) {
            m.put("terms", MaterialPdfService.TERMS);
        } else {
            m.put("sentBy", a.getSentBy());
            m.put("link", linkFor(a));
        }
        return m;
    }
}
