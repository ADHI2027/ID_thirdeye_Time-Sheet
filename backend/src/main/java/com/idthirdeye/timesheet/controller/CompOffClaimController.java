package com.idthirdeye.timesheet.controller;

import com.idthirdeye.timesheet.dto.ClaimRequest;
import com.idthirdeye.timesheet.model.CompOffClaim;
import com.idthirdeye.timesheet.service.CompOffClaimService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
public class CompOffClaimController {

    private final CompOffClaimService compOffClaimService;

    public CompOffClaimController(CompOffClaimService compOffClaimService) {
        this.compOffClaimService = compOffClaimService;
    }

    @PostMapping
    public ResponseEntity<?> submitClaim(@Valid @RequestBody ClaimRequest request, Principal principal) {
        try {
            CompOffClaim claim = compOffClaimService.submitClaim(
                    principal.getName(),
                    request.getWorkedDate(),
                    request.getHours(),
                    request.getReason()
            );
            return ResponseEntity.ok(claim);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<CompOffClaim>> getPersonalClaims(Principal principal) {
        List<CompOffClaim> claims = compOffClaimService.getEmployeeClaims(principal.getName());
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CompOffClaim>> getPendingClaims() {
        List<CompOffClaim> claims = compOffClaimService.getPendingClaims();
        return ResponseEntity.ok(claims);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveClaim(@PathVariable Long id, Principal principal) {
        try {
            CompOffClaim claim = compOffClaimService.approveClaim(id, principal.getName());
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectClaim(@PathVariable Long id, Principal principal) {
        try {
            CompOffClaim claim = compOffClaimService.rejectClaim(id, principal.getName());
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
