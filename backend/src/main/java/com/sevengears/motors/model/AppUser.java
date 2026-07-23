package com.sevengears.motors.model;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "app_users")
public class AppUser implements UserDetails {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column
    private String displayName;

    public AppUser() {}

    public AppUser(String username, String password, UserRole role, String displayName) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.displayName = displayName;
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public String getPassword()  { return password; }
    @Override public String getUsername()  { return username; }
    @Override public boolean isAccountNonExpired()   { return true; }
    @Override public boolean isAccountNonLocked()    { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()             { return true; }

    public Long     getId()          { return id; }
    public UserRole getRole()        { return role; }
    public String   getDisplayName() { return displayName; }
    public void setUsername(String u)    { this.username = u; }
    public void setRole(UserRole r)      { this.role = r; }
    public void setDisplayName(String d) { this.displayName = d; }
    public void setPassword(String p)    { this.password = p; }
}
