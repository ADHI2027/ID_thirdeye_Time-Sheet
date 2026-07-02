package com.idthirdeye.timesheet.util;

import com.idthirdeye.timesheet.model.Attendance;
import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import com.opencsv.CSVWriter;
import org.springframework.stereotype.Component;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CsvExporter {

    private final EmployeeRepository employeeRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    public CsvExporter(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public void exportAttendanceToCsv(PrintWriter writer, List<Attendance> attendanceList) {
        // Fetch all employee details for quick name mapping
        Map<String, String> employeeNames = employeeRepository.findAll().stream()
                .collect(Collectors.toMap(Employee::getEmployeeId, Employee::getName, (a, b) -> a));

        try (CSVWriter csvWriter = new CSVWriter(writer)) {
            // Write Header
            String[] header = {
                    "Employee ID", "Employee Name", "Date", 
                    "Clock In", "Clock Out", "Worked Hours", 
                    "Status", "Comp-Off Earned", "Comp-Off Used", 
                    "Is Holiday", "Is Weekend"
            };
            csvWriter.writeNext(header);

            // Write Rows
            for (Attendance attendance : attendanceList) {
                String name = employeeNames.getOrDefault(attendance.getEmployeeId(), "Unknown");
                
                String clockInStr = attendance.getClockIn() != null ? 
                        attendance.getClockIn().format(TIME_FORMATTER) : "N/A";
                        
                String clockOutStr = attendance.getClockOut() != null ? 
                        attendance.getClockOut().format(TIME_FORMATTER) : "N/A";
                        
                double workedHours = attendance.getWorkedMinutes() != null ? 
                        attendance.getWorkedMinutes() / 60.0 : 0.0;

                String[] data = {
                        attendance.getEmployeeId(),
                        name,
                        attendance.getDate().format(DATE_FORMATTER),
                        clockInStr,
                        clockOutStr,
                        String.format("%.2f", workedHours),
                        attendance.getStatus(),
                        String.format("%.2f", attendance.getCompOffEarned()),
                        String.format("%.2f", attendance.getCompOffUsed()),
                        attendance.getIsHoliday() ? "YES" : "NO",
                        attendance.getIsWeekend() ? "YES" : "NO"
                };
                csvWriter.writeNext(data);
            }
        } catch (Exception e) {
            System.err.println("Failed to write CSV: " + e.getMessage());
        }
    }
}
