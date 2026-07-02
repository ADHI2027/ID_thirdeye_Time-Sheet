package com.idthirdeye.timesheet.service;

import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           AuditLogService auditLogService) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public Optional<Employee> getEmployeeById(String id) {
        return employeeRepository.findById(id);
    }

    public Page<Employee> searchEmployees(String search, String department, String status, int page, int size) {
        return employeeRepository.searchEmployees(
                (search == null || search.trim().isEmpty()) ? null : search.trim(),
                (department == null || department.trim().isEmpty()) ? null : department.trim(),
                (status == null || status.trim().isEmpty()) ? null : status.trim(),
                PageRequest.of(page, size, Sort.by("employeeId").ascending())
        );
    }

    @Transactional
    public Employee createEmployee(Employee employee, String adminId) {
        if (employeeRepository.existsById(employee.getEmployeeId())) {
            throw new IllegalArgumentException("Employee ID already exists: " + employee.getEmployeeId());
        }
        if (employeeRepository.findByEmail(employee.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists: " + employee.getEmail());
        }

        employee.setPasswordHash(passwordEncoder.encode(employee.getPasswordHash()));
        employee.setCompOffBalance(0.0);
        Employee saved = employeeRepository.save(employee);
        
        auditLogService.log(employee.getEmployeeId(), "EMPLOYEE_CREATED", 
                "Account created by Admin " + adminId + " (Role: " + employee.getRole() + ")");
        return saved;
    }

    @Transactional
    public Employee updateEmployee(String employeeId, Employee details, String adminId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        // Check unique email if changing
        if (!employee.getEmail().equalsIgnoreCase(details.getEmail())) {
            Optional<Employee> existingEmail = employeeRepository.findByEmail(details.getEmail());
            if (existingEmail.isPresent()) {
                throw new IllegalArgumentException("Email already exists: " + details.getEmail());
            }
        }

        employee.setName(details.getName());
        employee.setEmail(details.getEmail());
        employee.setDepartment(details.getDepartment());
        employee.setDesignation(details.getDesignation());
        employee.setRole(details.getRole());

        Employee saved = employeeRepository.save(employee);
        auditLogService.log(employeeId, "EMPLOYEE_UPDATED", "Account details updated by Admin " + adminId);
        return saved;
    }

    @Transactional
    public void deleteEmployee(String employeeId, String adminId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new IllegalArgumentException("Employee not found with ID: " + employeeId);
        }
        employeeRepository.deleteById(employeeId);
        auditLogService.log(employeeId, "EMPLOYEE_DELETED", "Account deleted by Admin " + adminId);
    }

    @Transactional
    public void resetPassword(String employeeId, String newPassword, String adminId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
        
        auditLogService.log(employeeId, "PASSWORD_RESET_BY_ADMIN", "Password reset by Admin " + adminId);
    }

    @Transactional
    public void toggleStatus(String employeeId, String adminId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        String newStatus = "ACTIVE".equalsIgnoreCase(employee.getStatus()) ? "DISABLED" : "ACTIVE";
        employee.setStatus(newStatus);
        employeeRepository.save(employee);

        auditLogService.log(employeeId, "STATUS_TOGGLED", "Account status changed to " + newStatus + " by Admin " + adminId);
    }

    @Transactional
    public void changePassword(String employeeId, String currentPassword, String newPassword) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match.");
        }

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
        
        auditLogService.log(employeeId, "PASSWORD_CHANGED", "Password changed by employee.");
    }

    @Transactional
    public void forgotPasswordRequest(String employeeId, String email) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));

        if (!employee.getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Invalid Employee ID or Email.");
        }

        auditLogService.log(employeeId, "FORGOT_PASSWORD_REQUEST", "Password recovery requested for ID " + employeeId + " and Email " + email);
    }

    @Transactional
    public void uploadProfilePicture(String employeeId, String base64Image) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        employee.setProfilePictureBase64(base64Image);
        employeeRepository.save(employee);
        
        auditLogService.log(employeeId, "PROFILE_PIC_UPLOADED", "Uploaded profile picture.");
    }
}
