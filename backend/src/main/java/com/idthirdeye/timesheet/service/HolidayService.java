package com.idthirdeye.timesheet.service;

import com.idthirdeye.timesheet.model.Holiday;
import com.idthirdeye.timesheet.repository.HolidayRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public HolidayService(HolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAllByOrderByDateAsc();
    }

    public Holiday addHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    public void deleteHoliday(Long holidayId) {
        holidayRepository.deleteById(holidayId);
    }

    public boolean isPublicHoliday(LocalDate date) {
        return holidayRepository.findByDate(date).isPresent();
    }

    public Optional<Holiday> getHolidayByDate(LocalDate date) {
        return holidayRepository.findByDate(date);
    }
}
