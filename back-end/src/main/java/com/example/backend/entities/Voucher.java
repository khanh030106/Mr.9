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
@Table(name = "vouchers", schema = "dbo")
public class Voucher {
    @Id
    @Column(name = "voucherid", nullable = false)
    private Long id;

    @NotNull
    @Column(name = "code", nullable = false, length = Integer.MAX_VALUE)
    private String code;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "description")
    private String description;

    @Size(max = 20)
    @NotNull
    @Column(name = "discounttype", nullable = false, length = 20)
    private String discountType;

    @NotNull
    @Column(name = "discountvalue", nullable = false)
    private BigDecimal discountValue;

    @ColumnDefault("0")
    @Column(name = "minorderamount")
    private BigDecimal minOrderAmount;

    @Column(name = "maxdiscountamount")
    private BigDecimal maxDiscountAmount;

    @Column(name = "usagelimit")
    private Integer usageLimit;

    @ColumnDefault("0")
    @Column(name = "usedcount")
    private Integer usedCount;

    @NotNull
    @Column(name = "startdate", nullable = false)
    private OffsetDateTime startDate;

    @NotNull
    @Column(name = "enddate", nullable = false)
    private OffsetDateTime endDate;

    @ColumnDefault("true")
    @Column(name = "isactive")
    private Boolean isActive;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat")
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "voucherID")
    private Set<Order> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "voucherID")
    private Set<Voucherusage> voucherUsages = new LinkedHashSet<>();


}