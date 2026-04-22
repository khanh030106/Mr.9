package com.example.backend.services;

import com.example.backend.dto.requests.CheckoutProfileUpsertRequest;
import com.example.backend.dto.responseModel.CheckoutProfileResponse;
import com.example.backend.entities.User;
import com.example.backend.entities.Useraddress;
import com.example.backend.repositories.UserAddressRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class CheckoutProfileService {
    private static final String PAYMENT_COD = "cod";
    private static final String PAYMENT_WALLET = "wallet";

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;

    public CheckoutProfileService(UserRepository userRepository, UserAddressRepository userAddressRepository) {
        this.userRepository = userRepository;
        this.userAddressRepository = userAddressRepository;
    }

    @Transactional(readOnly = true)
    public CheckoutProfileResponse getProfile(String email) {
        User user = findUser(email);
        return buildResponse(user, userAddressRepository.findActiveByUser(user));
    }

    @Transactional
    public CheckoutProfileResponse saveProfile(String email, CheckoutProfileUpsertRequest request) {
        User user = findUser(email);

        if (request != null) {
            applyContactInfo(user, request);
        }
        userRepository.save(user);

        if (request != null && request.getAddress() != null) {
            upsertAddress(user, request.getAddress());
        }

        if (request != null && request.getSelectedAddressId() != null) {
            selectDefaultAddress(user, request.getSelectedAddressId());
        }

        List<Useraddress> addresses = userAddressRepository.findActiveByUser(user);
        return buildResponse(user, addresses);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void applyContactInfo(User user, CheckoutProfileUpsertRequest request) {
        if (request.getFullName() != null) {
            String fullName = request.getFullName().trim();
            if (fullName.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required");
            }
            user.setFullName(fullName);
        }

        if (request.getPhone() != null) {
            String phone = request.getPhone().trim();
            user.setPhone(phone.isEmpty() ? null : phone);
        }

        if (request.getPreferredPaymentMethod() != null) {
            user.setPreferredPaymentMethod(normalizePaymentMethod(request.getPreferredPaymentMethod()));
        }
    }

    private void upsertAddress(User user, CheckoutProfileUpsertRequest.AddressPayload payload) {
        Useraddress address;
        if (payload.getId() != null) {
            address = userAddressRepository.findActiveByIdAndUser(payload.getId(), user)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address not found"));
        } else {
            address = new Useraddress();
            long nextId = userAddressRepository.findTopByOrderByIdDesc()
                    .map(Useraddress::getId)
                    .orElse(0L) + 1L;
            address.setId(nextId);
            address.setUserID(user);
            address.setIsDeleted(false);
            address.setAddressType("Home");
        }

        address.setReceiverName(trimToNull(payload.getReceiverName()));
        address.setPhone(trimToNull(payload.getPhone()));
        address.setAddressLine(requireNotBlank(payload.getAddressLine(), "Address line is required"));
        address.setWard(requireNotBlank(payload.getWard(), "Ward is required"));
        address.setDistrict(requireNotBlank(payload.getDistrict(), "District is required"));
        address.setProvince(requireNotBlank(payload.getProvince(), "Province is required"));

        if (Boolean.TRUE.equals(payload.getIsDefault())) {
            clearDefaultAddress(user);
            address.setIsDefault(true);
        } else if (address.getIsDefault() == null) {
            address.setIsDefault(false);
        }

        userAddressRepository.save(address);
    }

    private void selectDefaultAddress(User user, Long selectedAddressId) {
        Useraddress selected = userAddressRepository.findActiveByIdAndUser(selectedAddressId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected address not found"));
        clearDefaultAddress(user);
        selected.setIsDefault(true);
        userAddressRepository.save(selected);
    }

    private void clearDefaultAddress(User user) {
        List<Useraddress> current = userAddressRepository.findActiveByUser(user);
        for (Useraddress item : current) {
            if (Boolean.TRUE.equals(item.getIsDefault())) {
                item.setIsDefault(false);
                userAddressRepository.save(item);
            }
        }
    }

    private CheckoutProfileResponse buildResponse(User user, List<Useraddress> addresses) {
        Long defaultAddressId = addresses.stream()
                .filter(address -> Boolean.TRUE.equals(address.getIsDefault()))
                .map(Useraddress::getId)
                .findFirst()
                .orElse(null);

        List<CheckoutProfileResponse.AddressItem> addressItems = addresses.stream()
                .map(address -> new CheckoutProfileResponse.AddressItem(
                        address.getId(),
                        address.getReceiverName(),
                        address.getPhone(),
                        address.getAddressLine(),
                        address.getWard(),
                        address.getDistrict(),
                        address.getProvince(),
                        Boolean.TRUE.equals(address.getIsDefault())
                ))
                .toList();

        return new CheckoutProfileResponse(
                user.getFullName(),
                user.getPhone(),
                user.getPreferredPaymentMethod(),
                defaultAddressId,
                addressItems
        );
    }

    private String normalizePaymentMethod(String method) {
        String normalized = method.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }
        if (!PAYMENT_COD.equals(normalized) && !PAYMENT_WALLET.equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment method");
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requireNotBlank(String value, String errorMessage) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return trimmed;
    }
}

