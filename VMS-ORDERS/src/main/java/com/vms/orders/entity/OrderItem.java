package com.vms.orders.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="order_items")
@Data
public class OrderItem {

    @Id
    @GeneratedValue
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "order_id")
    private PurchaseOrder order;

    private String productName;

    private Integer quantity;

    /** Unit price of the item */
    private Double price;
}
