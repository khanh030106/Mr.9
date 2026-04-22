package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "cartitems", schema = "dbo")
public class Cartitem {
    @EmbeddedId
    private CartitemId id;

    @MapsId("cartid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cartid", nullable = false)
    private Cart cartID;

    @MapsId("bookid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bookid", nullable = false)
    private Book bookID;

    @NotNull
    @Column(name = "quantity", nullable = false)
    private Integer quantity;


}