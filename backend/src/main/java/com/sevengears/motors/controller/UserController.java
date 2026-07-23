package com.sevengears.motors.controller;

import com.sevengears.motors.model.AppUser;
import com.sevengears.motors.model.UserRole;
import com.sevengears.motors.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null || username.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        if (userRepository.existsByUsername(username.trim()))
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        String password = body.getOrDefault("password", username);
        UserRole role = parseRole(body.get("role"));
        AppUser user = new AppUser(
                username.trim(),
                passwordEncoder.encode(password),
                role,
                body.getOrDefault("displayName", username.trim())
        );
        return ResponseEntity.ok(toMap(userRepository.save(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        if (body.containsKey("displayName") && !body.get("displayName").isBlank())
            user.setDisplayName(body.get("displayName").trim());
        if (body.containsKey("role") && !body.get("role").isBlank())
            user.setRole(parseRole(body.get("role")));
        if (body.containsKey("password") && !body.get("password").isBlank())
            user.setPassword(passwordEncoder.encode(body.get("password")));
        return ResponseEntity.ok(toMap(userRepository.save(user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!userRepository.existsById(id))
            return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toMap(AppUser u) {
        return Map.of(
                "id",          u.getId(),
                "username",    u.getUsername(),
                "displayName", u.getDisplayName() != null ? u.getDisplayName() : u.getUsername(),
                "role",        u.getRole().name()
        );
    }

    private UserRole parseRole(String r) {
        try { return UserRole.valueOf(r); } catch (Exception e) { return UserRole.MECHANIC; }
    }
}
