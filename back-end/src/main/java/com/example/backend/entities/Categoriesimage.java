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
@Table(name = "categoriesimages", schema = "dbo")
public class Categoriesimage {
    @Id
    @Column(name = "imageid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoryid", nullable = false)
    private Category categoryID;

    @Size(max = 255)
    @NotNull
    @Column(name = "imageurl", nullable = false)
    private String imageUrl;

    @ColumnDefault("false")
    @Column(name = "ismain")
    private Boolean isMain;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;


}