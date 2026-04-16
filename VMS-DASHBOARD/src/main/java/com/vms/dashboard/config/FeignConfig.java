package com.vms.dashboard.config;

import com.vms.dashboard.context.TenantContext;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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