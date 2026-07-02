package com.idthirdeye.timesheet.repository;

import com.idthirdeye.timesheet.model.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndDate(String employeeId, LocalDate date);
    
    List<Attendance> findByEmployeeIdOrderByDateDesc(String employeeId);
    
    List<Attendance> findByEmployeeIdAndDateBetweenOrderByDateAsc(String employeeId, LocalDate startDate, LocalDate endDate);
    
    long countByDate(LocalDate date);
    
    long countByDateAndStatus(LocalDate date, String status);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date = :date AND a.status IN ('WEEKEND_WORK')")
    long countWeekendWorkers(@Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date = :date AND a.status IN ('HOLIDAY_WORK')")
    long countHolidayWorkers(@Param("date") LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:employeeId IS NULL OR a.employeeId = :employeeId) AND " +
           "(:startDate IS NULL OR a.date >= :startDate) AND " +
           "(:endDate IS NULL OR a.date <= :endDate) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Attendance> filterAttendance(
            @Param("employeeId") String employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT a FROM Attendance a WHERE " +
           "(:employeeId IS NULL OR a.employeeId = :employeeId) AND " +
           "(:startDate IS NULL OR a.date >= :startDate) AND " +
           "(:endDate IS NULL OR a.date <= :endDate)")
    List<Attendance> filterAttendanceList(
            @Param("employeeId") String employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
