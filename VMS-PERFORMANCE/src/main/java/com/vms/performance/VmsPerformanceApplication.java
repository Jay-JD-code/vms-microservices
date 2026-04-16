package com.vms.performance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class VmsPerformanceApplication {

	public static void main(String[] args) {
		SpringApplication.run(VmsPerformanceApplication.class, args);
	}

}
