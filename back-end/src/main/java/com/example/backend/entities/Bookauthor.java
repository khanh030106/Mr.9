package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "bookauthors", schema = "dbo")
public class Bookauthor {
    @EmbeddedId
    private BookauthorId id;

    @MapsId("bookid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bookid", nullable = false)
    private Book bookID;

    @MapsId("authorid")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "authorid", nullable = false)
    private Author authorID;


}