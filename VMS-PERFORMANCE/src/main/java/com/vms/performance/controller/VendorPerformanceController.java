package com.vms.performance.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vms.performance.entity.VendorPerformance;
import com.vms.performance.service.VendorPerformanceService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class VendorPerformanceController {

    private final VendorPerformanceService service;

    @PostMapping("/calculate/{vendorId}")
    public ResponseEntity<?> calculate(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(service.calculatePerformance(vendorId));
    }

    // ✅ FIX: getPerformance() no longer throws — it auto-calculates or
    //    returns an empty record, so this endpoint always returns 200.
    @GetMapping("/{vendorId}")
    public ResponseEntity<VendorPerformance> get(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(service.getPerformance(vendorId));
    }

    @GetMapping
    public ResponseEntity<List<VendorPerformance>> getAllPerformance() {
        return ResponseEntity.ok(service.getAllPerformance());
    }

    @PostMapping("/calculate-all")
    public ResponseEntity<List<VendorPerformance>> calculateAll() {
        return ResponseEntity.ok(service.calculateAllPerformance());
    }
}