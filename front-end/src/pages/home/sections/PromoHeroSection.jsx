import {Link} from "react-router-dom";

const PromoHeroSection = () => {
    return (
        <section className="promo-hero" aria-label="Special promotion">
            <div className="promo-hero__content">
                <p className="promo-hero__eyebrow">Limited Campaign</p>
                <h2 className="promo-hero__title">Refresh your shelf with handpicked spring reads.</h2>
                <p className="promo-hero__description">
                    Discover bestselling titles with curated discounts and free shipping on selected books this week.
                </p>
            </div>

            <div className="promo-hero__action-wrap">
                <Link className="promo-hero__cta" to="/bookseller/allbook">
                    Shop Now
                </Link>
            </div>

            <div className="promo-hero__decor" aria-hidden="true"></div>
        </section>
    );
};

export default PromoHeroSection;

