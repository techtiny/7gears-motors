package com.sevengears.motors.config;

import com.sevengears.motors.model.AppUser;
import com.sevengears.motors.model.UserRole;
import com.sevengears.motors.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        createIfAbsent("shobana",  "shobana",  UserRole.CEO,      "Shobana");
        createIfAbsent("arun",     "arun",     UserRole.CEO,      "Arun");
        createIfAbsent("sakthis",  "sakthis",  UserRole.CEO,      "Sakthis");
        createIfAbsent("bharath",  "bharath",  UserRole.CEO,      "Bharath");
        createIfAbsent("srithar",  "srithar",  UserRole.ADMIN,    "Srithar");
        createIfAbsent("mech1",    "mech1",    UserRole.MECHANIC, "Mechanic 1");
        createIfAbsent("mech2",    "mech2",    UserRole.MECHANIC, "Mechanic 2");
        createIfAbsent("mech3",    "mech3",    UserRole.MECHANIC, "Mechanic 3");
    }

    private void createIfAbsent(String username, String rawPassword, UserRole role, String displayName) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(new AppUser(username, passwordEncoder.encode(rawPassword), role, displayName));
        }
    }
}
