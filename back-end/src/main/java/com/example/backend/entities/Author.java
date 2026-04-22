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
@Table(name = "authors", schema = "dbo")
public class Author {
    @Id
    @Column(name = "authorid", nullable = false)
    private Long id;

    @Size(max = 150)
    @NotNull
    @Column(name = "authorname", nullable = false, length = 150)
    private String authorName;

    @Column(name = "biography", length = Integer.MAX_VALUE)
    private String biography;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @OneToMany(mappedBy = "authorID")
    private Set<Bookauthor> bookAuthors =  new LinkedHashSet<>();

}