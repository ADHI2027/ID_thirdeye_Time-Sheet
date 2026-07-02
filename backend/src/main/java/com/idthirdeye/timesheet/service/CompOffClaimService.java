package com.idthirdeye.timesheet.service;

import com.idthirdeye.timesheet.model.CompOffClaim;
import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.repository.CompOffClaimRepository;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class CompOffClaimService {

    private final CompOffClaimRepository compOffClaimRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayService holidayService;
    private final SettingService settingService;
    private final AuditLogService auditLogService;

    public CompOffClaimService(CompOffClaimRepository compOffClaimRepository,
                               EmployeeRepository employeeRepository,
                               HolidayService holidayService,
                               SettingService settingService,
                               AuditLogService auditLogService) {
        this.compOffClaimRepository = compOffClaimRepository;
        this.employeeRepository = employeeRepository;
        this.holidayService = holidayService;
        this.settingService = settingService;
        this.auditLogService = auditLogService;
    }

    private boolean isWeekend(LocalDate date) {
        String weekendSetting = settingService.getSetting("weekend_days", "SATURDAY,SUNDAY");
        String dayOfWeek = date.getDayOfWeek().name();
        return Arrays.stream(weekendSetting.split(","))
                .map(String::trim)
                .anyMatch(day -> day.equalsIgnoreCase(dayOfWeek));
    }

    @Transactional
    public CompOffClaim submitClaim(String employeeId, LocalDate workedDate, Double hours, String reason) {
        // Check if worked date is in the future
        if (workedDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot claim comp-off for a future date.");
        }

        // Check if date is actually a weekend or public holiday
        boolean isWeekend = isWeekend(workedDate);
        boolean isHoliday = holidayService.isPublicHoliday(workedDate);

        if (!isWeekend && !isHoliday) {
            throw new IllegalArgumentException("Comp-off can only be claimed for work done on weekends or public holidays.");
        }

        // Check for duplicate claim
        if (compOffClaimRepository.findByEmployeeIdAndWorkedDate(employeeId, workedDate).isPresent()) {
            throw new IllegalArgumentException("A claim has already been submitted for this date: " + workedDate);
        }

        CompOffClaim claim = CompOffClaim.builder()
                .employeeId(employeeId)
                .workedDate(workedDate)
                .hours(hours)
                .reason(reason)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        CompOffClaim savedClaim = compOffClaimRepository.save(claim);
        auditLogService.log(employeeId, "CLAIM_SUBMITTED", "Submitted Comp-Off claim of " + hours + " hours for date " + workedDate);
        return savedClaim;
    }

    public List<CompOffClaim> getEmployeeClaims(String employeeId) {
        return compOffClaimRepository.findByEmployeeIdOrderByWorkedDateDesc(employeeId);
    }

    public List<CompOffClaim> getPendingClaims() {
        return compOffClaimRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public List<CompOffClaim> getAllClaims() {
        return compOffClaimRepository.findAll();
    }

    @Transactional
    public CompOffClaim approveClaim(Long claimId, String adminId) {
        CompOffClaim claim = compOffClaimRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found with ID: " + claimId));

        if (!"PENDING".equals(claim.getStatus())) {
            throw new IllegalStateException("Claim has already been processed.");
        }

        Employee employee = employeeRepository.findById(claim.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + claim.getEmployeeId()));

        claim.setStatus("APPROVED");
        compOffClaimRepository.save(claim);

        // Update employee comp-off balance
        employee.setCompOffBalance(employee.getCompOffBalance() + claim.getHours());
        employeeRepository.save(employee);

        auditLogService.log(claim.getEmployeeId(), "CLAIM_APPROVED", 
                "Comp-Off claim of " + claim.getHours() + " hours approved by Admin " + adminId + " for date " + claim.getWorkedDate());
        
        return claim;
    }

    @Transactional
    public CompOffClaim rejectClaim(Long claimId, String adminId) {
        CompOffClaim claim = compOffClaimRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found with ID: " + claimId));

        if (!"PENDING".equals(claim.getStatus())) {
            throw new IllegalStateException("Claim has already been processed.");
        }

        claim.setStatus("REJECTED");
        compOffClaimRepository.save(claim);

        auditLogService.log(claim.getEmployeeId(), "CLAIM_REJECTED", 
                "Comp-Off claim of " + claim.getHours() + " hours rejected by Admin " + adminId + " for date " + claim.getWorkedDate());
        
        return claim;
    }
}
