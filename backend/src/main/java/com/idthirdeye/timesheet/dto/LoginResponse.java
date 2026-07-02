package com.idthirdeye.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private String employeeId;
    private String name;
    private String role;
    private String email;
    private String department;
    private String designation;
    private String profilePictureBase64;
    private Double compOffBalance;
}
