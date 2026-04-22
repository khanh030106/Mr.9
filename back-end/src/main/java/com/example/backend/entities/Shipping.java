package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "shipping", schema = "dbo")
public class Shipping {
    @Id
    @Column(name = "shippingid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orderid", nullable = false)
    private Order orderID;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "shippingprovider", length = 100)
    private String shippingProvider;

    @Size(max = 150)
    @ColumnDefault("NULL")
    @Column(name = "trackingnumber", length = 150)
    private String trackingNumber;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "shippingstatus", length = 50)
    private String shippingStatus;

    @Column(name = "estimateddeliverydate")
    private OffsetDateTime estimatedDeliveryDate;

    @Column(name = "actualdeliverydate")
    private OffsetDateTime actualDeliveryDate;

    @Column(name = "shippedat")
    private OffsetDateTime shippedAt;


}