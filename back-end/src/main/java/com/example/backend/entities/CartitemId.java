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
public class CartitemId implements Serializable {
    private static final long serialVersionUID = -2061771364494393992L;
    @NotNull
    @Column(name = "cartid", nullable = false)
    private Long cartid;

    @NotNull
    @Column(name = "bookid", nullable = false)
    private Long bookid;


}