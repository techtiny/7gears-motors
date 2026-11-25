package com.sevengears.motors.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.ServiceJobRepository;
import com.sevengears.motors.repository.ServiceUpdateRepository;
import com.sevengears.motors.repository.TermsAcceptanceRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

/**
 * Repair Terms & Conditions the customer must accept on WhatsApp (or sign in person) before work begins
 * on their vehicle. Same wording as the shop's printed job card.
 */
@Service
public class TermsService {

    public static final String REPAIR_TITLE = "CONDITIONS OF REPAIR BILL";
    public static final List<String> REPAIR_CONDITIONS = List.of(
        "Interest @18% per annum will be charged on overdue accounts and this will accrue 15 days from the date of the bill.",
        "Garage rent will be charged at appropriate rates, which the company may change from time to time, on vehicles / spares / "
            + "accessories repaired and kept ready for delivery but not taken delivery of within 15 days from the date of intimation to the customer.",
        "The company is not liable for deterioration of the vehicle and / or parts / accessories entrusted for repairs arising from the "
            + "customer's failure to take delivery within 15 days from the date of intimation sent by the company that the vehicle and / or "
            + "parts / accessories is / are kept ready for delivery.",
        "In case of any dispute it is mutually agreed that only the courts will have jurisdiction.",
        "The company reserves the right to withhold delivery and detain the vehicle entrusted to it for repairs by the customer till its "
            + "entire repair bills, including repair charges, value of parts and accessories and garage rent at appropriate rates, are paid by "
            + "the customer before effecting delivery of the repaired vehicle to him / her.",
        "The company (seller / repairer) is entitled to bring to sale any vehicle entrusted to it for repairs by customers, by public auction "
            + "or private contract or otherwise, in case its entire repair bills, including repair charges and value of parts and accessories "
            + "supplied, are not fully paid by the customer within a period of 3 months from the date the company advises the customer that the "
            + "repaired vehicle is ready for delivery, and further reserves its right to proceed against the customer for any shortfall "
            + "ascertained to be due to the company after adjusting the sale proceeds less expenses incurred in this regard by the company."
    );

    public static final String PARTS_TITLE = "TERMS & CONDITIONS - LABOUR / PARTS BILLS";
    public static final List<String> PARTS_TERMS = List.of(
        "All taxes, local or central (wherever applicable), which may be levied or become leviable under any legislation now in force or "
            + "enacted hereafter shall be payable by the purchaser in addition to the price quoted / charged by us.",
        "In addition, handling charges at appropriate rates, if not included in the price quoted / charged, will also be payable.",
        "Our risk and responsibility ceases on delivery of the goods from our premises or to carriers. Customers are requested to examine "
            + "the goods before taking delivery.",
        "The company is not responsible for delays or non-delivery or loss due to contingencies arising from war, strikes, labour or "
            + "political agitation, lockout, fire, flood and drought, delays on rail or at sea, breakdown or other causes beyond the control "
            + "of the sellers, whether in the course of transit or delivery.",
        "Terms, prices, discounts and special quotations are not subject to repetition.",
        "Interest at 18% per annum will be charged on overdue accounts from 15 days of intimation and this will be accrued from the date of the bill.",
        "The company reserves the right to withhold delivery and detain the vehicles / spares entrusted to it for repairs by customers till "
            + "its entire repair bills, including repair charges, value of parts and accessories and garage rent at appropriate rates, are paid "
            + "by the customer before effecting delivery of the repaired vehicle / spares to him / her.",
        "The company (seller / repairer) is entitled to bring to sale any vehicles / spares entrusted to it for repairs by customers, by "
            + "public auction or private contract or otherwise, in case its entire bills, including repair charges and value of parts and "
            + "accessories supplied, are not fully paid by the customer within a period of 3 months from the date the company advises the "
            + "customer that the repaired vehicle / spare is ready for delivery, and further reserves its right to proceed against the "
            + "customer for any shortfall ascertained to be due to the company after adjusting the sale proceeds less expenses.",
        "\"Contract Labour Tax\" EXTRA."
    );

    public static final List<String> POLL_OPTIONS = List.of("✅ I Accept", "❌ I Do Not Accept");

