package com.idthirdeye.timesheet.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequest {
    @NotNull(message = "Worked date is required")
    private LocalDate workedDate;

    @NotNull(message = "Hours are required")
    @Min(value = 1, message = "Hours must be greater than zero")
    private Double hours;

    @NotBlank(message = "Reason is required")
    private String reason;
}
