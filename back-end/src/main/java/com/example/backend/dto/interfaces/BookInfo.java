package com.example.backend.dto.interfaces;

import java.math.BigDecimal;
import java.math.RoundingMode;

public interface BookInfo {
    Long getId();
    String getTitle();
    BigDecimal getPrice();
    String getImageUrl();
    String getAuthorName();
    String getPublisherName();
    Integer getDiscountPercent();
    Integer getSoldCount();
    String getDescription();
    Integer getQuantity();

    default BigDecimal getFinalPrice() {
        if (getDiscountPercent() == null || getDiscountPercent() == 0)
            return getPrice();

        return getPrice()
                .multiply(BigDecimal.valueOf(100 - getDiscountPercent()))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    default boolean isInStock() {
        return getQuantity() != null && getQuantity() > 0;
    }

    default boolean canBuy(int buyQty) {
        return getQuantity() != null && buyQty > 0 && buyQty <= getQuantity();
    }

    default boolean isLowStock() {
        return getQuantity() != null && getQuantity() > 0 && getQuantity() <= 5;
    }

    default int getDiscountPercentSafe() {
        return getDiscountPercent() == null ? 0 : getDiscountPercent();
    }

    default boolean isOnSale() {
        return getDiscountPercentSafe() > 0;
    }

}