    /** Statuses that mean work has started — the job can't move into these until the terms are accepted. */
    public static final Set<ServiceStatus> WORK_STATUSES = EnumSet.of(
            ServiceStatus.IN_PROGRESS, ServiceStatus.QUALITY_CHECK, ServiceStatus.READY_FOR_PICKUP, ServiceStatus.DELIVERED);
    /** Statuses before work starts. */
    public static final Set<ServiceStatus> PRE_WORK_STATUSES = EnumSet.of(
            ServiceStatus.RECEIVED, ServiceStatus.INSPECTING, ServiceStatus.AWAITING_APPROVAL);

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter SHOW = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Color BRAND_RED = new Color(0xC0, 0x39, 0x2B);
    private static final Color BRAND_DARK = new Color(0x1a, 0x1a, 0x2e);

    private final TermsAcceptanceRepository repo;
    private final ServiceJobRepository jobRepo;
    private final ServiceUpdateRepository updateRepo;
    private final WhatsAppService whatsApp;

    public TermsService(TermsAcceptanceRepository repo, ServiceJobRepository jobRepo,
                        ServiceUpdateRepository updateRepo, WhatsAppService whatsApp) {
        this.repo = repo;
        this.jobRepo = jobRepo;
        this.updateRepo = updateRepo;
        this.whatsApp = whatsApp;
    }

    public boolean isAccepted(Long jobId) {
        return repo.existsByJobIdAndStatus(jobId, TermsAcceptance.Status.ACCEPTED);
    }

    /** Throws if the job would start work without the customer having accepted the terms. */
    public void requireAcceptedBeforeWork(ServiceJob job, ServiceStatus newStatus) {
        if (newStatus == null || !WORK_STATUSES.contains(newStatus)) return;
        if (job.getStatus() != null && !PRE_WORK_STATUSES.contains(job.getStatus())) return; // already working
        if (isAccepted(job.getId())) return;
        throw new IllegalArgumentException("Work can't begin yet — the customer hasn't accepted the Terms & Conditions. "
                + "Send them for approval on WhatsApp (or mark them signed in person) from the Terms & Conditions card.");
    }

    // ── Sending ───────────────────────────────────────────────

    @Transactional
    public Map<String, Object> send(Long jobId, String sentBy) throws Exception {
        ServiceJob job = jobRepo.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
        if (isAccepted(jobId)) throw new IllegalArgumentException("The customer has already accepted the Terms & Conditions for this job.");
        String phone = customerPhone(job);

        for (TermsAcceptance old : repo.findByJobIdAndStatus(jobId, TermsAcceptance.Status.PENDING)) {
            old.setStatus(TermsAcceptance.Status.SUPERSEDED);
        }
        TermsAcceptance t = new TermsAcceptance();
        t.setJob(job);
        t.setToken("T-" + newToken());
        t.setSentBy(sentBy);
        t = repo.save(t);

        deliver(job, t, phone, false);
        logEvent(job, "📜 Terms & Conditions sent to customer on WhatsApp for acceptance before work begins"
                + (sentBy != null ? "\nSent by " + sentBy : ""), "7Gears Team");
        return toMap(t);
    }

    @Transactional
    public Map<String, Object> resend(Long jobId, String by) throws Exception {
        TermsAcceptance t = repo.findFirstByJobIdOrderBySentAtDescIdDesc(jobId)
                .filter(x -> x.getStatus() == TermsAcceptance.Status.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("No pending Terms & Conditions request for this job. Send them first."));
        ServiceJob job = t.getJob();
        deliver(job, t, customerPhone(job), true);
        t.setResendCount(t.getResendCount() + 1);
        t.setLastResentAt(LocalDateTime.now());
        logEvent(job, "🔁 Terms & Conditions re-sent to customer for acceptance (reminder " + t.getResendCount() + ")"
                + (by != null ? "\nSent by " + by : ""), "7Gears Team");
        return toMap(t);
    }

