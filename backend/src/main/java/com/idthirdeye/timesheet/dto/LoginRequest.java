package com.idthirdeye.timesheet.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username or Employee ID is required")
    private String usernameOrId;

    @NotBlank(message = "Password is required")
    private String password;
}
