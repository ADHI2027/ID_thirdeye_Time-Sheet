package com.idthirdeye.timesheet.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long attendanceId;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "clock_in")
    private LocalDateTime clockIn;

    @Column(name = "clock_out")
    private LocalDateTime clockOut;

    @Column(name = "worked_minutes")
    private Integer workedMinutes;

    @Column(nullable = false)
    private String status; // "WORKING", "COMPLETED", "INCOMPLETE", "WEEKEND_WORK", "HOLIDAY_WORK", "ABSENT"

    @Column(name = "is_holiday", nullable = false)
    @Builder.Default
    private Boolean isHoliday = false;

    @Column(name = "is_weekend", nullable = false)
    @Builder.Default
    private Boolean isWeekend = false;

    @Column(name = "comp_off_earned", nullable = false)
    @Builder.Default
    private Double compOffEarned = 0.0;

    @Column(name = "comp_off_used", nullable = false)
    @Builder.Default
    private Double compOffUsed = 0.0;
}
