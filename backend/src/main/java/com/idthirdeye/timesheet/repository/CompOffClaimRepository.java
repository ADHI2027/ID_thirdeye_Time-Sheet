package com.idthirdeye.timesheet.repository;

import com.idthirdeye.timesheet.model.CompOffClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompOffClaimRepository extends JpaRepository<CompOffClaim, Long> {
    List<CompOffClaim> findByEmployeeIdOrderByWorkedDateDesc(String employeeId);
    
    List<CompOffClaim> findByStatusOrderByCreatedAtDesc(String status);
    
    long countByStatus(String status);

    Optional<CompOffClaim> findByEmployeeIdAndWorkedDate(String employeeId, LocalDate workedDate);
}
