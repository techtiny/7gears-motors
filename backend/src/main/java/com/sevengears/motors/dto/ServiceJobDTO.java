package com.sevengears.motors.dto;

import com.sevengears.motors.model.ServiceStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class ServiceJobDTO {
    private Long id;
    private String jobNumber;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private String vehicleRegistration;
    private String vehicleMake;
    private String vehicleModel;
    private String vehicleColor;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private ServiceStatus status;
    private String description;
    private String serviceType;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private String serviceAdvisor;
    private String technician;
    private Integer odometerReading;
    private String receivedAt;
    private String estimatedCompletion;
    private String completedAt;
    private String deliveredAt;
    private String notes;
    private String createdAt;
    private List<ServiceUpdateDTO> updates;
    private int beforeImageCount;
    private int afterImageCount;
    private String firstBeforeThumb;
    private String firstAfterThumb;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getJobNumber() { return jobNumber; }
    public void setJobNumber(String jobNumber) { this.jobNumber = jobNumber; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getVehicleRegistration() { return vehicleRegistration; }
    public void setVehicleRegistration(String vehicleRegistration) { this.vehicleRegistration = vehicleRegistration; }
    public String getVehicleMake() { return vehicleMake; }
    public void setVehicleMake(String vehicleMake) { this.vehicleMake = vehicleMake; }
    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
    public String getVehicleColor() { return vehicleColor; }
    public void setVehicleColor(String vehicleColor) { this.vehicleColor = vehicleColor; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }
    public BigDecimal getActualCost() { return actualCost; }
    public void setActualCost(BigDecimal actualCost) { this.actualCost = actualCost; }
    public String getServiceAdvisor() { return serviceAdvisor; }
    public void setServiceAdvisor(String serviceAdvisor) { this.serviceAdvisor = serviceAdvisor; }
    public String getTechnician() { return technician; }
    public void setTechnician(String technician) { this.technician = technician; }
    public Integer getOdometerReading() { return odometerReading; }
    public void setOdometerReading(Integer odometerReading) { this.odometerReading = odometerReading; }
    public String getReceivedAt() { return receivedAt; }
    public void setReceivedAt(String receivedAt) { this.receivedAt = receivedAt; }
    public String getEstimatedCompletion() { return estimatedCompletion; }
    public void setEstimatedCompletion(String estimatedCompletion) { this.estimatedCompletion = estimatedCompletion; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
    public String getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(String deliveredAt) { this.deliveredAt = deliveredAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public List<ServiceUpdateDTO> getUpdates() { return updates; }
    public void setUpdates(List<ServiceUpdateDTO> updates) { this.updates = updates; }
    public int getBeforeImageCount() { return beforeImageCount; }
    public void setBeforeImageCount(int beforeImageCount) { this.beforeImageCount = beforeImageCount; }
    public int getAfterImageCount() { return afterImageCount; }
    public void setAfterImageCount(int afterImageCount) { this.afterImageCount = afterImageCount; }
    public String getFirstBeforeThumb() { return firstBeforeThumb; }
    public void setFirstBeforeThumb(String firstBeforeThumb) { this.firstBeforeThumb = firstBeforeThumb; }
    public String getFirstAfterThumb() { return firstAfterThumb; }
    public void setFirstAfterThumb(String firstAfterThumb) { this.firstAfterThumb = firstAfterThumb; }
}
