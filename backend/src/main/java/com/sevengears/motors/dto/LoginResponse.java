package com.sevengears.motors.dto;

public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private String displayName;

    public LoginResponse(String token, String username, String role, String displayName) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.displayName = displayName;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public String getDisplayName() { return displayName; }
}
