package com.sevengears.motors.dto;

import java.util.List;

public class DashboardDTO {
    private long totalJobs;
    private long received;
    private long inspecting;
    private long awaitingApproval;
    private long inProgress;
    private long qualityCheck;
    private long readyForPickup;
    private long delivered;
    private long cancelled;
    private long totalCustomers;
    private long totalVehicles;
    private List<ServiceJobDTO> recentJobs;

    public long getTotalJobs() { return totalJobs; }
    public void setTotalJobs(long totalJobs) { this.totalJobs = totalJobs; }
    public long getReceived() { return received; }
    public void setReceived(long received) { this.received = received; }
    public long getInspecting() { return inspecting; }
    public void setInspecting(long inspecting) { this.inspecting = inspecting; }
    public long getAwaitingApproval() { return awaitingApproval; }
    public void setAwaitingApproval(long awaitingApproval) { this.awaitingApproval = awaitingApproval; }
    public long getInProgress() { return inProgress; }
    public void setInProgress(long inProgress) { this.inProgress = inProgress; }
    public long getQualityCheck() { return qualityCheck; }
    public void setQualityCheck(long qualityCheck) { this.qualityCheck = qualityCheck; }
    public long getReadyForPickup() { return readyForPickup; }
    public void setReadyForPickup(long readyForPickup) { this.readyForPickup = readyForPickup; }
    public long getDelivered() { return delivered; }
    public void setDelivered(long delivered) { this.delivered = delivered; }
    public long getCancelled() { return cancelled; }
    public void setCancelled(long cancelled) { this.cancelled = cancelled; }
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
    public long getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(long totalVehicles) { this.totalVehicles = totalVehicles; }
    public List<ServiceJobDTO> getRecentJobs() { return recentJobs; }
    public void setRecentJobs(List<ServiceJobDTO> recentJobs) { this.recentJobs = recentJobs; }
}
