import { useNavigate } from "react-router-dom";
import { getBookImage } from "../utils/GetImageUrl.js";
import { addToCart, addFavourite } from "../api/bookApi.js";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../utils/FormatPrice.jsx";
import toast from "react-hot-toast";
import { ShoppingCart, FavoriteBorder, Favorite } from "@mui/icons-material";
import "../styles/components/ProductCard.css";

const ProductCard = ({ item, isBestSeller = false, onAddToCart }) => {
    const navigate = useNavigate();
    const { refreshCart } = useCart();

    const bookTitle = item?.title || "Premium Book";
    const authorName = item?.authorName || "Classic Author";
    const isOutOfStock = !item.inStock;
    const hasDiscount = item.discountPercent > 0;

    const handleNavigateDetail = () => {
        if (item?.id) navigate(`/bookseller/detail/${item.id}`);
    };

    const handleAction = async (e, actionType) => {
        e.preventDefault();
        e.stopPropagation();
        if (!item?.id) return;

        try {
            if (actionType === "wishlist") {
                await addFavourite(item.id);
                toast.success("Saved to wishlist");
            } else if (actionType === "cart") {
                if (isOutOfStock) return;
                if (onAddToCart) {
                    await onAddToCart(item);
                } else {
                    await addToCart(item.id, 1);
                    await refreshCart();
                    toast.success("Added to cart");
                }
            }
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate("/bookseller/login");
            } else {
                toast.error("Action failed. Try again.");
            }
        }
    };

    return (
        <div 
            className={`kbook-card ${isOutOfStock ? "is-sold-out" : ""}`}
            onClick={handleNavigateDetail}
        >
            <div className="kbook-card__image-wrapper">
                <img
                    className="kbook-card__img"
                    src={getBookImage(item.imageUrl)}
                    alt={bookTitle}
                    loading="lazy"
                />
                
                {/* Badges */}
                <div className="kbook-card__tags">
                    {hasDiscount && <span className="tag-discount">-{item.discountPercent}%</span>}
                    {isBestSeller && !hasDiscount && <span className="tag-hot">Best Seller</span>}
                </div>

                {/* Quick Actions */}
                <div className="kbook-card__actions">
                    <button 
                        className="action-btn wishlist-btn" 
                        onClick={(e) => handleAction(e, "wishlist")}
                        title="Add to Wishlist"
                    >
                        <FavoriteBorder fontSize="small" />
                    </button>
                    <button 
                        className={`action-btn cart-btn ${isOutOfStock ? "disabled" : ""}`}
                        onClick={(e) => handleAction(e, "cart")}
                        disabled={isOutOfStock}
                        title="Add to Cart"
                    >
                        <ShoppingCart fontSize="small" />
                    </button>
                </div>

                {isOutOfStock && <div className="sold-out-overlay">Sold Out</div>}
            </div>

            <div className="kbook-card__info">
                <p className="kbook-card__author">{authorName}</p>
                <h3 className="kbook-card__title">{bookTitle}</h3>
                
                <div className="kbook-card__price-container">
                    <span className="price-current">
                        {formatPrice(hasDiscount ? item.finalPrice : item.price)}
                        <span className="currency">₫</span>
                    </span>
                    {hasDiscount && (
                        <span className="price-old">
                            {formatPrice(item.price)}₫
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;