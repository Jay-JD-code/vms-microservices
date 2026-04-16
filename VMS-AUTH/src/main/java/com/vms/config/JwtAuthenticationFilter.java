package com.vms.config;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.vms.context.TenantContext;
import com.vms.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        String path = request.getRequestURI();

        if (header == null || !header.startsWith("Bearer ")) {
            log.debug("No Bearer token for path: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        log.info("Processing token for path: {}", path);

        try {
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                Long organizationId = jwtUtil.extractOrganizationId(token);

                log.info("Token valid - user: {}, role: {}, orgId: {}", username, role, organizationId);

                TenantContext.setOrganizationId(organizationId);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("Authentication set for: {}", username);
            } else {
                log.warn("Token invalid or expired for path: {}", path);
            }
        } catch (Exception e) {
            log.error("Token processing failed for path {}: {} - {}", path, e.getClass().getSimpleName(), e.getMessage());
            e.printStackTrace();
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}