    private void deliver(ServiceJob job, TermsAcceptance t, String phone, boolean reminder) throws Exception {
        String veh = job.getVehicle().getRegistrationNumber();
        StringBuilder msg = new StringBuilder();
        msg.append("🚗 *7GEARS MOTORS*\n\n");
        msg.append("Hello ").append(job.getVehicle().getCustomer().getName()).append(",\n\n");
        msg.append(reminder ? "Reminder: before we begin work on your vehicle *" : "Before we begin work on your vehicle *")
           .append(veh).append("* (Job #").append(job.getJobNumber())
           .append("), please read and accept our repair terms.\n\n");
        msg.append("*").append(REPAIR_TITLE).append("*\n");
        for (int i = 0; i < REPAIR_CONDITIONS.size(); i++) msg.append(i + 1).append(". ").append(REPAIR_CONDITIONS.get(i)).append("\n");
        msg.append("\n*").append(PARTS_TITLE).append("*\n");
        for (int i = 0; i < PARTS_TERMS.size(); i++) msg.append(i + 1).append(". ").append(PARTS_TERMS.get(i)).append("\n");
        msg.append("\n📎 The same terms are in the attached PDF.\n\n");
        msg.append("👇 Please tap *✅ I Accept* in the poll below so we can start work on your vehicle.\n\n");
        msg.append("Thank you,\n*7GEARS MOTORS*, Chennai");

        whatsApp.send(phone, msg.toString());
        whatsApp.sendDocument(phone, Base64.getEncoder().encodeToString(pdf(job, null)),
                "Terms_and_Conditions_" + job.getJobNumber() + ".pdf", "📜 Terms & Conditions — " + job.getJobNumber());
        whatsApp.sendPoll(phone, pollQuestion(job), POLL_OPTIONS, t.getToken());
    }

    public String pollQuestion(ServiceJob job) {
        return "7GEARS MOTORS – Do you accept the Conditions of Repair Bill and the Terms & Conditions (Labour / Parts Bills) for "
                + job.getVehicle().getRegistrationNumber() + " (Job " + job.getJobNumber() + ")?";
    }

    // ── Responses ─────────────────────────────────────────────

    /** WhatsApp poll vote — returns the reply to send the customer. */
    @Transactional
    public String respondFromPoll(String token, int optionIndex) {
        TermsAcceptance t = repo.findByToken(token).orElseThrow(() -> new IllegalArgumentException("Unknown terms request"));
        ServiceJob job = t.getJob();
        if (t.getStatus() == TermsAcceptance.Status.ACCEPTED)
            return "You have already accepted the terms for Job " + job.getJobNumber() + ". Thank you!\n\n*7GEARS MOTORS*";
        if (t.getStatus() == TermsAcceptance.Status.SUPERSEDED)
            return "This request was replaced by a newer one. Please answer the latest Terms & Conditions message we sent you.";
        if (optionIndex != 0 && optionIndex != 1) throw new IllegalArgumentException("Unknown poll option");

        boolean accepted = optionIndex == 0;
        t.setStatus(accepted ? TermsAcceptance.Status.ACCEPTED : TermsAcceptance.Status.DECLINED);
        t.setRespondedAt(LocalDateTime.now());
        t.setAcceptedVia("WhatsApp");
        logEvent(job, (accepted ? "✅ Customer ACCEPTED the Terms & Conditions (via WhatsApp) — work may begin"
                                : "❌ Customer DID NOT ACCEPT the Terms & Conditions (via WhatsApp) — do not begin work")
                + "\nSent " + t.getSentAt().format(SHOW) + " · responded " + t.getRespondedAt().format(SHOW), "Customer");
        return accepted
                ? "✅ Thank you! Your acceptance of our Terms & Conditions for " + job.getVehicle().getRegistrationNumber()
                  + " (Job " + job.getJobNumber() + ") has been recorded. We will now begin work on your vehicle.\n\n*7GEARS MOTORS*"
                : "Noted — you have not accepted the Terms & Conditions for Job " + job.getJobNumber()
                  + ". We will not begin work. Our team will contact you shortly, or call us at +91 78260 47847.\n\n*7GEARS MOTORS*";
    }

