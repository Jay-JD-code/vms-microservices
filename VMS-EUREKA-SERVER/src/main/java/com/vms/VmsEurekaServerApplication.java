package com.vms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class VmsEurekaServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(VmsEurekaServerApplication.class, args);
	}

}
