package com.vms.orders.dto;

import java.util.List;

import lombok.Data;

@Data
public class PageResponse<T> {

    private List<T> content;

    private int totalPages;

    private long totalElements;
}