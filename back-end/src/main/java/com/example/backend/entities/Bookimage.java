package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@Table(name = "bookimages", schema = "dbo")
public class Bookimage {
    @Id
    @Column(name = "imageid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bookid", nullable = false)
    private Book bookID;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "imageurl")
    private String imageUrl;

    @ColumnDefault("false")
    @Column(name = "ismain")
    private Boolean isMain;


}