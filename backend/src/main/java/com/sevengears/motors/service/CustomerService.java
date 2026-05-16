package com.sevengears.motors.service;

import com.sevengears.motors.dto.CustomerDTO;
import com.sevengears.motors.model.Customer;
import com.sevengears.motors.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> findAll() {
        return customerRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDTO findById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        return toDTO(c);
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> search(String query) {
        return customerRepository.search(query).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public CustomerDTO create(CustomerDTO dto) {
        if (customerRepository.findByPhone(dto.getPhone()).isPresent())
            throw new RuntimeException("Customer with phone " + dto.getPhone() + " already exists");
        return toDTO(customerRepository.save(toEntity(dto)));
    }

    @Transactional
    public CustomerDTO update(Long id, CustomerDTO dto) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        c.setName(dto.getName());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        c.setAddress(dto.getAddress());
        return toDTO(customerRepository.save(c));
    }

    @Transactional
    public void delete(Long id) { customerRepository.deleteById(id); }

    public CustomerDTO toDTO(Customer c) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setPhone(c.getPhone());
        dto.setEmail(c.getEmail());
        dto.setAddress(c.getAddress());
        if (c.getCreatedAt() != null) dto.setCreatedAt(c.getCreatedAt().toString());
        dto.setVehicleCount(c.getVehicles() != null ? c.getVehicles().size() : 0);
        return dto;
    }

    private Customer toEntity(CustomerDTO dto) {
        Customer c = new Customer();
        c.setName(dto.getName());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        c.setAddress(dto.getAddress());
        return c;
    }
}
