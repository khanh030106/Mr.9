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
public class PromotionbookId implements Serializable {
    private static final long serialVersionUID = 6079446974917578335L;
    @NotNull
    @Column(name = "promotionid", nullable = false)
    private Long promotionid;

    @NotNull
    @Column(name = "bookid", nullable = false)
    private Long bookid;


}