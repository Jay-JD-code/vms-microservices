package com.vms.util;

import org.springframework.stereotype.Component;

@Component
public class OtpUtility {

    public static String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }
}