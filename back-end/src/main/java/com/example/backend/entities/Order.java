package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "orders", schema = "dbo")
public class Order {
    @Id
    @Column(name = "orderid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userid", nullable = false)
    private User userID;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addressid", nullable = false)
    private Useraddress addressID;

    @Column(name = "totalamount")
    private BigDecimal totalAmount;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "currentstatus", length = 50)
    private String currentStatus;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "canceledreason")
    private String canceledReason;

    @Column(name = "canceledat")
    private OffsetDateTime canceledAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat")
    private OffsetDateTime createdAt;

    @Column(name = "completedat")
    private OffsetDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucherid")
    private Voucher voucherID;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "paymentmethod", length = 50)
    private String paymentMethod;

    @ColumnDefault("0")
    @Column(name = "shippingfee")
    private BigDecimal shippingFee;

    @ColumnDefault("0")
    @Column(name = "discountamount")
    private BigDecimal discountAmount;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "note")
    private String note;

    @OneToMany(mappedBy = "orderID")
    private Set<Orderitem> orderItems = new LinkedHashSet<>();

    @OneToMany(mappedBy = "orderID")
    private Set<Orderstatushistory> orderStatusHistories = new LinkedHashSet<>();

    @OneToMany(mappedBy = "orderID")
    private Set<Payment> payments = new LinkedHashSet<>();

    @OneToMany(mappedBy = "orderID")
    private Set<Shipping> shipping = new LinkedHashSet<>();

    @OneToMany(mappedBy = "orderID")
    private Set<Voucherusage> voucherUsages = new LinkedHashSet<>();


}