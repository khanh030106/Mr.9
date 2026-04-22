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
public class OrderitemId implements Serializable {
    private static final long serialVersionUID = -8256112058491694814L;
    @NotNull
    @Column(name = "orderid", nullable = false)
    private Long orderid;

    @NotNull
    @Column(name = "bookid", nullable = false)
    private Long bookid;


}