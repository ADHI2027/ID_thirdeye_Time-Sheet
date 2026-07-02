package com.idthirdeye.timesheet.controller;

import com.idthirdeye.timesheet.model.Attendance;
import com.idthirdeye.timesheet.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<?> clockIn(Principal principal) {
        try {
            Attendance attendance = attendanceService.clockIn(principal.getName());
            return ResponseEntity.ok(attendance);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/warning")
    public ResponseEntity<?> getClockOutWarning(Principal principal) {
        try {
            Map<String, Object> warning = attendanceService.getClockOutWarning(principal.getName());
            return ResponseEntity.ok(warning);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/clock-out")
    public ResponseEntity<?> clockOut(Principal principal, @RequestParam(defaultValue = "false") boolean useCompOff) {
        try {
            Attendance attendance = attendanceService.clockOut(principal.getName(), useCompOff);
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getTodayStatus(Principal principal) {
        return attendanceService.getTodayAttendance(principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok().build()); // Returns 200 with empty body if not clocked in
    }

    @GetMapping("/history")
    public ResponseEntity<List<Attendance>> getPersonalHistory(Principal principal) {
        List<Attendance> history = attendanceService.getEmployeeHistory(principal.getName());
        return ResponseEntity.ok(history);
    }
}
