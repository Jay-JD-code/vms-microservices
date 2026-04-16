package com.vms.dashboard.fallback;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.vms.dashboard.client.VendorClient;

@Component
public class VendorClientFallback implements VendorClient {

    @Override
    public List<Map<String, Object>> getVendors() {
        return Collections.emptyList();
    }
}
