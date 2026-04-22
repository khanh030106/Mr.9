package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "promotions", schema = "dbo")
public class Promotion {
    @Id
    @Column(name = "promotionid", nullable = false)
    private Long id;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "promotionname", length = 50)
    private String promotionName;

    @Column(name = "discountpercent")
    private Integer discountPercent;

    @Column(name = "startdate")
    private OffsetDateTime startDate;

    @Column(name = "enddate")
    private OffsetDateTime endDate;

    @OneToMany(mappedBy = "promotionID")
    private Set<Promotionbook> promotionBooks = new LinkedHashSet<>();


}