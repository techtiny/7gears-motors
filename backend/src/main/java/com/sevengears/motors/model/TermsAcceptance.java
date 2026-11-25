package com.sevengears.motors.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Customer's acceptance of the repair Terms & Conditions for a job — required before work begins. */
@Entity
@Table(name = "job_terms_acceptances")
public class TermsAcceptance {

    public enum Status { PENDING, ACCEPTED, DECLINED, SUPERSEDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private ServiceJob job;

    /** Reference carried by the WhatsApp poll ("T-…"). */
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "sent_by")
    private String sentBy;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    /** "WhatsApp" or "In person (signed)" */
    @Column(name = "accepted_via", length = 60)
    private String acceptedVia;

    /** Staff note when marked in person, e.g. who witnessed the signature. */
    @Column(length = 500)
    private String note;

    @Column(name = "resend_count")
    private Integer resendCount = 0;

    @Column(name = "last_resent_at")
    private LocalDateTime lastResentAt;

    @PrePersist
    void onCreate() { if (sentAt == null) sentAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public ServiceJob getJob() { return job; }
    public void setJob(ServiceJob job) { this.job = job; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
    public String getAcceptedVia() { return acceptedVia; }
    public void setAcceptedVia(String acceptedVia) { this.acceptedVia = acceptedVia; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Integer getResendCount() { return resendCount == null ? 0 : resendCount; }
    public void setResendCount(Integer resendCount) { this.resendCount = resendCount; }
    public LocalDateTime getLastResentAt() { return lastResentAt; }
    public void setLastResentAt(LocalDateTime lastResentAt) { this.lastResentAt = lastResentAt; }
}
