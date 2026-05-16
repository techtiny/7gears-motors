package com.sevengears.motors.service;

import com.sevengears.motors.dto.VehicleDTO;
import com.sevengears.motors.model.Customer;
import com.sevengears.motors.model.Vehicle;
import com.sevengears.motors.repository.CustomerRepository;
import com.sevengears.motors.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;

    public VehicleService(VehicleRepository vehicleRepository, CustomerRepository customerRepository) {
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleDTO> findAll() {
        return vehicleRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleDTO findById(Long id) {
        return toDTO(vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<VehicleDTO> findByCustomer(Long customerId) {
        return vehicleRepository.findByCustomerId(customerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleDTO> search(String query) {
        return vehicleRepository.search(query).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public VehicleDTO create(VehicleDTO dto) {
        if (vehicleRepository.findByRegistrationNumber(dto.getRegistrationNumber()).isPresent())
            throw new RuntimeException("Vehicle with registration " + dto.getRegistrationNumber() + " already exists");
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return toDTO(vehicleRepository.save(toEntity(dto, customer)));
    }

    @Transactional
    public VehicleDTO update(Long id, VehicleDTO dto) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + id));
        v.setRegistrationNumber(dto.getRegistrationNumber());
        v.setMake(dto.getMake());
        v.setModel(dto.getModel());
        v.setYear(dto.getYear());
        v.setColor(dto.getColor());
        v.setFuelType(dto.getFuelType());
        if (dto.getCustomerId() != null) {
            Customer c = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            v.setCustomer(c);
        }
        return toDTO(vehicleRepository.save(v));
    }

    @Transactional
    public void delete(Long id) { vehicleRepository.deleteById(id); }

    public VehicleDTO toDTO(Vehicle v) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(v.getId());
        dto.setRegistrationNumber(v.getRegistrationNumber());
        dto.setMake(v.getMake());
        dto.setModel(v.getModel());
        dto.setYear(v.getYear());
        dto.setColor(v.getColor());
        dto.setFuelType(v.getFuelType());
        if (v.getCustomer() != null) {
            dto.setCustomerId(v.getCustomer().getId());
            dto.setCustomerName(v.getCustomer().getName());
            dto.setCustomerPhone(v.getCustomer().getPhone());
        }
        if (v.getCreatedAt() != null) dto.setCreatedAt(v.getCreatedAt().toString());
        return dto;
    }

    private Vehicle toEntity(VehicleDTO dto, Customer customer) {
        Vehicle v = new Vehicle();
        v.setRegistrationNumber(dto.getRegistrationNumber().toUpperCase().trim());
        v.setMake(dto.getMake());
        v.setModel(dto.getModel());
        v.setYear(dto.getYear());
        v.setColor(dto.getColor());
        v.setFuelType(dto.getFuelType());
        v.setCustomer(customer);
        return v;
    }
}
