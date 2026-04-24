
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
                <div className="kb-cart-container">
                    <div className="kb-cart-items-section">
                        <h1 className="kb-cart-title">Giỏ Hàng Của Bạn</h1>

                        {removeError ? <p className="kb-error-message">{removeError}</p> : null}

                        {cartItems.length === 0 ? (
                            <div className="kb-empty-cart">
                                <p>Giỏ hàng của bạn đang trống</p>
                                <Link to="/bookseller/allbook" className="kb-continue-shopping-btn">
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="kb-cards-grid">
                                    {pagedItems.map(item => (
                                        <div className="kb-cart-card" key={item.bookId}>
                                            <div className="kb-card-image">
                                                <img src={getBookImage(item.imageUrl)} alt={item.title} />
                                            </div>
                                            <div className="kb-card-content">
                                                <h3 className="kb-card-title">{item.title}</h3>
                                                <p className="kb-card-author">{item.authorName}</p>
                                                
                                                <div className="kb-card-pricing">
                                                    <div className="kb-price-info">
                                                        <span className="kb-price-label">Giá:</span>
                                                        <span className="kb-price-value">{formatPrice(item.finalPrice)}đ</span>
                                                    </div>
                                                    <div className="kb-subtotal-info">
                                                        <span className="kb-subtotal-label">Thành tiền:</span>
                                                        <span className="kb-subtotal-value">{formatPrice(item.finalPrice * item.quantity)}đ</span>
                                                    </div>
                                                </div>

                                                <div className="kb-card-controls">
                                                    <div className="kb-quantity-control">
                                                        <button
                                                            type="button"
                                                            className="kb-qty-btn kb-qty-minus"
                                                            onClick={() => handleQtyDelta(item, -1)}
                                                            disabled={qtyBusyId === item.bookId || removingId === item.bookId}
                                                            aria-label="Giảm số lượng"
                                                        >−</button>
                                                        <span className="kb-qty-value">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            className="kb-qty-btn kb-qty-plus"
                                                            onClick={() => handleQtyDelta(item, 1)}
                                                            disabled={qtyBusyId === item.bookId || removingId === item.bookId}
                                                            aria-label="Tăng số lượng"
                                                        >+</button>
                                                    </div>
                                                    <button
                                                        className="kb-card-remove-btn"
                                                        title="Xóa sản phẩm"
                                                        onClick={() => handleRemoveItem(item.bookId)}
                                                        disabled={removingId === item.bookId}
                                                        type="button"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {cartItems.length > CART_ITEMS_PER_PAGE ? (
                                    <nav className="kb-cart-pagination" aria-label="Phân trang giỏ hàng">
                                        <button
                                            type="button"
                                            className="kb-pagination-btn"
                                            onClick={() => setListPage((p) => Math.max(0, p - 1))}
                                            disabled={listPage <= 0}
                                        >
                                            ← Trước
                                        </button>
                                        <span className="kb-pagination-info">
                                            Trang {listPage + 1} / {pageCount}
                                        </span>
                                        <button
                                            type="button"
                                            className="kb-pagination-btn"
                                            onClick={() => setListPage((p) => Math.min(pageCount - 1, p + 1))}
                                            disabled={listPage >= pageCount - 1}
                                        >
                                            Tiếp → 
                                        </button>
                                    </nav>
                                ) : null}
                            </>
                        )}
                    </div>

                    {cartItems.length > 0 && (
                        <div className="kb-cart-summary">
                            <div className="kb-summary-card">
                                <h2 className="kb-summary-title">Tóm Tắt Đơn Hàng</h2>
                                <div className="kb-summary-breakdown">
                                    <div className="kb-summary-row">
                                        <span>Tổng phụ</span>
                                        <span className="kb-summary-value">{formatPrice(subtotal)}đ</span>
                                    </div>
                                    <div className="kb-summary-row">
                                        <span>Giao hàng</span>
                                        <span className="kb-summary-value">Miễn phí</span>
                                    </div>
                                    <div className="kb-summary-divider"></div>
                                    <div className="kb-summary-total">
                                        <span>Tổng cộng</span>
                                        <span className="kb-total-amount">{formatPrice(subtotal)}đ</span>
                                    </div>
                                </div>
                                <button type="button" className="kb-checkout-btn" onClick={handleProceedToCheckout}>
                                    Tiến Hành Thanh Toán
                                </button>
                                <Link to="/bookseller/allbook" className="kb-continue-link">
                                    <span className="material-icons-outlined"><ArrowBack/></span>
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

// --- END FIX: phân trang 5 SP/trang (CartPage) ---

export default CartPage;