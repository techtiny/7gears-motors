package com.sevengears.motors.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_updates")
public class ServiceUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_job_id", nullable = false)
    private ServiceJob serviceJob;

    @Enumerated(EnumType.STRING)
    private ServiceStatus status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_by")
    private String sentBy;

    @Column(name = "whatsapp_sent")
    private Boolean whatsappSent = false;

    @Column(name = "whatsapp_sid")
    private String whatsappSid;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ServiceJob getServiceJob() { return serviceJob; }
    public void setServiceJob(ServiceJob serviceJob) { this.serviceJob = serviceJob; }
    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }
    public Boolean getWhatsappSent() { return whatsappSent; }
    public void setWhatsappSent(Boolean whatsappSent) { this.whatsappSent = whatsappSent; }
    public String getWhatsappSid() { return whatsappSid; }
    public void setWhatsappSid(String whatsappSid) { this.whatsappSid = whatsappSid; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
