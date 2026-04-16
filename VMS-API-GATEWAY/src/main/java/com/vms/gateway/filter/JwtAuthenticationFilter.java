package com.vms.gateway.filter;

import com.vms.gateway.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // Allow auth endpoints through without token
        if (path.startsWith("/api/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                String role     = jwtUtil.extractRole(token);
                Long   orgId    = jwtUtil.extractOrganizationId(token);

                String finalRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority(finalRole))
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // ── Wrap request to inject headers ──
                Map<String, String> headers = new HashMap<>();
                headers.put("X-Organization-Id", String.valueOf(orgId));
                headers.put("X-User-Role", role); // Forward role to downstream services
                headers.put("X-User-Email", username);
                
                HttpServletRequest mutatedRequest = addHeaders(request, headers);
                filterChain.doFilter(mutatedRequest, response);
                return;
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    // ── Wraps the request and injects extra headers ──
    private HttpServletRequest addHeaders(HttpServletRequest request,
                                          Map<String, String> headers) {
        return new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if (headers.containsKey(name)) return headers.get(name);
                return super.getHeader(name);
            }

            @Override
            public Enumeration<String> getHeaders(String name) {
                if (headers.containsKey(name)) {
                    return Collections.enumeration(List.of(headers.get(name)));
                }
                return super.getHeaders(name);
            }

            @Override
            public Enumeration<String> getHeaderNames() {
                List<String> names = Collections.list(super.getHeaderNames());
                headers.keySet().forEach(names::add);
                return Collections.enumeration(names);
            }
        };
    }
}