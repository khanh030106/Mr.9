import {Link} from "react-router-dom";

const FinalCtaSection = () => {
    return (
        <section className="final-cta" aria-label="Continue exploring books">
            <div className="final-cta__inner">
                <h2 className="final-cta__title">Find your next favorite book</h2>
                <p className="final-cta__description">
                    Explore fresh arrivals, timeless bestsellers, and curated picks crafted for your reading journey.
                </p>
                <Link className="final-cta__button" to="/bookseller/allbook">
                    Browse all books
                </Link>
            </div>
        </section>
    );
};

export default FinalCtaSection;

