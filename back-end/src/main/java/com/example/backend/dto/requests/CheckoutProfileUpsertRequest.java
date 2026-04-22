package com.example.backend.dto.requests;

import lombok.Data;

@Data
public class CheckoutProfileUpsertRequest {
    private String fullName;
    private String phone;
    private String preferredPaymentMethod;
    private Long selectedAddressId;
    private AddressPayload address;

    @Data
    public static class AddressPayload {
        private Long id;
        private String receiverName;
        private String phone;
        private String addressLine;
        private String ward;
        private String district;
        private String province;
        private Boolean isDefault;
    }
}

