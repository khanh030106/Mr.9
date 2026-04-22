package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "useraddresses", schema = "dbo")
public class Useraddress {
    @Id
    @Column(name = "addressid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userid", nullable = false)
    private User userID;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "receivername", length = 100)
    private String receiverName;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "addressline")
    private String addressLine;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "province", length = 100)
    private String province;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "district", length = 100)
    private String district;

    @Size(max = 100)
    @ColumnDefault("NULL")
    @Column(name = "ward", length = 100)
    private String ward;

    @Size(max = 50)
    @ColumnDefault("'Home'")
    @Column(name = "addresstype", length = 50)
    private String addressType;

    @Column(name = "phone", length = Integer.MAX_VALUE)
    private String phone;

    @ColumnDefault("false")
    @Column(name = "isdefault")
    private Boolean isDefault;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @Column(name = "latitude")
    private BigDecimal latitude;

    @Column(name = "longitude")
    private BigDecimal longitude;

    @OneToMany(mappedBy = "addressID")
    private Set<Order> orders = new LinkedHashSet<>();


}