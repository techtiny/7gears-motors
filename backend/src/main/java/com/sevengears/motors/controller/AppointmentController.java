package com.sevengears.motors.controller;

import com.sevengears.motors.model.*;
import com.sevengears.motors.service.AppointmentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    public AppointmentController(AppointmentService appointmentService) { this.appointmentService = appointmentService; }

    @GetMapping
    public ResponseEntity<List<Appointment>> findAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long customerId) {
        if (date != null) return ResponseEntity.ok(appointmentService.findByDate(date));
        if (from != null && to != null) return ResponseEntity.ok(appointmentService.findByRange(from, to));
        if (customerId != null) return ResponseEntity.ok(appointmentService.findByCustomer(customerId));
        return ResponseEntity.ok(appointmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> findById(@PathVariable Long id) { return ResponseEntity.ok(appointmentService.findById(id)); }

    @PostMapping
    public ResponseEntity<Appointment> create(@RequestBody Map<String, Object> body) {
        Long customerId = Long.valueOf(body.get("customerId").toString());
        Long vehicleId  = body.get("vehicleId") != null ? Long.valueOf(body.get("vehicleId").toString()) : null;
        LocalDate date  = LocalDate.parse(body.get("date").toString());
        String time     = body.get("time").toString();
        String service  = body.get("serviceType") != null ? body.get("serviceType").toString() : null;
        String notes    = body.get("notes") != null ? body.get("notes").toString() : null;
        return ResponseEntity.ok(appointmentService.create(customerId, vehicleId, date, time, service, notes));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, AppointmentStatus.valueOf(body.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { appointmentService.delete(id); return ResponseEntity.noContent().build(); }
}
