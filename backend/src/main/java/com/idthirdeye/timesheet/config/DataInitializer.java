package com.idthirdeye.timesheet.config;

import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.model.Holiday;
import com.idthirdeye.timesheet.model.Setting;
import com.idthirdeye.timesheet.repository.EmployeeRepository;
import com.idthirdeye.timesheet.repository.HolidayRepository;
import com.idthirdeye.timesheet.repository.SettingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final HolidayRepository holidayRepository;
    private final SettingRepository settingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(EmployeeRepository employeeRepository,
                           HolidayRepository holidayRepository,
                           SettingRepository settingRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.holidayRepository = holidayRepository;
        this.settingRepository = settingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Settings
        if (settingRepository.count() == 0) {
            settingRepository.save(new Setting("weekend_days", "SATURDAY,SUNDAY"));
            settingRepository.save(new Setting("min_working_hours", "6.0"));
            System.out.println("Default settings initialized.");
        }

        // 2. Seed Indian Public Holidays for 2026
        if (holidayRepository.count() == 0) {
            List<Holiday> defaultHolidays = Arrays.asList(
                    new Holiday(null, "Republic Day", LocalDate.of(2026, 1, 26)),
                    new Holiday(null, "Independence Day", LocalDate.of(2026, 8, 15)),
                    new Holiday(null, "Gandhi Jayanti", LocalDate.of(2026, 10, 2)),
                    new Holiday(null, "Diwali", LocalDate.of(2026, 11, 8)),
                    new Holiday(null, "Christmas", LocalDate.of(2026, 12, 25))
            );
            holidayRepository.saveAll(defaultHolidays);
            System.out.println("Default Indian public holidays for 2026 initialized.");
        }

        // 3. Seed Users (Admin and Employees)
        if (employeeRepository.count() == 0) {
            // Seed Admin
            Employee admin = Employee.builder()
                    .employeeId("admin")
                    .name("System Administrator")
                    .email("admin@idthirdeye.com")
                    .department("IT Operations")
                    .designation("IT Administrator")
                    .passwordHash(passwordEncoder.encode("AdminPassword123"))
                    .status("ACTIVE")
                    .role("ADMIN")
                    .compOffBalance(0.0)
                    .build();
            employeeRepository.save(admin);

            // Seed Employee 1 (Rohan Sharma)
            Employee emp1 = Employee.builder()
                    .employeeId("EMP001")
                    .name("Rohan Sharma")
                    .email("rohan@idthirdeye.com")
                    .department("Engineering")
                    .designation("Software Engineer")
                    .passwordHash(passwordEncoder.encode("UserPassword123"))
                    .status("ACTIVE")
                    .role("EMPLOYEE")
                    .compOffBalance(5.0) // Give 5 hours to test auto-deduction logic!
                    .build();
            employeeRepository.save(emp1);

            // Seed Employee 2 (Priya Patel)
            Employee emp2 = Employee.builder()
                    .employeeId("EMP002")
                    .name("Priya Patel")
                    .email("priya@idthirdeye.com")
                    .department("Design")
                    .designation("UI/UX Designer")
                    .passwordHash(passwordEncoder.encode("UserPassword123"))
                    .status("ACTIVE")
                    .role("EMPLOYEE")
                    .compOffBalance(0.0)
                    .build();
            employeeRepository.save(emp2);

            System.out.println("Default user accounts (Admin and Employees) seeded successfully.");
        }
    }
}
