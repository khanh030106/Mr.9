import { AccountBalanceWallet, ArrowForward, Payments } from "@mui/icons-material";
import "../../../styles/customer/product/CheckoutPage.css";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatPrice } from "../../../utils/FormatPrice.jsx";
import { getBookImage } from "../../../utils/GetImageUrl.js";
import { createCheckoutSession, getCheckoutProfile, placeOrder, saveCheckoutProfile } from "../../../api/bookApi.js";
import toast from "react-hot-toast";
import { AuthContext } from "../../../contexts/AuthContext.jsx";
import { useCart } from "../../../contexts/CartContext.jsx";

const CHECKOUT_INTENT_STORAGE_KEY = "checkout_intent";
const PAYMENT_OPTIONS = ["cod", "wallet"];

const EMPTY_ADDRESS_FORM = {
    id: "",
    receiverName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    province: "",
    isDefault: true
};

const normalizeCheckoutItem = (item) => {
    if (!item?.bookId) return null;
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const finalPrice = Number(item.finalPrice ?? item.price ?? 0);
    return {
        bookId: item.bookId,
        title: item.title || "Book",
        imageUrl: item.imageUrl || null,
        authorName: item.authorName || "Unknown author",
        price: Number(item.price ?? finalPrice ?? 0),
        finalPrice,
        quantity
    };
};

const CheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const { cartItem: cartItems = [] } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const [checkoutItems, setCheckoutItems] = useState([]);
    const [contact, setContact] = useState({ fullName: "", phone: "" });
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingContact, setIsSavingContact] = useState(false);

    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    // --- CHECKOUT REFACTOR START: hydrate checkout items from intent/state/cart fallback ---
    useEffect(() => {
        const stateIntent = location.state?.checkoutIntent;
        if (stateIntent) {
            sessionStorage.setItem(CHECKOUT_INTENT_STORAGE_KEY, JSON.stringify(stateIntent));
        }

        let intent = stateIntent;
        if (!intent) {
            try {
                const raw = sessionStorage.getItem(CHECKOUT_INTENT_STORAGE_KEY);
                intent = raw ? JSON.parse(raw) : null;
            } catch {
                intent = null;
            }
        }

        if (intent?.source === "buy-now" && intent?.item) {
            const mapped = normalizeCheckoutItem(intent.item);
            setCheckoutItems(mapped ? [mapped] : []);
            return;
        }

        if (intent?.source === "cart" && Array.isArray(intent.items) && intent.items.length > 0) {
            const mapped = intent.items.map(normalizeCheckoutItem).filter(Boolean);
            setCheckoutItems(mapped);
            return;
        }

        const fromCart = cartItems
            .map((item) => normalizeCheckoutItem({
                bookId: item.bookId,
                title: item.title,
                imageUrl: item.imageUrl,
                authorName: item.authorName,
                price: item.price,
                finalPrice: item.finalPrice,
                quantity: item.quantity
            }))
            .filter(Boolean);
        setCheckoutItems(fromCart);
    }, [location.state, cartItems]);
    // --- CHECKOUT REFACTOR END: hydrate checkout items from intent/state/cart fallback ---

    // --- CHECKOUT REFACTOR START: preload persisted checkout profile for current user ---
    useEffect(() => {
        const loadProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const profile = await getCheckoutProfile();
                const nextFullName = profile?.fullName || user?.fullName || "";
                const nextPhone = profile?.phone || user?.phone || "";
                const nextAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];

                setContact({ fullName: nextFullName, phone: nextPhone });
                setAddresses(nextAddresses);

                if (profile?.defaultAddressId != null) {
                    setSelectedAddressId(String(profile.defaultAddressId));
                } else if (nextAddresses.length > 0) {
                    setSelectedAddressId(String(nextAddresses[0].id));
                }

                if (PAYMENT_OPTIONS.includes(profile?.preferredPaymentMethod)) {
                    setPaymentMethod(profile.preferredPaymentMethod);
                }
            } catch (error) {
                console.error("Load checkout profile failed", error);
                setContact({
                    fullName: user?.fullName || "",
                    phone: user?.phone || ""
                });
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, [user?.fullName, user?.phone]);
    // --- CHECKOUT REFACTOR END: preload persisted checkout profile for current user ---

    const subtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    }, [checkoutItems]);

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const handleContactChange = (field) => (event) => {
        setContact((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSaveContact = async () => {
        if (!contact.fullName.trim()) {
            toast.error("Vui long nhap ho ten.");
            return;
        }

        // --- CHECKOUT REFACTOR START: popup opens only by explicit Add new address click ---
        if (addresses.length === 0 && !showAddressModal) {
            toast.error("Ban chua co dia chi. Vui long click Add new address de them dia chi.");
            return;
        }
        // --- CHECKOUT REFACTOR END: popup opens only by explicit Add new address click ---

        setIsSavingContact(true);
        try {
            const payload = {
                fullName: contact.fullName.trim(),
                phone: contact.phone.trim(),
                preferredPaymentMethod: paymentMethod
            };

            // --- CHECKOUT REFACTOR START: if user has no address yet, include modal address in contact save ---
            if (addresses.length === 0) {
                if (!addressForm.addressLine.trim() || !addressForm.ward.trim() || !addressForm.district.trim() || !addressForm.province.trim()) {
                    toast.error("Vui long nhap day du dia chi trong popup.");
                    return;
                }
                payload.address = {
                    id: addressForm.id ? Number(addressForm.id) : null,
                    receiverName: addressForm.receiverName.trim(),
                    phone: addressForm.phone.trim(),
                    addressLine: addressForm.addressLine.trim(),
                    ward: addressForm.ward.trim(),
                    district: addressForm.district.trim(),
                    province: addressForm.province.trim(),
                    isDefault: true
                };
            }
            const profile = await saveCheckoutProfile(payload);
            if (addresses.length === 0) {
                const nextAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
                setAddresses(nextAddresses);
                if (profile?.defaultAddressId != null) {
                    setSelectedAddressId(String(profile.defaultAddressId));
                } else if (nextAddresses.length > 0) {
                    setSelectedAddressId(String(nextAddresses[0].id));
                }
                setShowAddressModal(false);
            }
            // --- CHECKOUT REFACTOR END: if user has no address yet, include modal address in contact save ---

            toast.success("Da luu thong tin lien he.");
        } catch (error) {
            console.error("Save contact failed", error);
            toast.error("Khong luu duoc thong tin lien he.");
        } finally {
            setIsSavingContact(false);
        }
    };

    // --- CHECKOUT REFACTOR START: centralized modal close behavior for button/backdrop/keyboard ---
    const closeAddressModal = () => {
        setShowAddressModal(false);
    };

    useEffect(() => {
        if (!showAddressModal) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleEsc = (event) => {
            if (event.key === "Escape") {
                closeAddressModal();
            }
        };

        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = previousOverflow;
        };
    }, [showAddressModal]);
    // --- CHECKOUT REFACTOR END: centralized modal close behavior for button/backdrop/keyboard ---

    const openAddressModal = () => {
        setAddressForm({
            ...EMPTY_ADDRESS_FORM,
            receiverName: contact.fullName,
            phone: contact.phone
        });
        setShowAddressModal(true);
    };

    const handleAddressFieldChange = (field) => (event) => {
        const value = field === "isDefault" ? event.target.checked : event.target.value;
        setAddressForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveAddress = async (event) => {
        event.preventDefault();
        if (!addressForm.addressLine.trim() || !addressForm.ward.trim() || !addressForm.district.trim() || !addressForm.province.trim()) {
            toast.error("Vui long nhap day du dia chi.");
            return;
        }

        setIsSavingAddress(true);
        try {
            const profile = await saveCheckoutProfile({
                fullName: contact.fullName.trim(),
                phone: contact.phone.trim(),
                preferredPaymentMethod: paymentMethod,
                address: {
                    id: addressForm.id ? Number(addressForm.id) : null,
                    receiverName: addressForm.receiverName.trim(),
                    phone: addressForm.phone.trim(),
                    addressLine: addressForm.addressLine.trim(),
                    ward: addressForm.ward.trim(),
                    district: addressForm.district.trim(),
                    province: addressForm.province.trim(),
                    isDefault: Boolean(addressForm.isDefault)
                }
            });

            const nextAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
            setAddresses(nextAddresses);
            if (profile?.defaultAddressId != null) {
                setSelectedAddressId(String(profile.defaultAddressId));
            } else if (nextAddresses.length > 0) {
                setSelectedAddressId(String(nextAddresses[0].id));
            }
            setShowAddressModal(false);
            toast.success("Da luu dia chi giao hang.");
        } catch (error) {
            console.error("Save address failed", error);
            toast.error("Khong luu duoc dia chi.");
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleCompleteCheckout = async () => {
        if (checkoutItems.length === 0) {
            toast.error("Khong co san pham de thanh toan.");
            return;
        }
        if (!contact.fullName.trim()) {
            toast.error("Vui long nhap ho ten nguoi nhan.");
            return;
        }
        if (!selectedAddressId) {
            toast.error("Vui long chon dia chi giao hang.");
            return;
        }
        if (isSubmittingOrder) {
            return;
        }

        // --- VNPAY REFACTOR START: persist profile, create order, then branch COD vs VNPay ---
        setIsSubmittingOrder(true);
        try {
            await saveCheckoutProfile({
                fullName: contact.fullName.trim(),
                phone: contact.phone.trim(),
                preferredPaymentMethod: paymentMethod,
                selectedAddressId: Number(selectedAddressId)
            });

            const orderPayload = {
                addressId: Number(selectedAddressId),
                paymentMethod,
                items: checkoutItems.map((item) => ({
                    bookId: item.bookId,
                    quantity: item.quantity
                }))
            };

            const orderResponse = await placeOrder(orderPayload);
            sessionStorage.removeItem(CHECKOUT_INTENT_STORAGE_KEY);

            if (paymentMethod === "cod") {
                toast.success("Dat hang thanh cong.");
                navigate(`/bookseller/order?checkoutStatus=ORDER_CREATED&orderId=${orderResponse.orderId}`, { replace: true });
                return;
            }

            const checkoutSession = await createCheckoutSession({
                orderId: orderResponse.orderId
            });

            if (checkoutSession?.sessionUrl) {
                window.location.assign(checkoutSession.sessionUrl);
                return;
            }

            toast.error("Khong tao duoc phien thanh toan VNPay.");
        } catch (error) {
            console.error("Complete checkout failed", error);
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data === "string" ? error.response.data : "");
            toast.error(backendMessage || "Khong the hoan tat thanh toan.");
        } finally {
            setIsSubmittingOrder(false);
        }
        // --- VNPAY REFACTOR END: persist profile, create order, then branch COD vs VNPay ---
    };

    return (
        <>
            <div className="checkout-page">
                <div className="checkout-wrapper">
                    <div className="checkout-container">
                        <div className="checkout-layout">
                            <div className="checkout-form-section">
                                {isLoadingProfile ? <p>Loading checkout info...</p> : null}
                                <form className="checkout-form">
                                    <section className="checkout-section">
                                        <h2 className="checkout-section-title">
                                            <span className="checkout-section-number">1</span>
                                            <p className="title-checkout">Contact Information</p>
                                        </h2>
                                        <div className="checkout-grid">
                                            <div className="checkout-grid-full">
                                                <label className="checkout-label" htmlFor="full-name">Full Name</label>
                                                <input className="checkout-input" id="full-name" type="text"
                                                    value={contact.fullName}
                                                    onChange={handleContactChange("fullName")}
                                                    placeholder="John Doe" />
                                            </div>
                                            <div className="checkout-grid-full">
                                                <label className="checkout-label" htmlFor="phone">Phone Number</label>
                                                <input className="checkout-input"
                                                    id="phone"
                                                    type="tel"
                                                    value={contact.phone}
                                                    onChange={handleContactChange("phone")}
                                                    placeholder="+1 (555) 000-0000" />
                                            </div>
                                            <div className="checkout-grid-full">
                                                <button
                                                    type="button"
                                                    className="checkout-discount-btn"
                                                    onClick={handleSaveContact}
                                                    disabled={isSavingContact}
                                                >
                                                    {isSavingContact ? "Saving..." : "Save contact info"}
                                                </button>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="checkout-section">
                                        <div className="checkout-grid">
                                            <div>
                                                <h2 className="checkout-section-title">
                                                    <span className="checkout-section-number">2</span>
                                                    <p className="title-checkout">Shipping Address</p>
                                                </h2>
                                                <div className="checkout-grid-full">
                                                    <select
                                                        className="checkout-input"
                                                        id="addressSelect"
                                                        value={selectedAddressId}
                                                        onChange={(e) => setSelectedAddressId(e.target.value)}
                                                    >
                                                        <option value="">Please add a shipping address</option>
                                                        {addresses.map((address) => (
                                                            <option key={address.id} value={String(address.id)}>
                                                                {address.receiverName} - {address.phone} - {address.addressLine}, {address.ward}, {address.district}, {address.province}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="add-new-address">
                                                        <button type="button" id="openAddressModalBtn"
                                                            onClick={openAddressModal}
                                                            aria-label="Add new address">
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button>
                                                        <p>Add new address</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h2 className="checkout-section-title">
                                                    <span className="checkout-section-number">3</span>
                                                    <p className="title-checkout">Payment Method</p>
                                                </h2>
                                                <div className="checkout-payment-options">
                                                    <label className="checkout-payment-label" id="payment-cod-label">
                                                        <input className="checkout-radio" type="radio" name="payment"
                                                            value="cod"
                                                            checked={paymentMethod === "cod"}
                                                            onChange={(e) => setPaymentMethod(e.target.value)} />
                                                        <div className="checkout-payment-content">
                                                            <span className="checkout-payment-text">Cash on Delivery (COD)</span>
                                                            <span
                                                                className="material-symbols-outlined checkout-payment-icon"><Payments /></span>
                                                        </div>
                                                    </label>

                                                    <label className="checkout-payment-label" id="payment-wallet-label">
                                                        <input className="checkout-radio" type="radio" name="payment"
                                                            value="wallet"
                                                            checked={paymentMethod === "wallet"}
                                                            onChange={(e) => setPaymentMethod(e.target.value)} />
                                                        <div className="checkout-payment-content">
                                                            <span className="checkout-payment-text">E-Wallet (VNPay)</span>
                                                            <span
                                                                className="material-symbols-outlined checkout-payment-icon"><AccountBalanceWallet /></span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </form>
                            </div>

                            <div className="checkout-summary-section">
                                <div className="checkout-summary-sticky">
                                    <div className="checkout-summary-header">
                                        <h2 className="checkout-summary-title">Order Summary</h2>
                                    </div>
                                    <div className="checkout-summary-content">

                                        {checkoutItems.length === 0 ? (
                                            <div className="checkout-product checkout-product-item">
                                                <p>Your checkout cart is empty.</p>
                                            </div>
                                        ) : (
                                            checkoutItems.map((item) => (
                                                <div key={item.bookId}>
                                                    <div className="checkout-product checkout-product-item" data-single-item="true">
                                                        <div className="checkout-product-image">
                                                            <img src={getBookImage(item.imageUrl)} alt={item.title} />
                                                        </div>
                                                        <div className="checkout-product-details">
                                                            <div>
                                                                <h3 className="checkout-product-name">{item.title}</h3>
                                                                <p className="checkout-product-author">{item.authorName}</p>
                                                            </div>
                                                            <div className="checkout-product-footer">
                                                                <div className="checkout-quantity">
                                                                    <span className="checkout-quantity-value">x{item.quantity}</span>
                                                                </div>
                                                                <div className="price">
                                                                    <p className="product-price">{formatPrice(item.finalPrice * item.quantity)}d</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <div className="checkout-discount">
                                            <label className="checkout-discount-label" htmlFor="discount">Discount
                                                Code</label>
                                            <div className="checkout-discount-input-group">
                                                <input className="checkout-discount-input" id="discount" type="text"
                                                    placeholder="Enter code" />
                                                <button type="button" id="applyVoucherBtn"
                                                    className="checkout-discount-btn">Apply
                                                </button>
                                            </div>
                                        </div>

                                        <div className="checkout-price-summary">
                                            <div className="checkout-price-row">
                                                <span>Subtotal</span>
                                                <span id="subtotal">{formatPrice(subtotal)}d</span>
                                            </div>
                                            <div className="checkout-price-row">
                                                <span>Shipping</span>
                                                <span className="checkout-price-free" id="shipping-fee">{shippingFee === 0 ? "Free" : `${formatPrice(shippingFee)}d`}</span>
                                            </div>
                                        </div>

                                        <div className="checkout-total">
                                            <span className="checkout-total-label">Total</span>
                                            <span className="checkout-total-amount" id="total">{formatPrice(total)}d</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="checkout-complete-btn"
                                            onClick={handleCompleteCheckout}
                                            disabled={isSubmittingOrder}
                                        >
                                            <span>{isSubmittingOrder ? "Processing..." : "Complete Checkout"}</span>
                                            <span className="material-symbols-outlined"><ArrowForward /></span>
                                        </button>

                                        <p className="checkout-security-text">
                                            Secure Checkout powered by BookStore. Your data is protected.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="checkout-address-modal-overlay"
                    id="addressModalOverlay"
                    hidden={!showAddressModal}
                    onClick={closeAddressModal}
                >
                    <div className="checkout-address-modal" role="dialog" aria-modal="true"
                        aria-labelledby="addressModalTitle" onClick={(event) => event.stopPropagation()}>
                        <div className="checkout-address-modal-header">
                            <h3 id="addressModalTitle">Add Shipping Address</h3>
                            <button type="button" id="closeAddressModalBtn" className="checkout-address-close-btn"
                                onClick={closeAddressModal}
                                aria-label="Close popup">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form id="addAddressForm" className="checkout-address-form" onSubmit={handleSaveAddress}>
                            <div className="checkout-address-form-grid">
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressReceiverName">Receiver
                                        Name</label>
                                    <input className="checkout-input" id="addressReceiverName" type="text"
                                        value={addressForm.receiverName}
                                        onChange={handleAddressFieldChange("receiverName")}
                                        placeholder="Receiver name" />
                                </div>
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressPhone">Phone Number</label>
                                    <input className="checkout-input" id="addressPhone" type="tel"
                                        value={addressForm.phone}
                                        onChange={handleAddressFieldChange("phone")}
                                        placeholder="0987654321" required />
                                </div>
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressLine">Address Line</label>
                                    <input className="checkout-input" id="addressLine" type="text"
                                        value={addressForm.addressLine}
                                        onChange={handleAddressFieldChange("addressLine")}
                                        placeholder="House number, street" required />
                                </div>
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressWard">Ward</label>
                                    <input className="checkout-input" id="addressWard" type="text" placeholder="Ward"
                                        value={addressForm.ward}
                                        onChange={handleAddressFieldChange("ward")}
                                        required />
                                </div>
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressDistrict">District</label>
                                    <input className="checkout-input" id="addressDistrict" type="text"
                                        value={addressForm.district}
                                        onChange={handleAddressFieldChange("district")}
                                        placeholder="District" required />
                                </div>
                                <div className="checkout-grid-full">
                                    <label className="checkout-label" htmlFor="addressProvince">Province</label>
                                    <input className="checkout-input" id="addressProvince" type="text"
                                        value={addressForm.province}
                                        onChange={handleAddressFieldChange("province")}
                                        placeholder="Province/City" required />
                                </div>
                                <label className="checkout-checkbox-label checkout-address-default-wrap">
                                    <input type="checkbox" className="checkout-checkbox" id="addressSetDefault"
                                        checked={addressForm.isDefault}
                                        onChange={handleAddressFieldChange("isDefault")} />
                                    <span className="checkout-checkbox-text">Set as default address</span>
                                </label>
                            </div>

                            <p id="addressModalError" className="checkout-address-error" hidden></p>

                            <div className="checkout-address-actions">
                                <button type="button" className="checkout-address-cancel-btn"
                                    onClick={closeAddressModal}
                                    id="cancelAddressModalBtn">Cancel
                                </button>
                                <button type="submit" className="checkout-address-save-btn" id="saveAddressBtn" disabled={isSavingAddress}>Save
                                    {addresses.length === 0 ? " contact info" : " address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CheckoutPage;
