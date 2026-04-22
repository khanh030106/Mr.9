package com.example.backend.dto.responseModel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutProfileResponse {
    private String fullName;
    private String phone;
    private String preferredPaymentMethod;
    private Long defaultAddressId;
    private List<AddressItem> addresses;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AddressItem {
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

