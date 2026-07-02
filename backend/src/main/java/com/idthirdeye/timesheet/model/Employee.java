package com.idthirdeye.timesheet.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @Column(name = "employee_id")
    private String employeeId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String department;
    private String designation;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String status; // "ACTIVE", "DISABLED"

    @Column(nullable = false)
    private String role; // "ADMIN", "EMPLOYEE"

    @Column(name = "comp_off_balance", nullable = false)
    @Builder.Default
    private Double compOffBalance = 0.0;

    @Column(name = "profile_picture_base64", columnDefinition = "TEXT")
    private String profilePictureBase64;
}
