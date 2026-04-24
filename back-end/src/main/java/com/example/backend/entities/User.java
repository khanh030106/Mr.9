package com.example.backend.entities;

import com.example.backend.enums.AuthProvider;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "users", schema = "dbo")
public class User {
    @Id
    @GeneratedValue
    @Column(name = "userid", nullable = false)
    private Long id;

    @Size(max = 50)
    @NotNull
    @Column(name = "fullname", nullable = false, length = 50)
    private String fullName;

    @NotNull
    @Column(name = "email", nullable = false, length = Integer.MAX_VALUE)
    private String email;

    @Column(name = "phone", length = Integer.MAX_VALUE)
    private String phone;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "avatar")
    private String avatar;

    @Column(name = "dateofbirth")
    private LocalDate dateofBirth;

    @Column(name = "gender", length = Integer.MAX_VALUE)
    private String gender;

    @NotNull
    @Column(name = "passwordhash", nullable = false, length = Integer.MAX_VALUE)
    private String passwordHash;

    @ColumnDefault("true")
    @Column(name = "isactive")
    private Boolean isActive;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat")
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("'LOCAL'")
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = Integer.MAX_VALUE)
    private AuthProvider provider;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "backgroundimage")
    private String backgroundImage;

    // --- CHECKOUT REFACTOR START: persist last selected payment method for checkout prefill ---
    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "preferredpaymentmethod", length = 50)
    private String preferredPaymentMethod;

    @OneToMany(mappedBy = "userID", fetch = FetchType.EAGER)
    private Set<Userrole> userRoles = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Cart> carts = new LinkedHashSet<>();

    @OneToMany(mappedBy = "user")
    private Set<Emailverificationtoken> emailVerificationTokens = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Notification> notifications = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Order> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Review> reviews = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Useraddress> userAddresses = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Voucherusage> voucherUsages = new LinkedHashSet<>();

    @OneToMany(mappedBy = "userID")
    private Set<Wishlist> wishLists = new LinkedHashSet<>();


}