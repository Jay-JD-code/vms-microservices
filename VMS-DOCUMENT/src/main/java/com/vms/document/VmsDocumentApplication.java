package com.vms.document;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class VmsDocumentApplication {

	public static void main(String[] args) {
		SpringApplication.run(VmsDocumentApplication.class, args);
	}

}
