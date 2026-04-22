import {useNavigate} from "react-router-dom";
import {getBookImage} from "../utils/GetImageUrl.js";
import {addToCart} from "../api/bookApi.js";
import {useCart} from "../contexts/CartContext.jsx";
import "../styles/components/ProductCard.css";
import {addFavourite} from "../api/bookApi.js";
import toast from "react-hot-toast";
import {formatPrice} from "../utils/FormatPrice.jsx";

const ProductCard = ({item, isBestSeller = false, onAddToCart}) => {
    const bookTitle = item?.title || "Book";
    const authorName = item?.authorName || "Unknown author";
    const isOutOfStock = !item.inStock;
    const hasDiscount = item.discountPercent > 0;
    const navigate = useNavigate();
    const { refreshCart } = useCart();

    //--------------------------------------HANDLE DETAIL PAGE------------------------------------
    const handleNavigateDetail = () => {
        if (!item?.id) return;
        navigate(`/bookseller/detail/${item.id}`);
    };

    //---------------------------------------HANDLE ADD TO WISHLIST---------------------------------
    const defaultAddToWishlist = async (bookId) => {
        try {
            await addFavourite(bookId);
            toast.success("Added to wishlist");
        }catch(err) {
            console.error(err);
            toast.error("Failed to add to wishlist");
        }
    }
//---------------------------------------------------------------------------------------------------
    const handleAddWishlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const clickTarget = e.currentTarget;
        const shouldBlurAfterClick = e.detail > 0;

        const releaseFocus = () => {
            if (shouldBlurAfterClick && clickTarget instanceof HTMLElement) {
                clickTarget.blur();
            }
        };

        if (!item?.id) {
            releaseFocus();
            return;
        }

        try {
            await defaultAddToWishlist(item.id);
        } catch (err) {
            console.error("Add to wishlist failed:", err);
            toast.error("Something went wrong");
        } finally {
            releaseFocus();
        }
    }

//----------------------------------------HANDLE ADD TO CART----------------------------------
    const defaultAddToCart = async (book) => {
        await addToCart(book.id, 1);
        await refreshCart();
    };
//-----------------------------------------------------------------------------------------------
    const handleAddCartClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const clickTarget = e.currentTarget;
        const shouldBlurAfterClick = e.detail > 0;

        const releaseFocus = () => {
            if (shouldBlurAfterClick && clickTarget instanceof HTMLElement) {
                clickTarget.blur();
            }
        };

        if (isOutOfStock || !item?.id) {
            releaseFocus();
            return;
        }

        try {
            if (onAddToCart) {
                await onAddToCart(item);
            } else {
                await defaultAddToCart(item);
                toast.success("Added to cart successfully");
            }
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate("/bookseller/login");
                return;
            }
            console.error("Add to cart failed:", err);
            toast.error("Something went wrong");
        } finally {
            releaseFocus();
        }
    };

    return (
        <article
            className={`bookly-product-card ${isOutOfStock ? "out-of-stock" : ""}`}
            role="link"
            tabIndex={0}
            onClick={handleNavigateDetail}
            onKeyDown={(e) => e.key === "Enter" && handleNavigateDetail()}
            aria-label={`View details for ${bookTitle}`}
        >
            <div className="bookly-product-card__media">
                <img
                    src={getBookImage(item.imageUrl)}
                    alt={`Cover of ${bookTitle} by ${authorName}`}
                    loading="lazy"
                    decoding="async"
                />

                {/* Discount Badge */}
                {hasDiscount && (
                    <span className="bookly-product-card__badge" aria-label={`Discount: ${item.discountPercent}%`}>
                        -{item.discountPercent}%
                    </span>
                )}

                {/* Hot Badge - Best Seller / Top Sold Out */}
                {!hasDiscount && isBestSeller && (
                    <span className="bookly-product-card__badge bookly-product-card__badge--hot" aria-label="Hot - Best Seller">
                        Hot
                    </span>
                )}

                {/* Other Badge */}
                {!hasDiscount && !isBestSeller && item.badge && (
                    <span className="bookly-product-card__badge" aria-label={`Badge: ${item.badge}`}>
                        {item.badge}
                    </span>
                )}

                <button onClick={handleAddWishlistClick} className="bookly-product-card__wishlist">
                    <i className="bi bi-heart" aria-hidden="true"></i>
                </button>

                {isOutOfStock && (
                    <span className="bookly-product-card__out-of-stock-badge">
                        Out of stock
                    </span>
                )}

                <div className="bookly-product-card__overlay">
                    <button
                        type="button"
                        onClick={handleAddCartClick}
                        className={`bookly-product-card__add-cart ${isOutOfStock ? "disabled" : ""}`}
                        disabled={isOutOfStock}
                        aria-label="Add to cart"
                        title="Add to cart"
                    >
                        Add to cart
                    </button>
                </div>
            </div>

            <div className="bookly-product-card__body">
                <h3 className="bookly-product-card__title">{bookTitle}</h3>

                <div className="bookly-product-card__price-row">
                    <p className="bookly-product-card__price">
                        {formatPrice(hasDiscount ? item.finalPrice : item.price)}
                        <span className="bookly-product-card__currency">d</span>
                    </p>
                    {hasDiscount && (
                        <p className="bookly-product-card__old-price">
                            {formatPrice(item.price)}
                            <span className="bookly-product-card__currency">d</span>
                        </p>
                    )}
                </div>

                <p className="bookly-product-card__author">{authorName}</p>


            </div>
        </article>
    );
}


export default ProductCard;