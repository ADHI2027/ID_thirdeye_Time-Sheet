package com.idthirdeye.timesheet.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // Setting Spring Boot application timezone to Asia/Kolkata (Indian Standard Time)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        System.out.println("Spring Boot Application running in timezone: " + TimeZone.getDefault().getID());
    }
}
