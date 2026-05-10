package com.sevengears.motors.service;

import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final WhatsAppService whatsAppService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                               CustomerRepository customerRepository,
                               VehicleRepository vehicleRepository,
                               WhatsAppService whatsAppService) {
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.whatsAppService = whatsAppService;
    }

    public List<Appointment> findAll() { return appointmentRepository.findAll(); }
    public List<Appointment> findByDate(LocalDate date) { return appointmentRepository.findByAppointmentDateOrderByAppointmentTimeAsc(date); }
    public List<Appointment> findByRange(LocalDate from, LocalDate to) { return appointmentRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(from, to); }
    public List<Appointment> findByCustomer(Long customerId) { return appointmentRepository.findByCustomerIdOrderByAppointmentDateDesc(customerId); }

    public Appointment findById(Long id) {
        return appointmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
    }

    @Transactional
    public Appointment create(Long customerId, Long vehicleId, LocalDate date, String time, String serviceType, String notes) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Appointment appt = new Appointment();
        appt.setCustomer(customer);
        if (vehicleId != null) {
            vehicleRepository.findById(vehicleId).ifPresent(appt::setVehicle);
        }
        appt.setAppointmentDate(date);
        appt.setAppointmentTime(java.time.LocalTime.parse(time));
        appt.setServiceType(serviceType);
        appt.setNotes(notes);
        appt = appointmentRepository.save(appt);

        // Send WhatsApp confirmation
        try {
            String msg = "✅ *Appointment Confirmed — 7Gears Motors*\n\n" +
                    "Hello " + customer.getName() + ",\n\n" +
                    "Your service appointment is confirmed:\n" +
                    "📅 Date: " + date.format(DateTimeFormatter.ofPattern("dd MMM yyyy")) + "\n" +
                    "⏰ Time: " + time + "\n" +
                    "🔧 Service: " + (serviceType != null ? serviceType : "General Service") + "\n\n" +
                    "📍 7Gears Motors, Selaiyur, Tambaram, Chennai\n" +
                    "📞 +91 78260 47847\n\n" +
                    "_Please arrive 5 minutes early. Reply CANCEL to cancel._";
            whatsAppService.send(customer.getPhone(), msg);
        } catch (Exception e) {
            // Don't fail appointment creation if WhatsApp fails
        }
        return appt;
    }

    @Transactional
    public Appointment updateStatus(Long id, AppointmentStatus status) {
        Appointment appt = findById(id);
        appt.setStatus(status);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void delete(Long id) { appointmentRepository.deleteById(id); }
}
