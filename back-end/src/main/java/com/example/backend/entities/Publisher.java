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
@Table(name = "publishers", schema = "dbo")
public class Publisher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "publisherid", nullable = false)
    private Long id;

    @Size(max = 150)
    @NotNull
    @Column(name = "publishername", nullable = false, length = 150)
    private String publisherName;

    @Column(name = "contactemail", length = Integer.MAX_VALUE)
    private String contactEmail;

    @Size(max = 255)
    @ColumnDefault("NULL")
    @Column(name = "address")
    private String address;

    @ColumnDefault("false")
    @Column(name = "isdeleted")
    private Boolean isDeleted;

    @OneToMany(mappedBy = "publisherID")
    private Set<Book> books = new LinkedHashSet<>();


}