package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "bookcategories", schema = "dbo")
public class Bookcategory {
    @EmbeddedId
    private BookcategoryId id;

    @MapsId("bookid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bookid", nullable = false)
    private Book bookID;

    @MapsId("categoryid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoryid", nullable = false)
    private Category categoryID;


}