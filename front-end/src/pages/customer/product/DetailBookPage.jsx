import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {
    AddShoppingCart,
    AssignmentReturn,
    ChevronLeft,
    ChevronRight,
    LocalShipping,
    Star,
    StarHalf,
    VerifiedUser
} from "@mui/icons-material";
import "../../../styles/customer/product/DetailBookPage.css";
import {useQuery} from "@tanstack/react-query";
import {addToCart, createBookReview, getBookDetail, getBookReviews, getRelatedBook} from "../../../api/bookApi.js";
import {getBookImage, getUserImage} from "../../../utils/GetImageUrl.js";
import ProductCard from "../../../components/ProductCard.jsx";
import {useContext, useEffect, useRef, useState} from "react";
import {useCart} from "../../../contexts/CartContext.jsx";
import {formatPrice} from "../../../utils/FormatPrice.jsx";
import toast from "react-hot-toast";
import {AuthContext} from "../../../contexts/AuthContext.jsx";

export const DetailBookPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { refreshCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("same-cate");
    const relatedTrackRef = useRef(null);
    const isInvalidId = !id || Number.isNaN(Number(id));
    const CHECKOUT_INTENT_STORAGE_KEY = "checkout_intent";
    const [reviewComment, setReviewComment] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    //--------------------------------REACT QUERY DETAIL BOOK-----------------------------
    const detailQuery = useQuery({
        queryKey: ["detail-book", id],
        queryFn: ({signal}) => getBookDetail(id, signal),
        enabled: !isInvalidId
    });

    //------------------------------------REACT QUERY RELATED BOOKS----------------------------------
    const relatedQuery = useQuery({
        queryKey: ["related-books", id],
        queryFn: ({signal}) => getRelatedBook(id, signal),
        enabled: !isInvalidId
    })

    const reviewsQuery = useQuery({
        queryKey: ["book-reviews", id],
        queryFn: ({signal}) => getBookReviews(id, 20, signal),
        enabled: !isInvalidId
    });

    const detailBook = detailQuery.data?.data ?? detailQuery.data;
    const stockQtyRaw = detailBook?.quantity;
    const stockQtyNum = stockQtyRaw != null ? Number(stockQtyRaw) : NaN;
    const isOutOfStock =
        Number.isFinite(stockQtyNum) ? stockQtyNum <= 0 : detailBook?.inStock === false;

    useEffect(() => {
        if (!detailBook?.id) return;
        const max = Number.isFinite(stockQtyNum) ? Math.max(0, stockQtyNum) : 0;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity((q) => {
            if (max <= 0) return 0;
            return Math.min(Math.max(1, q), max);
        });
    }, [detailBook?.id, stockQtyNum]);

    //----------------------------------HANDLE ADD BOOK TO CART---------------------------------
    const addBookToCart = async (bookId, qty = 1) => {
        try {
            await addToCart(bookId, qty);
            await refreshCart();
            toast.success("Added to cart successfully");
        } catch (err) {
            if (err.response?.status === 401) {
                navigate("/bookseller/login");
                return;
            }
            const msg = err?.response?.data?.message;
            if (err?.response?.status === 400 && msg) {
                toast.error(msg);
                return;
            }
            console.error("Add to cart failed:", err);
            toast.error("Something went wrong");
        }
    };
//---------------------------------------------------------------
    const handleAddToCart = async () => {
        if (isOutOfStock || quantity < 1 || !detailBook?.id) {
            toast.error("Sản phẩm đã hết hàng, không thể thêm vào giỏ.");
            return;
        }
        await addBookToCart(detailBook.id, quantity);
    };

    //----------------------------HANDLE ADD RELATED BOOKS TO CART------------------------
    const handleRelatedAddToCart = async (item) => {
        const q = item?.quantity != null ? Number(item.quantity) : NaN;
        const relatedOos = Number.isFinite(q) ? q <= 0 : item?.inStock === false;
        if (relatedOos) {
            toast.error("Sản phẩm đã hết hàng.");
            return;
        }
        await addBookToCart(item.id, 1);
    };

    const handleSubmitReview = async (event) => {
        event.preventDefault();

        if (!user) {
            toast.error("Bạn cần đăng nhập để bình luận.");
            navigate("/bookseller/login", { replace: true, state: { from: location } });
            return;
        }

        const trimmedComment = reviewComment.trim();
        if (!trimmedComment) {
            toast.error("Vui lòng nhập nội dung bình luận.");
            return;
        }

        if (isSubmittingReview || !id) {
            return;
        }

        setIsSubmittingReview(true);
        try {
            await createBookReview(id, {
                comment: trimmedComment,
                rating: reviewRating
            });
            setReviewComment("");
            setReviewRating(5);
            await reviewsQuery.refetch();
            toast.success("Gửi bình luận thành công.");
        } catch (error) {
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                toast.error("Vui lòng đăng nhập để bình luận.");
                navigate("/bookseller/login", { replace: true, state: { from: location } });
                return;
            }

            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data === "string" ? error.response.data : "");
            toast.error(backendMessage || "Không thể gửi bình luận lúc này.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleBuyNow = () => {
        if (isOutOfStock || quantity < 1 || !detailBook?.id) {
            toast.error("Sản phẩm đã hết hàng, không thể mua ngay.");
            return;
        }

        const checkoutIntent = {
            source: "buy-now",
            item: {
                bookId: detailBook.id,
                title: detailBook.title,
                imageUrl: detailBook.imageUrl,
                authorName: detailBook.authorName,
                price: detailBook.price,
                finalPrice: detailBook.finalPrice ?? detailBook.price,
                quantity
            }
        };

        sessionStorage.setItem(CHECKOUT_INTENT_STORAGE_KEY, JSON.stringify(checkoutIntent));
        navigate("/bookseller/checkout", { state: { checkoutIntent } });
    };

    const scrollRelated = (direction) => {
        if (!relatedTrackRef.current) {
            return;
        }

        const track = relatedTrackRef.current;
        const scrollStep = Math.max(240, Math.floor(track.clientWidth * 0.7));

        track.scrollBy({
            left: direction === "left" ? -scrollStep : scrollStep,
            behavior: "smooth"
        });
    };

    if (isInvalidId) {
        return (
            <main className="detail_page">
                <div className="detail_fragment">
                    <div className="card card-lg">
                        <h2>Invalid ID</h2>
                        <p>PLEASE BACK TO HOME PAGE.</p>
                        <Link className="btn btn-outline" to="/bookseller/home">
                            Back to home page
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (detailQuery.isLoading) {
        return (
            <main className="detail_page">
                <div className="detail_fragment">
                    <div className="card card-lg">Loading...</div>
                </div>
            </main>
        );
    }

    if (detailQuery.isError) {
        return (
            <main className="detail_page">
                <div className="detail_fragment">
                    <div className="card card-lg">
                        <h2>Không tải được dữ liệu sản phẩm</h2>
                        <p>{detailQuery.error?.message || "Đã xảy ra lỗi không xác định."}</p>
                        <button className="btn btn-primary" onClick={() => detailQuery.refetch()}>
                            Thử lại
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const book = detailBook;

    if (!book) {
        return (
            <main className="detail_page">
                <div className="detail_fragment">
                    <div className="card card-lg">
                        <h2>Không tìm thấy sản phẩm</h2>
                        <Link className="btn btn-outline" to="/bookseller/home">
                            Quay về trang chủ
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const hasDiscount = (book.discountPercent || 0) > 0;
    const currentPrice = hasDiscount ? book.finalPrice : book.price;
    const related = relatedQuery.data?.data ?? relatedQuery.data ?? [];
    const relatedItems = (Array.isArray(related) ? related : []).slice(0, 8);
    const maxBuyQty = Number.isFinite(stockQtyNum) ? Math.max(0, stockQtyNum) : 0;
    const reviews = Array.isArray(reviewsQuery.data) ? reviewsQuery.data : [];

    return (
        <>
            <main className="detail_page">
                <div className="detail_fragment">
                    <div className="book-grid">
                        <div className="book-images">
                            <div className="image-panel sticky-top">
                                <div className="image-main">
                                    <img
                                        src={getBookImage(book.imageUrl)}
                                        alt={`${book.title || "Book"} cover`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="product-info-section">
                            <div className="card card-lg product-main-card">
                                <h1 className="book-title">{book.title || "Unknown"}</h1>
                                <div className="product-meta">
                                    <div className="rating">
                                        <span className="material-icons"><Star/></span>
                                        <span className="material-icons"><Star/></span>
                                        <span className="material-icons"><Star/></span>
                                        <span className="material-icons"><Star/></span>
                                        <span className="material-icons"><StarHalf/></span>
                                    </div>
                                    <span className="meta-divider">
                                        Sold:
                                        <strong>{book.soldCount}</strong>
                                    </span>
                                    <span className="meta-divider">
                                        Feedback:
                                        <strong>{reviewsQuery.isLoading ? "..." : reviews.length}</strong>
                                    </span>
                                </div>
                                <div className="price-section">
                                    <span className="price-current">{formatPrice(currentPrice)}</span>
                                    {hasDiscount && (
                                        <span className="old-price">{formatPrice(book.price)}</span>
                                    )}
                                </div>
                                <div className="specs-grid">
                                    <div className="spec-row">
                                        <span className="spec-label">Author:</span>
                                        <span className="spec-value link">{book.authorName || "Unknown"}</span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Publisher:</span>
                                        <span className="spec-value">{book.publisherName}</span>
                                    </div>
                                </div>
                                {/* --- BEGIN FIX: khóa mua khi hết hàng — revert: bỏ isOutOfStock/maxBuyQty trên nút + bỏ dòng thông báo --- */}
                                <div className="purchase-area">
                                    {isOutOfStock ? (
                                        <p className="text-danger fw-semibold mb-2" role="status">
                                            Sản phẩm hiện đang hết hàng.
                                        </p>
                                    ) : null}
                                    <div className="quantity-section">
                                        <span className="quantity-label">Quantity:</span>
                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                disabled={isOutOfStock || quantity <= (isOutOfStock ? 0 : 1)}
                                                onClick={() =>
                                                    setQuantity((q) =>
                                                        isOutOfStock ? q : Math.max(1, q - 1)
                                                    )
                                                }
                                            >
                                                -
                                            </button>
                                            <input className="qty-input" readOnly type="text" value={quantity}/>
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                disabled={isOutOfStock || maxBuyQty <= 0 || quantity >= maxBuyQty}
                                                onClick={() =>
                                                    setQuantity((q) =>
                                                        isOutOfStock ? q : Math.min(maxBuyQty, q + 1)
                                                    )
                                                }
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="button-group">
                                        <button
                                            type="button"
                                            onClick={handleAddToCart}
                                            className="btn btn-outline btn-pill"
                                            disabled={isOutOfStock || quantity < 1}
                                        >
                                            <AddShoppingCart/> Add to cart
                                        </button>
                                        {isOutOfStock ? (
                                            <span
                                                className="btn btn-primary btn-pill"
                                                style={{opacity: 0.55, pointerEvents: "none"}}
                                                aria-disabled="true"
                                            >
                                                Buy now
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleBuyNow}
                                                className="btn btn-primary btn-pill"
                                            >
                                                Buy now
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* --- END FIX: khóa mua khi hết hàng --- */}
                            </div>

                            <div className="features-grid">
                                <div className="feature-card">
                                    <span className="material-icons feature-icon blue"><LocalShipping/></span>
                                    <div className="feature-text">
                                        <p className="feature-title">Fast delivery</p>
                                        <p className="feature-desc">Inner city: 24h</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <span className="material-icons feature-icon green"><VerifiedUser/></span>
                                    <div className="feature-text">
                                        <p className="feature-title">100% genuine</p>
                                        <p className="feature-desc">Return money if fake</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <span className="material-icons feature-icon purple"><AssignmentReturn/></span>
                                    <div className="feature-text">
                                        <p className="feature-title">Return in 30 days</p>
                                        <p className="feature-desc">Simple procedure</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card card-lg">
                                <h3 className="description-title">Product's description</h3>
                                <div className="description-content">
                                    <p>
                                        <strong>{book.title}: </strong>
                                        {book.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* --- REFACTOR START: controlled tabs for reliable review switching --- */}
                    <div className="tabs">
                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            <li className="tab-item" role="presentation">
                                <button
                                    className={`tab-link ${activeTab === "same-cate" ? "active" : ""}`}
                                    id="same-cate-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="same-cate"
                                    aria-selected={activeTab === "same-cate"}
                                    onClick={() => setActiveTab("same-cate")}
                                >
                                    Same category
                                </button>
                            </li>
                            <li className="tab-item" role="presentation">
                                <button
                                    className={`tab-link ${activeTab === "rating" ? "active" : ""}`}
                                    id="rating-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="rating"
                                    aria-selected={activeTab === "rating"}
                                    onClick={() => setActiveTab("rating")}
                                >
                                    Reviews
                                </button>
                            </li>
                        </ul>
                        <div className="tab-content" id="myTabContent">
                            <div
                                className={`tab-pane fade ${activeTab === "same-cate" ? "show active" : ""}`}
                                id="same-cate"
                                role="tabpanel"
                                aria-labelledby="same-cate-tab"
                                tabIndex="0"
                                hidden={activeTab !== "same-cate"}
                            >
                                <div className="related-header">
                                    <div className="related-controls">
                                        <button
                                            type="button"
                                            className="related-arrow"
                                            onClick={() => scrollRelated("left")}
                                            aria-label="Scroll related books left"
                                        >
                                            <ChevronLeft/>
                                        </button>
                                        <button
                                            type="button"
                                            className="related-arrow"
                                            onClick={() => scrollRelated("right")}
                                            aria-label="Scroll related books right"
                                        >
                                            <ChevronRight/>
                                        </button>
                                    </div>
                                </div>
                                <div className="related-carousel" ref={relatedTrackRef}>
                                    {relatedItems.map((item) => (
                                        <div className="related-item" key={item.id}>
                                            <ProductCard item={item} isBestSeller={false} onAddToCart={handleRelatedAddToCart}/>
                                        </div>
                                    ))}
                                    {relatedQuery.isLoading && <p>Loading</p>}
                                </div>
                            </div>
                            <div
                                className={`tab-pane fade ${activeTab === "rating" ? "show active" : ""}`}
                                id="rating"
                                role="tabpanel"
                                aria-labelledby="rating-tab"
                                tabIndex="0"
                                hidden={activeTab !== "rating"}
                            >
                                <div className="review-section">
                                    <div className="review-form-card">
                                        <h4></h4>
                                        <p className="review-flash-success" ></p>
                                        {!user ? (
                                            <p className="review-login-hint" >
                                                Bạn cần <Link to="/bookseller/login" state={{ from: location }}>Login</Link> để bình luận.
                                            </p>
                                        ) : null}
                                        <form className="review-form" onSubmit={handleSubmitReview}>

                                            <div className="review-comment-input">
                                                <label htmlFor="reviewRating">Rating:</label>
                                                <select
                                                    id="reviewRating"
                                                    name="rating"
                                                    value={reviewRating}
                                                    onChange={(event) => setReviewRating(Number(event.target.value))}
                                                >
                                                    <option value={5}>5 sao</option>
                                                    <option value={4}>4 sao</option>
                                                    <option value={3}>3 sao</option>
                                                    <option value={2}>2 sao</option>
                                                    <option value={1}>1 sao</option>
                                                </select>
                                            </div>

                                            <div className="review-comment-input">
                                                <label htmlFor="reviewComment">Feedback:</label>
                                                <textarea id="reviewComment"
                                                          name="comment"
                                                          rows="4"
                                                          maxLength="1000"
                                                          value={reviewComment}
                                                          onChange={(event) => setReviewComment(event.target.value)}
                                                          placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."></textarea>
                                            </div>

                                            <button type="submit" className="review-submit-btn" disabled={isSubmittingReview}>
                                                {isSubmittingReview ? "Submitting..." : "Submit"}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="review-list-card">
                                        <h4>Đánh giá gần đây</h4>
                                        {/* --- REVIEW REFACTOR START: render review list from backend data --- */}
                                        {reviewsQuery.isLoading ? (
                                            <div className="review-empty">Loading reviews...</div>
                                        ) : reviewsQuery.isError ? (
                                            <div className="review-empty">Cannot load reviews right now.</div>
                                        ) : reviews.length === 0 ? (
                                            <div className="review-empty">There's no feedback for this book.</div>
                                        ) : (
                                            reviews.map((review) => (
                                                <div className="review-item" key={review.reviewId}>
                                                    <div className="review-avatar">
                                                        <img alt={review.reviewerName || "User avatar"} src={getUserImage(review.reviewerAvatar)}/>
                                                        <div className="review-avatar-fallback">
                                                            {(review.reviewerName || "U").charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="review-content">
                                                        <div className="review-head">
                                                            <strong>{review.reviewerName || "User"}</strong>
                                                            <span className="review-date">
                                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                                                            </span>
                                                        </div>
                                                        <p className="review-comment">{review.comment || "No comment."}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {/* --- REVIEW REFACTOR END: render review list from backend data --- */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* --- REFACTOR END: controlled tabs for reliable review switching --- */}
                </div>
            </main>
        </>
    );
}

export default DetailBookPage;