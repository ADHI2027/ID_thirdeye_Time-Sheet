package com.idthirdeye.timesheet.repository;

import com.idthirdeye.timesheet.model.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    Optional<Holiday> findByDate(LocalDate date);
    
    List<Holiday> findAllByOrderByDateAsc();
}
