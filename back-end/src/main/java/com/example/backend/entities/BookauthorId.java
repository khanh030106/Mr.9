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
public class BookauthorId implements Serializable {
    private static final long serialVersionUID = 7303716569331311147L;
    @NotNull
    @Column(name = "bookid", nullable = false)
    private Long bookid;

    @NotNull
    @Column(name = "authorid", nullable = false)
    private Long authorid;


}