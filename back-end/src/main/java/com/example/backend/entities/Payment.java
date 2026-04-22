package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "payments", schema = "dbo")
public class Payment {
    @Id
    @Column(name = "paymentid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orderid", nullable = false)
    private Order orderID;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "provider", length = 100)
    private String provider;

    @Size(max = 150)
    @ColumnDefault("NULL")
    @Column(name = "transactioncode", length = 150)
    private String transactionCode;

    @NotNull
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Size(max = 50)
    @ColumnDefault("'Pending'")
    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "responsedata", length = Integer.MAX_VALUE)
    private String responseData;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "paymentdate")
    private OffsetDateTime paymentDate;


}