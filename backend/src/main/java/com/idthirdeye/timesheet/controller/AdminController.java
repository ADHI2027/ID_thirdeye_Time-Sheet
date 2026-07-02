package com.idthirdeye.timesheet.controller;

import com.idthirdeye.timesheet.model.Attendance;
import com.idthirdeye.timesheet.model.AuditLog;
import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.repository.AttendanceRepository;
import com.idthirdeye.timesheet.repository.AuditLogRepository;
import com.idthirdeye.timesheet.repository.CompOffClaimRepository;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import com.idthirdeye.timesheet.service.AttendanceService;
import com.idthirdeye.timesheet.service.EmployeeService;
import com.idthirdeye.timesheet.util.CsvExporter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.security.Principal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final CsvExporter csvExporter;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final CompOffClaimRepository compOffClaimRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminController(EmployeeService employeeService,
                           AttendanceService attendanceService,
                           CsvExporter csvExporter,
                           EmployeeRepository employeeRepository,
                           AttendanceRepository attendanceRepository,
                           CompOffClaimRepository compOffClaimRepository,
                           AuditLogRepository auditLogRepository) {
        this.employeeService = employeeService;
        this.attendanceService = attendanceService;
        this.csvExporter = csvExporter;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.compOffClaimRepository = compOffClaimRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // 1. Employee Management CRUD
    @GetMapping("/employees")
    public ResponseEntity<Page<Employee>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Employee> employees = employeeService.searchEmployees(search, department, status, page, size);
        return ResponseEntity.ok(employees);
    }

    @PostMapping("/employees")
    public ResponseEntity<?> createEmployee(@RequestBody Employee employee, Principal principal) {
        try {
            Employee saved = employeeService.createEmployee(employee, principal.getName());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable String id, @RequestBody Employee employee, Principal principal) {
        try {
            Employee updated = employeeService.updateEmployee(id, employee, principal.getName());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable String id, Principal principal) {
        try {
            employeeService.deleteEmployee(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Employee deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/employees/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable String id, @RequestBody Map<String, String> body, Principal principal) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password is required."));
        }
        try {
            employeeService.resetPassword(id, newPassword, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/employees/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable String id, Principal principal) {
        try {
            employeeService.toggleStatus(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Employee status updated."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 2. Attendance Logging & Filters
    @GetMapping("/attendance")
    public ResponseEntity<Page<Attendance>> getAttendanceLogs(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        LocalDate start = (startDate != null && !startDate.isEmpty()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isEmpty()) ? LocalDate.parse(endDate) : null;

        Page<Attendance> logs = attendanceService.getAllAttendanceFiltered(employeeId, start, end, status, page, size);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/attendance/export")
    public void exportAttendance(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletResponse response) throws IOException {

        LocalDate start = (startDate != null && !startDate.isEmpty()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isEmpty()) ? LocalDate.parse(endDate) : null;

        List<Attendance> list = attendanceService.getAllAttendanceListFiltered(employeeId, start, end);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=attendance_records.csv");

        csvExporter.exportAttendanceToCsv(response.getWriter(), list);
    }

    // 3. Organization-wide Dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        LocalDate today = LocalDate.now();

        long totalEmployees = employeeRepository.count();
        long presentToday = attendanceRepository.countByDate(today);
        
        long workingNow = attendanceRepository.countByDateAndStatus(today, "WORKING")
                + attendanceRepository.countByDateAndStatus(today, "WEEKEND_WORK")
                + attendanceRepository.countByDateAndStatus(today, "HOLIDAY_WORK");
                
        long completedToday = attendanceRepository.countByDateAndStatus(today, "COMPLETED");
        long incompleteToday = attendanceRepository.countByDateAndStatus(today, "INCOMPLETE");
        long absentToday = Math.max(0, totalEmployees - presentToday);

        long holidayWorkers = attendanceRepository.countHolidayWorkers(today);
        long weekendWorkers = attendanceRepository.countWeekendWorkers(today);
        long pendingClaims = compOffClaimRepository.countByStatus("PENDING");

        // Fetch recent activities (audit logs)
        Page<AuditLog> auditLogs = auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, 10));

        // Average working hours calculation (for past 30 days)
        LocalDate thirtyDaysAgo = today.minusDays(30);
        List<Attendance> pastMonthRecords = attendanceRepository.filterAttendanceList(null, thirtyDaysAgo, today);
        double avgWorkingMinutes = pastMonthRecords.stream()
                .filter(a -> a.getWorkedMinutes() != null)
                .mapToInt(Attendance::getWorkedMinutes)
                .average()
                .orElse(0.0);
        double avgWorkingHours = avgWorkingMinutes / 60.0;

        // Weekly attendance details
        LocalDate startOfWeek = today.minusDays(6);
        List<Attendance> pastWeekRecords = attendanceRepository.filterAttendanceList(null, startOfWeek, today);
        Map<LocalDate, Long> recordsByDate = pastWeekRecords.stream()
                .collect(Collectors.groupingBy(Attendance::getDate, Collectors.counting()));

        List<Map<String, Object>> weeklyTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", d.toString());
            dayMap.put("count", recordsByDate.getOrDefault(d, 0L));
            weeklyTrend.add(dayMap);
        }

        // Department breakdown
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<String, Long> employeesPerDept = allEmployees.stream()
                .filter(e -> e.getDepartment() != null)
                .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));

        List<Map<String, Object>> departmentComparison = employeesPerDept.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", entry.getKey());
                    map.put("value", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        // Top Punctual Employees (sorted by worked time in past 30 days)
        Map<String, Double> employeeWorkedHours = pastMonthRecords.stream()
                .filter(a -> a.getWorkedMinutes() != null)
                .collect(Collectors.groupingBy(
                        Attendance::getEmployeeId,
                        Collectors.averagingDouble(a -> a.getWorkedMinutes() / 60.0)
                ));

        List<Map<String, Object>> topPunctual = employeeWorkedHours.entrySet().stream()
                .map(entry -> {
                    Employee emp = employeeRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> map = new HashMap<>();
                    map.put("employeeId", entry.getKey());
                    map.put("name", emp != null ? emp.getName() : "Unknown");
                    map.put("averageHours", String.format("%.2f", entry.getValue()));
                    return map;
                })
                .sorted((a, b) -> Double.compare(
                        Double.parseDouble((String) b.get("averageHours")), 
                        Double.parseDouble((String) a.get("averageHours"))
                ))
                .limit(5)
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("presentToday", presentToday);
        stats.put("workingNow", workingNow);
        stats.put("completedToday", completedToday);
        stats.put("incompleteToday", incompleteToday);
        stats.put("absentToday", absentToday);
        stats.put("holidayWorkers", holidayWorkers);
        stats.put("weekendWorkers", weekendWorkers);
        stats.put("pendingClaims", pendingClaims);
        stats.put("averageWorkingHours", String.format("%.1f", avgWorkingHours));
        stats.put("weeklyTrend", weeklyTrend);
        stats.put("departmentComparison", departmentComparison);
        stats.put("topPunctual", topPunctual);
        stats.put("recentActivities", auditLogs.getContent());

        return ResponseEntity.ok(stats);
    }
}
