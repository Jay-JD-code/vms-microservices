package com.vms.context;

public class TenantContext {

    private static final ThreadLocal<Long> currentOrganizationId = new ThreadLocal<>();

    // Called by JWT filter on every request
    public static void setOrganizationId(Long organizationId) {
        currentOrganizationId.set(organizationId);
    }

    // Called by services to get current org
    public static Long getOrganizationId() {
        return currentOrganizationId.get();
    }

    // ALWAYS called after request completes — prevents memory leaks
    public static void clear() {
        currentOrganizationId.remove();
    }
}
