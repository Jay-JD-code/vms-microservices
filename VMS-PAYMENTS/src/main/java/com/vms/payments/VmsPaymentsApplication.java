package com.vms.payments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class VmsPaymentsApplication {

	public static void main(String[] args) {
		SpringApplication.run(VmsPaymentsApplication.class, args);
	}

}
