package com.vms.orders.config;



import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.vms.orders.context.TenantContext;

import feign.RequestInterceptor;
import feign.RequestTemplate;

@Configuration
public class FeignConfig {

    @Bean
     RequestInterceptor tenantHeaderInterceptor() {
        return (RequestTemplate template) -> {
            Long orgId = TenantContext.getOrganizationId();
            if (orgId != null) {
                template.header("X-Organization-Id", String.valueOf(orgId));
            }
        };
    }
}