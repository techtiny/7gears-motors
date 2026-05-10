package com.sevengears.motors.repository;

import com.sevengears.motors.model.Appointment;
import com.sevengears.motors.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByAppointmentDateOrderByAppointmentTimeAsc(LocalDate date);
    List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(LocalDate from, LocalDate to);
    List<Appointment> findByStatusOrderByAppointmentDateAsc(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :date AND a.reminderSent = false AND a.status = 'SCHEDULED'")
    List<Appointment> findUnsentRemindersForDate(LocalDate date);

    List<Appointment> findByCustomerIdOrderByAppointmentDateDesc(Long customerId);
}
