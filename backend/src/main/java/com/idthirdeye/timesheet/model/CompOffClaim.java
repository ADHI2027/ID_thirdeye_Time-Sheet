package com.idthirdeye.timesheet.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "comp_off_claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompOffClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "claim_id")
    private Long claimId;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "worked_date", nullable = false)
    private LocalDate workedDate;

    @Column(nullable = false)
    private Double hours;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING"; // "PENDING", "APPROVED", "REJECTED"

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
