package com.idthirdeye.timesheet.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank(message = "Employee ID or Username is required")
    private String employeeId;

    @NotBlank(message = "Email is required")
    private String email;
}