    /** Staff records that the customer signed the printed terms at the counter. */
    @Transactional
    public Map<String, Object> acceptInPerson(Long jobId, String by, String note) {
        ServiceJob job = jobRepo.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
        if (isAccepted(jobId)) throw new IllegalArgumentException("Terms & Conditions are already accepted for this job.");
        TermsAcceptance t = repo.findFirstByJobIdOrderBySentAtDescIdDesc(jobId)
                .filter(x -> x.getStatus() == TermsAcceptance.Status.PENDING || x.getStatus() == TermsAcceptance.Status.DECLINED)
                .orElse(null);
        if (t == null) {
            t = new TermsAcceptance();
            t.setJob(job);
            t.setToken("T-" + newToken());
            t.setSentBy(by);
        }
        t.setStatus(TermsAcceptance.Status.ACCEPTED);
        t.setRespondedAt(LocalDateTime.now());
        t.setAcceptedVia("In person (signed)");
        String cleanNote = note == null || note.isBlank() ? null : note.trim();
        if (cleanNote != null && cleanNote.length() > 500) cleanNote = cleanNote.substring(0, 500);
        t.setNote(cleanNote);
        t = repo.save(t);
        logEvent(job, "✍️ Customer signed the Terms & Conditions in person — work may begin"
                + (by != null ? "\nRecorded by " + by : "") + (cleanNote != null ? "\nNote: " + cleanNote : ""), "7Gears Team");
        return toMap(t);
    }

