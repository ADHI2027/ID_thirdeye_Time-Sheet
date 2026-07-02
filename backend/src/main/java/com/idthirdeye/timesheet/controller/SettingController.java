package com.idthirdeye.timesheet.controller;

import com.idthirdeye.timesheet.model.Setting;
import com.idthirdeye.timesheet.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<List<Setting>> getSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @PostMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> settingsMap) {
        try {
            settingsMap.forEach(settingService::updateSetting);
            return ResponseEntity.ok(Map.of("message", "Settings updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to update settings: " + e.getMessage()));
        }
    }
}
