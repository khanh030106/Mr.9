package com.example.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class BookcategoryId implements Serializable {
    private static final long serialVersionUID = 8122887297827620137L;
    @NotNull
    @Column(name = "bookid", nullable = false)
    private Long bookid;

    @NotNull
    @Column(name = "categoryid", nullable = false)
    private Integer categoryid;


}