    // ── Views ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> overview(Long jobId) {
        List<Map<String, Object>> history = repo.findByJobIdOrderBySentAtDescIdDesc(jobId).stream().map(this::toMap).toList();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("accepted", isAccepted(jobId));
        m.put("latest", history.isEmpty() ? null : history.get(0));
        m.put("history", history);
        return m;
    }

    private Map<String, Object> toMap(TermsAcceptance t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("status", t.getStatus().name());
        m.put("sentBy", t.getSentBy());
        m.put("sentAt", t.getSentAt() != null ? t.getSentAt().format(FMT) : null);
        m.put("respondedAt", t.getRespondedAt() != null ? t.getRespondedAt().format(FMT) : null);
        m.put("acceptedVia", t.getAcceptedVia());
        m.put("note", t.getNote());
        m.put("resendCount", t.getResendCount());
        m.put("lastResentAt", t.getLastResentAt() != null ? t.getLastResentAt().format(FMT) : null);
        return m;
    }

    // ── PDF ───────────────────────────────────────────────────

    /** Terms PDF; if the job's terms are accepted, an acceptance stamp replaces the blank signature line. */
    @Transactional(readOnly = true)
    public byte[] pdfForJob(Long jobId) throws Exception {
        ServiceJob job = jobRepo.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
        TermsAcceptance accepted = repo.findByJobIdOrderBySentAtDescIdDesc(jobId).stream()
                .filter(x -> x.getStatus() == TermsAcceptance.Status.ACCEPTED).findFirst().orElse(null);
        return pdf(job, accepted);
    }

    private byte[] pdf(ServiceJob job, TermsAcceptance accepted) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 36, 36);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font company = new Font(Font.HELVETICA, 17, Font.BOLD, BRAND_RED);
        Font sub = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);
        Font label = new Font(Font.HELVETICA, 8, Font.BOLD, Color.GRAY);
        Font value = new Font(Font.HELVETICA, 10, Font.BOLD, BRAND_DARK);
        Font title = new Font(Font.HELVETICA, 11, Font.BOLD | Font.UNDERLINE, BRAND_DARK);
        Font body = new Font(Font.HELVETICA, 9, Font.NORMAL, BRAND_DARK);
        Font sign = new Font(Font.HELVETICA, 10, Font.BOLD, BRAND_DARK);

        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1.2f, 4f});
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        try {
            ClassPathResource logoRes = new ClassPathResource("static/logo.png");
            if (logoRes.exists()) {
                Image logo = Image.getInstance(logoRes.getURL());
                logo.scaleToFit(60, 60);
                logoCell.addElement(logo);
            }
        } catch (Exception ignored) {}
        header.addCell(logoCell);
        PdfPCell info = new PdfPCell();
        info.setBorder(Rectangle.NO_BORDER);
        info.addElement(new Paragraph("7GEARS MOTORS", company));
        info.addElement(new Paragraph("No 5, 1st Street, Easwari Nagar, Selaiyur, Chennai 600 073", sub));
        info.addElement(new Paragraph("+91 78260 47847, +91 81245 37877 | sevengearsmotors@gmail.com", sub));
        header.addCell(info);
        doc.add(header);

        PdfPTable rule = new PdfPTable(1);
        rule.setWidthPercentage(100);
        rule.setSpacingBefore(6);
        rule.setSpacingAfter(8);
        PdfPCell rc = new PdfPCell();
        rc.setFixedHeight(3);
        rc.setBackgroundColor(BRAND_RED);
        rc.setBorder(Rectangle.NO_BORDER);
        rule.addCell(rc);
        doc.add(rule);

        PdfPTable jobInfo = new PdfPTable(4);
        jobInfo.setWidthPercentage(100);
        jobInfo.setWidths(new float[]{1f, 2f, 1f, 2f});
        jobInfo.setSpacingAfter(10);
        Vehicle v = job.getVehicle();
        Customer c = v != null ? v.getCustomer() : null;
        pair(jobInfo, "JOB NO.", job.getJobNumber(), label, value);
        pair(jobInfo, "VEHICLE", v != null ? v.getRegistrationNumber() : "-", label, value);
        pair(jobInfo, "CUSTOMER", c != null ? c.getName() : "-", label, value);
        pair(jobInfo, "PHONE", c != null ? c.getPhone() : "-", label, value);
        doc.add(jobInfo);

        section(doc, REPAIR_TITLE, REPAIR_CONDITIONS, title, body);
        signatureBlock(doc, accepted, sign, body);
        section(doc, PARTS_TITLE, PARTS_TERMS, title, body);
        signatureBlock(doc, accepted, sign, body);

        doc.close();
        return out.toByteArray();
    }

    private void section(Document doc, String heading, List<String> lines, Font title, Font body) throws DocumentException {
        Paragraph h = new Paragraph(heading, title);
        h.setAlignment(Element.ALIGN_CENTER);
        h.setSpacingBefore(6);
        h.setSpacingAfter(6);
        doc.add(h);
        com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.ORDERED);
        list.setIndentationLeft(4);
        list.setSymbolIndent(16);
        for (String line : lines) {
            ListItem li = new ListItem(line, body);
            li.setSpacingAfter(3);
            li.setAlignment(Element.ALIGN_JUSTIFIED);
            list.add(li);
        }
        doc.add(list);
    }

    private void signatureBlock(Document doc, TermsAcceptance accepted, Font sign, Font body) throws DocumentException {
        Paragraph p;
        if (accepted != null) {
            p = new Paragraph("Accepted by customer " + (accepted.getAcceptedVia() != null ? "(" + accepted.getAcceptedVia() + ") " : "")
                    + "on " + accepted.getRespondedAt().format(SHOW), new Font(Font.HELVETICA, 10, Font.BOLD, new Color(0x16, 0x65, 0x34)));
        } else {
            p = new Paragraph("Signature of Customer / Authorized Representative", sign);
        }
        p.setAlignment(Element.ALIGN_RIGHT);
        p.setSpacingBefore(10);
        p.setSpacingAfter(8);
        doc.add(p);
    }

    private void pair(PdfPTable t, String l, String v, Font lf, Font vf) {
        PdfPCell a = new PdfPCell(new Phrase(l, lf));
        a.setBorder(Rectangle.NO_BORDER);
        a.setPaddingBottom(4);
        PdfPCell b = new PdfPCell(new Phrase(v == null ? "-" : v, vf));
        b.setBorder(Rectangle.NO_BORDER);
        b.setPaddingBottom(4);
        t.addCell(a);
        t.addCell(b);
    }

    // ── helpers ───────────────────────────────────────────────

    private String customerPhone(ServiceJob job) {
        String phone = job.getVehicle() != null && job.getVehicle().getCustomer() != null ? job.getVehicle().getCustomer().getPhone() : null;
        if (phone == null || phone.isBlank()) throw new IllegalArgumentException("This customer has no phone number for WhatsApp.");
        return phone;
    }

    private void logEvent(ServiceJob job, String message, String sentBy) {
        ServiceUpdate u = new ServiceUpdate();
        u.setServiceJob(job);
        u.setMessage(message);
        u.setSentBy(sentBy);
        u.setWhatsappSent("7Gears Team".equals(sentBy)); // shop entries already went out on WhatsApp
        updateRepo.save(u);
    }

    private static String newToken() {
        byte[] b = new byte[24];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
