package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "categories", schema = "dbo")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "categoryid", nullable = false)
    private Long id;

    @Size(max = 100)
    @NotNull
    @Column(name = "categoryname", nullable = false, length = 100)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parentid")
    private Category parentID;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @OneToMany(mappedBy = "parentID")
    private Set<Category> categories = new LinkedHashSet<>();

    @OneToMany(mappedBy = "categoryID")
    private Set<Categoriesimage> categoriesImages = new LinkedHashSet<>();


}