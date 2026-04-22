import {Favorite} from "@mui/icons-material";
import {useState} from "react";
import {Link} from "react-router-dom";
import {getBookImage} from "../../utils/GetImageUrl.js";
import {formatPrice} from "../../utils/FormatPrice.jsx";

const ProductCard = ({item, isRemoving, isExiting, isAdding, onRemove, onAddToCart}) => {
    // === REFACTOR START: keep heart clickable after failed remove rollback ===
    const [isHeartPopping, setIsHeartPopping] = useState(false);
    const itemTitle = item?.title || "Book";
    const authorName = item?.authorName || "Unknown author";
    const isOutOfStock = !item?.inStock;

    const handleHeartClick = (event) => {
        if (isRemoving) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        setIsHeartPopping(true);
        onRemove(event, item.id);
    };

    return (
        <article className={`wishlist-card ${isExiting ? "wishlist-card--removing" : ""}`}>
            <Link to={`/bookseller/detail/${item.id}`} className="wishlist-card__link" aria-label={`View details for ${itemTitle}`}>
                <div className="wishlist-card__media">
                    <img
                        src={getBookImage(item.imageUrl)}
                        alt={`Cover of ${itemTitle} by ${authorName}`}
                        loading="lazy"
                        decoding="async"
                    />

                    <button
                        type="button"
                        className={`wishlist-card__heart ${isHeartPopping ? "wishlist-card__heart--pop" : ""}`}
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                        onAnimationEnd={() => setIsHeartPopping(false)}
                        onClick={handleHeartClick}
                        disabled={isRemoving}
                    >
                        <Favorite fontSize="small"/>
                    </button>

                    <button
                        type="button"
                        className="wishlist-card__add-cart"
                        onClick={(event) => onAddToCart(event, item)}
                        disabled={isOutOfStock || isAdding}
                    >
                        {isOutOfStock ? "Out of stock" : (isAdding ? "Adding..." : "Add to Cart")}
                    </button>
                </div>

                <div className="wishlist-card__body">
                    <h3 className="wishlist-card__title">{itemTitle}</h3>
                    <p className="wishlist-card__author">{authorName}</p>
                    <p className="wishlist-card__price">
                        {formatPrice(item.finalPrice || item.price)}
                        <span>d</span>
                    </p>
                </div>
            </Link>
        </article>
    );
};
// === REFACTOR END: keep heart clickable after failed remove rollback ===

export default ProductCard;
