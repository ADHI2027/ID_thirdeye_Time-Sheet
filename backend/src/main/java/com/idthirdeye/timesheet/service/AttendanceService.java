package com.idthirdeye.timesheet.service;

import com.idthirdeye.timesheet.model.Attendance;
import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.repository.AttendanceRepository;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayService holidayService;
    private final SettingService settingService;
    private final AuditLogService auditLogService;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EmployeeRepository employeeRepository,
                             HolidayService holidayService,
                             SettingService settingService,
                             AuditLogService auditLogService) {
        this.attendanceRepository = attendanceRepository;
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

    public Optional<Attendance> getTodayAttendance(String employeeId) {
        return attendanceRepository.findByEmployeeIdAndDate(employeeId, LocalDate.now());
    }

    @Transactional
    public Attendance clockIn(String employeeId) {
        LocalDate today = LocalDate.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);

        if (existing.isPresent()) {
            Attendance att = existing.get();
            if ("WORKING".equals(att.getStatus()) || "WEEKEND_WORK".equals(att.getStatus()) || "HOLIDAY_WORK".equals(att.getStatus())) {
                throw new IllegalStateException("You are already clocked in for today.");
            }
            throw new IllegalStateException("You have already completed your attendance for today.");
        }

        boolean isWeekend = isWeekend(today);
        boolean isHoliday = holidayService.isPublicHoliday(today);

        String status = "WORKING";
        if (isHoliday) {
            status = "HOLIDAY_WORK";
        } else if (isWeekend) {
            status = "WEEKEND_WORK";
        }

        Attendance attendance = Attendance.builder()
                .employeeId(employeeId)
                .date(today)
                .clockIn(LocalDateTime.now())
                .status(status)
                .isHoliday(isHoliday)
                .isWeekend(isWeekend)
                .compOffEarned(0.0)
                .compOffUsed(0.0)
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        auditLogService.log(employeeId, "CLOCK_IN", "Clocked in at " + saved.getClockIn() + " (Status: " + status + ")");
        return saved;
    }

    public Map<String, Object> getClockOutWarning(String employeeId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalArgumentException("No clock-in record found for today."));

        if (!List.of("WORKING", "WEEKEND_WORK", "HOLIDAY_WORK").contains(attendance.getStatus())) {
            throw new IllegalStateException("Employee is not currently clocked in.");
        }

        LocalDateTime now = LocalDateTime.now();
        long minutesWorked = Duration.between(attendance.getClockIn(), now).toMinutes();
        double hoursWorked = minutesWorked / 60.0;

        double minRequiredHours = Double.parseDouble(settingService.getSetting("min_working_hours", "6.0"));
        long minRequiredMinutes = (long) (minRequiredHours * 60);

        boolean showWarning = false;
        long remainingMinutes = 0;

        // Warnings apply to regular weekdays ("WORKING")
        if ("WORKING".equals(attendance.getStatus()) && minutesWorked < minRequiredMinutes) {
            showWarning = true;
            remainingMinutes = minRequiredMinutes - minutesWorked;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("showWarning", showWarning);
        result.put("minutesWorked", minutesWorked);
        result.put("hoursWorked", hoursWorked);
        result.put("remainingMinutes", remainingMinutes);
        result.put("minRequiredHours", minRequiredHours);
        return result;
    }

    @Transactional
    public Attendance clockOut(String employeeId, boolean useCompOff) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalArgumentException("No clock-in record found for today."));

        if (!List.of("WORKING", "WEEKEND_WORK", "HOLIDAY_WORK").contains(attendance.getStatus())) {
            throw new IllegalStateException("You are not currently clocked in.");
        }

        LocalDateTime clockOutTime = LocalDateTime.now();
        attendance.setClockOut(clockOutTime);

        long minutesWorked = Duration.between(attendance.getClockIn(), clockOutTime).toMinutes();
        attendance.setWorkedMinutes((int) minutesWorked);
        double hoursWorked = minutesWorked / 60.0;

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        if ("WORKING".equals(attendance.getStatus())) {
            double minRequiredHours = Double.parseDouble(settingService.getSetting("min_working_hours", "6.0"));
            long minRequiredMinutes = (long) (minRequiredHours * 60);

            if (minutesWorked >= minRequiredMinutes) {
                attendance.setStatus("COMPLETED");
            } else {
                // Short hours: deduct comp-off only if employee chose to
                long missingMinutes = minRequiredMinutes - minutesWorked;
                double missingHours = missingMinutes / 60.0;

                if (useCompOff && employee.getCompOffBalance() >= missingHours) {
                    // Deduct comp-off (employee chose to use it)
                    employee.setCompOffBalance(employee.getCompOffBalance() - missingHours);
                    employeeRepository.save(employee);

                    attendance.setCompOffUsed(missingHours);
                    attendance.setStatus("COMPLETED");

                    auditLogService.log(employeeId, "COMP_OFF_DEDUCTED", 
                            String.format("Employee chose to deduct %.2f hours from Comp-Off balance to complete daily requirement.", missingHours));
                } else {
                    // Employee chose not to use comp-off, or insufficient balance
                    attendance.setStatus("INCOMPLETE");
                }
            }
        } else if ("WEEKEND_WORK".equals(attendance.getStatus()) || "HOLIDAY_WORK".equals(attendance.getStatus())) {
            // Worked on holiday/weekend. They earn the worked hours as claimable comp-off.
            attendance.setCompOffEarned(hoursWorked);
            // The attendance status stays WEEKEND_WORK or HOLIDAY_WORK for styling on calendar
        }

        Attendance saved = attendanceRepository.save(attendance);
        auditLogService.log(employeeId, "CLOCK_OUT", String.format("Clocked out at %s. Worked: %d mins. Status: %s", 
                clockOutTime, minutesWorked, saved.getStatus()));
        return saved;
    }

    public List<Attendance> getEmployeeHistory(String employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }

    public List<Attendance> getEmployeeHistoryBetween(String employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(employeeId, start, end);
    }

    public Page<Attendance> getAllAttendanceFiltered(String employeeId, LocalDate start, LocalDate end, String status, int page, int size) {
        return attendanceRepository.filterAttendance(employeeId, start, end, status, PageRequest.of(page, size, Sort.by("date").descending()));
    }

    public List<Attendance> getAllAttendanceListFiltered(String employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.filterAttendanceList(employeeId, start, end);
    }
}
