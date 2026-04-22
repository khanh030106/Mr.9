import {Favorite} from "@mui/icons-material";
import {Link} from "react-router-dom";
import {getBookImage} from "../../utils/GetImageUrl.js";
import {formatPrice} from "../../utils/FormatPrice.jsx";

const WishlistProductCard = ({
    item,
    isRemoving,
    isExiting,
    isAdding,
    onRemove,
    onAddToCart
}) => {
    const itemTitle = item?.title || "Book";
    const authorName = item?.authorName || "Unknown author";
    const isOutOfStock = !item?.inStock;

    return (
        <article className={`wishlist-card ${isExiting ? "wishlist-card--removing" : ""}`}>
            <Link
                to={`/bookseller/detail/${item.id}`}
                className="wishlist-card__link"
                aria-label={`View details for ${itemTitle}`}
            >
                <div className="wishlist-card__media">
                    <img
                        src={getBookImage(item.imageUrl)}
                        alt={`Cover of ${itemTitle} by ${authorName}`}
                        loading="lazy"
                        decoding="async"
                    />

                    <button
                        type="button"
                        className="wishlist-card__heart"
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                        onClick={(event) => onRemove(event, item.id)}
                        disabled={isRemoving}
                    >
                        <Favorite fontSize="small"/>
                    </button>
                </div>

                <div className="wishlist-card__body">
                    <h3 className="wishlist-card__title">{itemTitle}</h3>
                    <p className="wishlist-card__author">{authorName}</p>
                    <p className="wishlist-card__price">
                        {formatPrice(item.finalPrice || item.price)}
                        <span>d</span>
                    </p>
                    <button
                        type="button"
                        className="wishlist-card__add-cart"
                        onClick={(event) => onAddToCart(event, item)}
                        disabled={isOutOfStock || isAdding}
                    >
                        {isOutOfStock ? "Out of stock" : (isAdding ? "Adding..." : "Add to cart")}
                    </button>
                </div>
            </Link>
        </article>
    );
};

export default WishlistProductCard;

