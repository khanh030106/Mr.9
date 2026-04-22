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
@Table(name = "books", schema = "dbo")
public class Book {
    @Id
    @Column(name = "bookid", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Size(max = 255)
    @NotNull
    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "isbn", length = Integer.MAX_VALUE)
    private String isbn;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @NotNull
    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisherid")
    private Publisher publisherID;

    @Column(name = "publishyear")
    private Integer publishYear;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "language", length = 50)
    private String language;

    @ColumnDefault("0")
    @Column(name = "soldcount")
    private Integer soldCount;

    @ColumnDefault("true")
    @Column(name = "isactive")
    private Boolean isActive;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat")
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "bookID")
    private Set<Bookcategory>  bookCategories = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Bookauthor> bookAuthors = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Promotionbook> promotionBooks = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Bookimage> bookImages = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Cartitem> cartItems = new LinkedHashSet<>();

    @OneToOne(mappedBy = "bookID")
    private Inventory inventory;

    @OneToMany(mappedBy = "bookID")
    private Set<Orderitem> orderItems = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Review> reviews = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bookID")
    private Set<Wishlist> wishLists = new LinkedHashSet<>();


}