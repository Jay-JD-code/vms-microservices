package com.vms.vendor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class VmsVendorApplication {

	public static void main(String[] args) {
		SpringApplication.run(VmsVendorApplication.class, args);
	}

}
