package com.idthirdeye.timesheet.service;

import com.idthirdeye.timesheet.model.Setting;
import com.idthirdeye.timesheet.repository.SettingRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SettingService {

    private final SettingRepository settingRepository;

    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public String getSetting(String key, String defaultValue) {
        return settingRepository.findById(key)
                .map(Setting::getSettingValue)
                .orElse(defaultValue);
    }

    public void updateSetting(String key, String value) {
        Setting setting = Setting.builder()
                .settingKey(key)
                .settingValue(value)
                .build();
        settingRepository.save(setting);
    }

    public List<Setting> getAllSettings() {
        return settingRepository.findAll();
    }
}
