package com.sevengears.motors.dto;

import com.sevengears.motors.model.ServiceStatus;
import jakarta.validation.constraints.NotBlank;

public class ServiceUpdateDTO {
    private Long id;
    private Long serviceJobId;
    private ServiceStatus status;

    @NotBlank(message = "Message is required")
    private String message;

    private String sentBy;
    private Boolean whatsappSent;
    private String whatsappSid;
    private String createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getServiceJobId() { return serviceJobId; }
    public void setServiceJobId(Long serviceJobId) { this.serviceJobId = serviceJobId; }
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
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
