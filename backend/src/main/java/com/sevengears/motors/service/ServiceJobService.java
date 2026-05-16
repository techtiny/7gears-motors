package com.sevengears.motors.service;

import com.sevengears.motors.dto.DashboardDTO;
import com.sevengears.motors.dto.ServiceJobDTO;
import com.sevengears.motors.dto.ServiceUpdateDTO;
import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceJobService {

    private static final Logger log = LoggerFactory.getLogger(ServiceJobService.class);

    private final ServiceJobRepository jobRepository;
    private final ServiceUpdateRepository updateRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final ServiceImageRepository imageRepository;
    private final WhatsAppService whatsAppService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public ServiceJobService(ServiceJobRepository jobRepository,
                             ServiceUpdateRepository updateRepository,
                             VehicleRepository vehicleRepository,
                             CustomerRepository customerRepository,
                             ServiceImageRepository imageRepository,
                             WhatsAppService whatsAppService) {
        this.jobRepository = jobRepository;
        this.updateRepository = updateRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
        this.imageRepository = imageRepository;
        this.whatsAppService = whatsAppService;
    }

    @Transactional(readOnly = true)
    public List<ServiceJobDTO> findAll() {
        return jobRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceJobDTO findById(Long id) {
        ServiceJob job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service job not found: " + id));
        ServiceJobDTO dto = toDTO(job);
        dto.setUpdates(updateRepository.findByServiceJobIdOrderByCreatedAtAsc(id)
                .stream().map(this::toUpdateDTO).collect(Collectors.toList()));
        return dto;
    }

    @Transactional(readOnly = true)
    public ServiceJobDTO findByJobNumber(String jobNumber) {
        ServiceJob job = jobRepository.findByJobNumber(jobNumber)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobNumber));
        ServiceJobDTO dto = toDTO(job);
        dto.setUpdates(updateRepository.findByServiceJobIdOrderByCreatedAtAsc(job.getId())
                .stream().map(this::toUpdateDTO).collect(Collectors.toList()));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ServiceJobDTO> findByStatus(ServiceStatus status) {
        return jobRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceJobDTO> search(String query) {
        return jobRepository.search(query).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ServiceJobDTO create(ServiceJobDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        ServiceJob job = new ServiceJob();
        job.setJobNumber(generateJobNumber());
        job.setVehicle(vehicle);
        job.setStatus(ServiceStatus.RECEIVED);
        job.setDescription(dto.getDescription());
        job.setServiceType(dto.getServiceType());
        job.setEstimatedCost(dto.getEstimatedCost());
        job.setServiceAdvisor(dto.getServiceAdvisor());
        job.setTechnician(dto.getTechnician());
        job.setOdometerReading(dto.getOdometerReading());
        job.setNotes(dto.getNotes());
        if (dto.getEstimatedCompletion() != null)
            job.setEstimatedCompletion(LocalDateTime.parse(dto.getEstimatedCompletion()));
        job = jobRepository.save(job);

        ServiceUpdate update = new ServiceUpdate();
        update.setServiceJob(job);
        update.setStatus(ServiceStatus.RECEIVED);
        update.setMessage("Vehicle received at 7Gears Motors. Job #" + job.getJobNumber() + " created. We will inspect your vehicle shortly.");
        update.setSentBy("System");
        updateRepository.save(update);

        return toDTO(job);
    }

    @Transactional
    public ServiceJobDTO updateStatus(Long id, ServiceStatus newStatus, String message, String sentBy) {
        ServiceJob job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service job not found: " + id));
        job.setStatus(newStatus);
        if (newStatus == ServiceStatus.DELIVERED)       job.setDeliveredAt(LocalDateTime.now());
        if (newStatus == ServiceStatus.READY_FOR_PICKUP) job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);

        String text = (message != null && !message.isBlank()) ? message : defaultMessage(newStatus, job.getJobNumber());
        ServiceUpdate update = new ServiceUpdate();
        update.setServiceJob(job);
        update.setStatus(newStatus);
        update.setMessage(text);
        update.setSentBy(sentBy != null ? sentBy : "7Gears Team");

        trySendWhatsApp(update, job, text);
        updateRepository.save(update);
        return findById(id);
    }

    @Transactional
    public ServiceJobDTO update(Long id, ServiceJobDTO dto) {
        ServiceJob job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service job not found: " + id));
        job.setDescription(dto.getDescription());
        job.setServiceType(dto.getServiceType());
        job.setEstimatedCost(dto.getEstimatedCost());
        job.setActualCost(dto.getActualCost());
        job.setServiceAdvisor(dto.getServiceAdvisor());
        job.setTechnician(dto.getTechnician());
        job.setOdometerReading(dto.getOdometerReading());
        job.setNotes(dto.getNotes());
        if (dto.getEstimatedCompletion() != null)
            job.setEstimatedCompletion(LocalDateTime.parse(dto.getEstimatedCompletion()));
        jobRepository.save(job);
        return findById(id);
    }

    @Transactional
    public ServiceUpdateDTO addUpdate(Long jobId, ServiceUpdateDTO dto) {
        ServiceJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Service job not found"));
        ServiceUpdate update = new ServiceUpdate();
        update.setServiceJob(job);
        update.setStatus(dto.getStatus());
        update.setMessage(dto.getMessage());
        update.setSentBy(dto.getSentBy() != null ? dto.getSentBy() : "7Gears Team");
        update.setWhatsappSent(false);

        trySendWhatsApp(update, job, dto.getMessage());
        return toUpdateDTO(updateRepository.save(update));
    }

    /** Send a WhatsApp message for an existing update (manual retry from frontend). */
    @Transactional
    public ServiceUpdateDTO sendWhatsApp(Long jobId, Long updateId) {
        ServiceJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Service job not found: " + jobId));
        ServiceUpdate update = updateRepository.findById(updateId)
                .orElseThrow(() -> new RuntimeException("Update not found: " + updateId));

        String phone = job.getVehicle().getCustomer().getPhone();
        String waMsg = WhatsAppService.buildMessage(
                job.getJobNumber(),
                job.getVehicle().getRegistrationNumber(),
                job.getVehicle().getCustomer().getName(),
                update.getStatus() != null ? update.getStatus().name().replace("_", " ") : "Update",
                update.getMessage()
        );
        String sid = whatsAppService.send(phone, waMsg);
        update.setWhatsappSent(true);
        update.setWhatsappSid(sid);
        return toUpdateDTO(updateRepository.save(update));
    }

    private void trySendWhatsApp(ServiceUpdate update, ServiceJob job, String text) {
        if (!whatsAppService.isEnabled()) return;
        try {
            String phone = job.getVehicle().getCustomer().getPhone();
            String customerName = job.getVehicle().getCustomer().getName();
            String reg = job.getVehicle().getRegistrationNumber();
            String statusLabel = update.getStatus() != null
                    ? update.getStatus().name().replace("_", " ") : "Update";
            String waMsg = WhatsAppService.buildMessage(job.getJobNumber(), reg, customerName, statusLabel, text);
            String sid = whatsAppService.send(phone, waMsg);
            update.setWhatsappSent(true);
            update.setWhatsappSid(sid);
        } catch (Exception e) {
            log.warn("WhatsApp auto-send failed (will save update anyway): {}", e.getMessage());
            update.setWhatsappSent(false);
        }
    }

    @Transactional(readOnly = true)
    public DashboardDTO getDashboard() {
        DashboardDTO dash = new DashboardDTO();
        dash.setTotalJobs(jobRepository.count());
        dash.setReceived(jobRepository.countByStatus(ServiceStatus.RECEIVED));
        dash.setInspecting(jobRepository.countByStatus(ServiceStatus.INSPECTING));
        dash.setAwaitingApproval(jobRepository.countByStatus(ServiceStatus.AWAITING_APPROVAL));
        dash.setInProgress(jobRepository.countByStatus(ServiceStatus.IN_PROGRESS));
        dash.setQualityCheck(jobRepository.countByStatus(ServiceStatus.QUALITY_CHECK));
        dash.setReadyForPickup(jobRepository.countByStatus(ServiceStatus.READY_FOR_PICKUP));
        dash.setDelivered(jobRepository.countByStatus(ServiceStatus.DELIVERED));
        dash.setCancelled(jobRepository.countByStatus(ServiceStatus.CANCELLED));
        dash.setTotalCustomers(customerRepository.count());
        dash.setTotalVehicles(vehicleRepository.count());
        dash.setRecentJobs(jobRepository.findAllOrderByCreatedAtDesc().stream()
                .limit(10).map(this::toDTO).collect(Collectors.toList()));
        return dash;
    }

    private String generateJobNumber() {
        long count = jobRepository.count() + 1;
        return "7GM" + String.format("%05d", count);
    }

    private String defaultMessage(ServiceStatus status, String jobNumber) {
        return switch (status) {
            case RECEIVED          -> "Vehicle received. Job #" + jobNumber + " created.";
            case INSPECTING        -> "Your vehicle is being inspected by our expert technician.";
            case AWAITING_APPROVAL -> "Inspection complete. Please approve the service estimate to proceed.";
            case IN_PROGRESS       -> "Work has started on your vehicle. Our technicians are on it!";
            case QUALITY_CHECK     -> "Work complete! Your vehicle is undergoing quality check.";
            case READY_FOR_PICKUP  -> "Your vehicle is ready for pickup. Please visit us at your convenience.";
            case DELIVERED         -> "Vehicle delivered. Thank you for choosing 7Gears Motors!";
            case CANCELLED         -> "Service job #" + jobNumber + " has been cancelled.";
        };
    }

    public ServiceJobDTO toDTO(ServiceJob j) {
        ServiceJobDTO dto = new ServiceJobDTO();
        dto.setId(j.getId());
        dto.setJobNumber(j.getJobNumber());
        dto.setStatus(j.getStatus());

        // Image counts and first thumbnails for list/detail views
        List<ServiceImage> images = imageRepository.findByServiceJobIdOrderByUploadedAtAsc(j.getId());
        int beforeCount = (int) images.stream().filter(i -> "BEFORE".equals(i.getImageType())).count();
        int afterCount  = (int) images.stream().filter(i -> "AFTER".equals(i.getImageType())).count();
        dto.setBeforeImageCount(beforeCount);
        dto.setAfterImageCount(afterCount);
        images.stream().filter(i -> "BEFORE".equals(i.getImageType())).findFirst().ifPresent(img ->
            dto.setFirstBeforeThumb("/api/jobs/" + j.getId() + "/images/" + img.getFileName() + "/thumb"));
        images.stream().filter(i -> "AFTER".equals(i.getImageType())).findFirst().ifPresent(img ->
            dto.setFirstAfterThumb("/api/jobs/" + j.getId() + "/images/" + img.getFileName() + "/thumb"));
        dto.setDescription(j.getDescription());
        dto.setServiceType(j.getServiceType());
        dto.setEstimatedCost(j.getEstimatedCost());
        dto.setActualCost(j.getActualCost());
        dto.setServiceAdvisor(j.getServiceAdvisor());
        dto.setTechnician(j.getTechnician());
        dto.setOdometerReading(j.getOdometerReading());
        dto.setNotes(j.getNotes());
        if (j.getReceivedAt() != null)          dto.setReceivedAt(j.getReceivedAt().format(FMT));
        if (j.getEstimatedCompletion() != null) dto.setEstimatedCompletion(j.getEstimatedCompletion().format(FMT));
        if (j.getCompletedAt() != null)         dto.setCompletedAt(j.getCompletedAt().format(FMT));
        if (j.getDeliveredAt() != null)         dto.setDeliveredAt(j.getDeliveredAt().format(FMT));
        if (j.getCreatedAt() != null)           dto.setCreatedAt(j.getCreatedAt().format(FMT));
        if (j.getVehicle() != null) {
            dto.setVehicleId(j.getVehicle().getId());
            dto.setVehicleRegistration(j.getVehicle().getRegistrationNumber());
            dto.setVehicleMake(j.getVehicle().getMake());
            dto.setVehicleModel(j.getVehicle().getModel());
            dto.setVehicleColor(j.getVehicle().getColor());
            if (j.getVehicle().getCustomer() != null) {
                dto.setCustomerId(j.getVehicle().getCustomer().getId());
                dto.setCustomerName(j.getVehicle().getCustomer().getName());
                dto.setCustomerPhone(j.getVehicle().getCustomer().getPhone());
            }
        }
        return dto;
    }

    public ServiceUpdateDTO toUpdateDTO(ServiceUpdate u) {
        ServiceUpdateDTO dto = new ServiceUpdateDTO();
        dto.setId(u.getId());
        dto.setServiceJobId(u.getServiceJob() != null ? u.getServiceJob().getId() : null);
        dto.setStatus(u.getStatus());
        dto.setMessage(u.getMessage());
        dto.setSentBy(u.getSentBy());
        dto.setWhatsappSent(u.getWhatsappSent());
        dto.setWhatsappSid(u.getWhatsappSid());
        if (u.getCreatedAt() != null) dto.setCreatedAt(u.getCreatedAt().format(FMT));
        return dto;
    }

    public boolean isWhatsAppEnabled() {
        return whatsAppService.isEnabled();
    }
}
