package com.idthirdeye.timesheet.controller;

import com.idthirdeye.timesheet.dto.ChangePasswordRequest;
import com.idthirdeye.timesheet.dto.ForgotPasswordRequest;
import com.idthirdeye.timesheet.dto.LoginRequest;
import com.idthirdeye.timesheet.dto.LoginResponse;
import com.idthirdeye.timesheet.model.Employee;
import com.idthirdeye.timesheet.security.JwtUtil;
import com.idthirdeye.timesheet.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmployeeService employeeService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          EmployeeService employeeService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.employeeService = employeeService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrId(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Employee employee = employeeService.getEmployeeById(loginRequest.getUsernameOrId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if ("DISABLED".equalsIgnoreCase(employee.getStatus())) {
                return ResponseEntity.status(403).body(Map.of("message", "Your account has been disabled. Contact admin."));
            }

            String token = jwtUtil.generateToken(employee.getEmployeeId(), employee.getRole());

            LoginResponse response = LoginResponse.builder()
                    .token(token)
                    .employeeId(employee.getEmployeeId())
                    .name(employee.getName())
                    .role(employee.getRole())
                    .email(employee.getEmail())
                    .department(employee.getDepartment())
                    .designation(employee.getDesignation())
                    .profilePictureBase64(employee.getProfilePictureBase64())
                    .compOffBalance(employee.getCompOffBalance())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username/ID or password"));
        }
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            employeeService.forgotPasswordRequest(request.getEmployeeId(), request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password reset request submitted. Contact Admin to complete the reset."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/auth/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        try {
            employeeService.changePassword(principal.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Principal principal) {
        return employeeService.getEmployeeById(principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestBody Map<String, String> body, Principal principal) {
        String base64Image = body.get("image");
        if (base64Image == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Profile picture image content is required."));
        }
        try {
            employeeService.uploadProfilePicture(principal.getName(), base64Image);
            return ResponseEntity.ok(Map.of("message", "Profile picture uploaded successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload profile picture: " + e.getMessage()));
        }
    }
}
