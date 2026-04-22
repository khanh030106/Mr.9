import {useRef} from "react";
import {Link} from "react-router-dom";
import ProductCard from "../../../components/ProductCard.jsx";

const ProductSection = ({title, subtitle, books, loadMoreLink, /*wishlistId*/}) => {
    const isBestSellerSection = title.includes("TOP SOLD OUT") || title.includes("BEST SELLING");
    const bookList = Array.isArray(books) ? books : [];
    const trackRef = useRef(null);

    const handleScroll = (direction) => {
        const track = trackRef.current;
        if (!track) return;

        const adaptiveStep = Math.max(260, Math.min(track.clientWidth * 0.72, 460));
        track.scrollBy({
            left: direction === "left" ? -adaptiveStep : adaptiveStep,
            behavior: "smooth",
        });
    };

    return (
        <section className="products-section-inner">
            <div className="title_and_see_more products-section-header">
                <div className="title-block">
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
                <Link to={loadMoreLink} className="view-all-link">View all <span className="view-all-arrow" aria-hidden="true">&rarr;</span></Link>
            </div>
            <div className="carousel-container">
                <button
                    type="button"
                    className="carousel-btn left"
                    onClick={() => handleScroll("left")}
                    aria-label={`Scroll ${title} left`}
                >
                    &lsaquo;
                </button>
                <div className="carousel-track" ref={trackRef}>
                    { bookList.length > 0 ? (
                        bookList.map(item => (
                            <div className="product-card-shell" key={item.id}>
                                <ProductCard item={item} isBestSeller={isBestSellerSection} /*wishListId={wishlistId}*//>
                            </div>
                        ))
                    ) : (
                        <p className="no-books-message">No books available in this section yet.</p>
                    )}
                </div>
                <button
                    type="button"
                    className="carousel-btn right"
                    onClick={() => handleScroll("right")}
                    aria-label={`Scroll ${title} right`}
                >
                    &rsaquo;
                </button>
            </div>
        </section>
    );
}

export default ProductSection;