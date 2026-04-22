
import "../../../styles/customer/product/CartPage.css";
import {ArrowBack, Delete} from "@mui/icons-material";
import {Link, useNavigate} from "react-router-dom";
import {getBookImage} from "../../../utils/GetImageUrl.js";
import {useCart} from "../../../contexts/CartContext.jsx";
import {useEffect, useMemo, useState} from "react";
import {removeCartItems, updateCartItemQuantity} from "../../../api/bookApi.js";
import {formatPrice} from "../../../utils/FormatPrice.jsx";
import toast from "react-hot-toast";
const CART_ITEMS_PER_PAGE = 3;

const CartPage = () => {
    const { cartItem: cartItems = [], refreshCart  } = useCart();
    const navigate = useNavigate();
    const [removingId, setRemovingId] = useState(null);
    const [qtyBusyId, setQtyBusyId] = useState(null);
    const [removeError, setRemoveError] = useState("");

    const [listPage, setListPage] = useState(0);
    const CHECKOUT_INTENT_STORAGE_KEY = "checkout_intent";

    const pageCount = Math.max(1, Math.ceil(cartItems.length / CART_ITEMS_PER_PAGE));

    // --- REFACTOR START: premium confirm toast for remove actions ---
    const requestRemoveConfirmation = (message) => new Promise((resolve) => {
        let settled = false;
        let fallbackTimeoutId;

        const settle = (value, toastId) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(fallbackTimeoutId);
            toast.dismiss(toastId);
            resolve(value);
        };

        const toastId = toast.custom((t) => (
            <div className="kb-remove-confirm" role="alertdialog" aria-live="assertive" aria-label="Remove confirmation">
                <p className="kb-remove-confirm__title">Confirm remove</p>
                <p className="kb-remove-confirm__message">{message}</p>
                <div className="kb-remove-confirm__actions">
                    <button
                        type="button"
                        className="kb-remove-confirm__btn kb-remove-confirm__btn--ghost"
                        onClick={() => settle(false, t.id)}
                    >
                        Keep item
                    </button>
                    <button
                        type="button"
                        className="kb-remove-confirm__btn kb-remove-confirm__btn--danger"
                        onClick={() => settle(true, t.id)}
                    >
                        Remove
                    </button>
                </div>
            </div>
        ), {
            position: "top-center",
            duration: 5200
        });

        fallbackTimeoutId = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            toast.dismiss(toastId);
            resolve(false);
        }, 5300);
    });
    // --- REFACTOR END: premium confirm toast for remove actions ---

    useEffect(() => {
        if (cartItems.length === 0) {
            setListPage(0);
            return;
        }
        const maxPage = Math.max(0, Math.ceil(cartItems.length / CART_ITEMS_PER_PAGE) - 1);
        setListPage((prev) => (prev > maxPage ? maxPage : prev));
    }, [cartItems.length]);

    const pagedItems = useMemo(() => {
        const start = listPage * CART_ITEMS_PER_PAGE;
        return cartItems.slice(start, start + CART_ITEMS_PER_PAGE);
    }, [cartItems, listPage]);

    //-------------------------------CALCULATE SUBTOTAL-------------------------------
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.finalPrice * item.quantity);
    }, 0);

    //--------------------------------HANDLE REMOVE ITEM--------------------------------
    const handleRemoveItem = async (bookId) => {
        if (!bookId || removingId === bookId) return;
        const confirmed = await requestRemoveConfirmation("Remove this item from your cart?");
        if (!confirmed) return;
        setRemoveError("");
        setRemovingId(bookId);

        try {
            await removeCartItems(bookId);
        } catch (err) {
            setRemoveError(err?.message || "Delete failed, please try again later.");
            toast.error("Failed to remove item from cart");
            setRemovingId(null);
            return;
        }

        try {
            await refreshCart();
            toast.success("Removed item from cart");
        } catch {
            setRemoveError("Đã xóa sản phẩm, nhưng làm mới giỏ hàng thất bại. Vui lòng tải lại trang.");
            toast.error("Item removed, but cart refresh failed");
        } finally {
            setRemovingId(null);
        }
    };

    // --- BEGIN FIX: nút +/- gọi PATCH /cart/item — revert: nút không onClick ---
    const handleQtyDelta = async (item, delta) => {
        const bookId = item.bookId;
        if (!bookId || qtyBusyId === bookId || removingId === bookId) return;
        const next = item.quantity + delta;
        const isRemoveAction = next === 0;
        if (next < 0) return;
        if (isRemoveAction) {
            const ok = await requestRemoveConfirmation("Quantity will become 0. Remove this item from cart?");
            if (!ok) return;
        }
        setRemoveError("");
        setQtyBusyId(bookId);
        try {
            await updateCartItemQuantity(bookId, next);
            await refreshCart();
            if (isRemoveAction) {
                toast.success("Removed item from cart");
            }
        } catch (err) {
            setRemoveError(err?.response?.data?.message || err?.message || "Không cập nhật được số lượng.");
            if (isRemoveAction) {
                toast.error("Failed to remove item from cart");
            }
        } finally {
            setQtyBusyId(null);
        }
    };
    // --- END FIX: nút +/- ---

    // --- CHECKOUT REFACTOR START: Proceed to Checkout sends selected cart items ---
    const handleProceedToCheckout = () => {
        if (cartItems.length === 0) {
            toast.error("Giỏ hàng đang trống.");
            return;
        }

        const checkoutIntent = {
            source: "cart",
            items: cartItems.map((item) => ({
                bookId: item.bookId,
                title: item.title,
                imageUrl: item.imageUrl,
                authorName: item.authorName,
                price: item.price,
                finalPrice: item.finalPrice,
                quantity: item.quantity
            }))
        };

        sessionStorage.setItem(CHECKOUT_INTENT_STORAGE_KEY, JSON.stringify(checkoutIntent));
        navigate("/bookseller/checkout", { state: { checkoutIntent } });
    };
    // --- CHECKOUT REFACTOR END: Proceed to Checkout sends selected cart items ---

    return (
        <>
            <main className="kb-main">
                <div className="kb-grid">
                    <div className="kb-cart-items">
                        <div className="kb-cart-header">
                            <div>Product</div>
                            <div>Price</div>
                            <div>Quantity</div>
                            <div>Subtotal</div>
                        </div>

                        {removeError ? <p style={{ color: "red" }}>{removeError}</p> : null}

                        <div className="kb-product-grid">
                            {cartItems.length === 0 ? (
                                <p>EMPTY CART</p>
                            ) : (
                                pagedItems.map(item => (
                                    <div className="kb-cart-item" key={item.bookId}>
                                        <div className="kb-product-info">
                                            <div className="kb-product-image">
                                                <img src={getBookImage(item.imageUrl)} alt={item.title} />
                                            </div>
                                            <div className="kb-product-details">
                                                <h3 className="kb-product-title">{item.title}</h3>
                                                <p className="kb-product-author">{item.authorName}</p>
                                                <button
                                                    type="button"
                                                    className="kb-remove-btn-mobile"
                                                    onClick={() => handleRemoveItem(item.bookId)}
                                                    disabled={removingId === item.bookId || qtyBusyId === item.bookId}
                                                >
                                                    <span className="material-icons-outlined"><Delete /></span>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        <div className="kb-price-section">
                                            <span className="kb-section-label">Price:</span>
                                            <span className="kb-price">{formatPrice(item.finalPrice)}đ</span>
                                        </div>

                                        <div className="kb-quantity-section">
                                            <span className="kb-section-label">Quantity:</span>
                                            <div className="kb-quantity-control">
                                                <button
                                                    type="button"
                                                    className="minus-btn"
                                                    onClick={() => handleQtyDelta(item, -1)}
                                                    disabled={qtyBusyId === item.bookId || removingId === item.bookId}
                                                    aria-label="Giảm số lượng"
                                                >-</button>
                                                <span className="quantity-value">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    className="plus-btn"
                                                    onClick={() => handleQtyDelta(item, 1)}
                                                    disabled={qtyBusyId === item.bookId || removingId === item.bookId}
                                                    aria-label="Tăng số lượng"
                                                >+</button>
                                            </div>
                                        </div>

                                        <div className="kb-subtotal-section">
                                            <span className="kb-section-label">Subtotal:</span>
                                            <div className="kb-subtotal-content">
                                                <span className="kb-subtotal-price">
                                                    {formatPrice(item.finalPrice * item.quantity)}đ
                                                </span>
                                                <button
                                                    className="kb-remove-btn"
                                                    title="Remove item"
                                                    onClick={() => handleRemoveItem(item.bookId)}
                                                    disabled={removingId === item.bookId}
                                                    type="button"
                                                >
                                                <span className="material-icons-outlined">
                                                    <Delete />
                                                </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                        </div>

                        {cartItems.length > CART_ITEMS_PER_PAGE ? (
                            <nav className="kb-cart-pagination" aria-label="Phân trang giỏ hàng">
                                <Link to="/bookseller/home" className="kb-continue-shopping">
                                    <span className="material-icons-outlined"><ArrowBack/></span>
                                    Back to shopping
                                </Link>
                                <button
                                    type="button"
                                    className="kb-cart-pagination__btn"
                                    onClick={() => setListPage((p) => Math.max(0, p - 1))}
                                    disabled={listPage <= 0}
                                >
                                    Previous
                                </button>
                                <span className="kb-cart-pagination__info">
                                    Page {listPage + 1} / {pageCount}
                                </span>
                                <button
                                    type="button"
                                    className="kb-cart-pagination__btn"
                                    onClick={() => setListPage((p) => Math.min(pageCount - 1, p + 1))}
                                    disabled={listPage >= pageCount - 1}
                                >
                                    Next
                                </button>
                            </nav>
                        ) : null}


                    </div>

                    <div className="kb-cart-summary">
                        <div className="kb-summary-card">
                            <h2 className="kb-summary-title">Cart Totals</h2>
                            <div className="kb-summary-details">
                                <div className="kb-summary-row">
                                    <span>Subtotal</span>
                                    <span className="kb-summary-value" id="cart-subtotal-value">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="kb-summary-row">
                                    <span>Shipping</span>
                                    <span className="kb-summary-small">Calculated at
                                    checkout</span>
                                </div>
                            </div>
                            <div className="kb-summary-total">
                                <div className="kb-total-row">
                                    <span className="kb-total-label">Total</span>
                                    <span className="kb-total-price" id="cart-total-price">{formatPrice(subtotal)}</span>
                                </div>
                                <p className="kb-vat-note">Including VAT</p>
                            </div>
                            <button type="button" className="kb-checkout-btn" onClick={handleProceedToCheckout}>Proceed to
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

// --- END FIX: phân trang 5 SP/trang (CartPage) ---

export default CartPage;