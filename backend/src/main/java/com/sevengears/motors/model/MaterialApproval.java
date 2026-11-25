package com.sevengears.motors.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One "Send for Approval" of a job's material estimate. The customer opens the
 * WhatsApp link (identified by {@link #token}) and approves or rejects it.
 * The estimate items are snapshotted so the record shows exactly what was approved.
 */
@Entity
@Table(name = "material_approvals", indexes = @Index(name = "idx_material_approval_token", columnList = "token", unique = true))
public class MaterialApproval {

    public enum Status { PENDING, APPROVED, REJECTED, SUPERSEDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private ServiceJob job;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "parts_total", precision = 12, scale = 2)
    private BigDecimal partsTotal;

    @Column(name = "labour_total", precision = 12, scale = 2)
    private BigDecimal labourTotal;

    @Column(name = "grand_total", precision = 12, scale = 2)
    private BigDecimal grandTotal;

    /** JSON array of the items as they were when sent. */
    @Column(name = "items_snapshot", columnDefinition = "TEXT")
    private String itemsSnapshot;

    @Column(name = "sent_by")
    private String sentBy;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "customer_comment", columnDefinition = "TEXT")
    private String customerComment;

    /** How many times the estimate + poll was re-sent to the customer, and when last. */
    @Column(name = "resend_count")
    private Integer resendCount = 0;

    @Column(name = "last_resent_at")
    private LocalDateTime lastResentAt;

    /** When a newer estimate replaced this one (status SUPERSEDED). */
    @Column(name = "superseded_at")
    private LocalDateTime supersededAt;

    public Integer getResendCount() { return resendCount == null ? 0 : resendCount; }
    public void setResendCount(Integer resendCount) { this.resendCount = resendCount; }
    public LocalDateTime getLastResentAt() { return lastResentAt; }
    public void setLastResentAt(LocalDateTime lastResentAt) { this.lastResentAt = lastResentAt; }
    public LocalDateTime getSupersededAt() { return supersededAt; }
    public void setSupersededAt(LocalDateTime supersededAt) { this.supersededAt = supersededAt; }

    @PrePersist
    protected void onCreate() { if (sentAt == null) sentAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public ServiceJob getJob() { return job; }
    public void setJob(ServiceJob job) { this.job = job; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public BigDecimal getPartsTotal() { return partsTotal; }
    public void setPartsTotal(BigDecimal partsTotal) { this.partsTotal = partsTotal; }
    public BigDecimal getLabourTotal() { return labourTotal; }
    public void setLabourTotal(BigDecimal labourTotal) { this.labourTotal = labourTotal; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public String getItemsSnapshot() { return itemsSnapshot; }
    public void setItemsSnapshot(String itemsSnapshot) { this.itemsSnapshot = itemsSnapshot; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }
    public LocalDateTime getSentAt() { return sentAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
    public String getCustomerComment() { return customerComment; }
    public void setCustomerComment(String customerComment) { this.customerComment = customerComment; }
}
