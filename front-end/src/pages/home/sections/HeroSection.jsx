import {Link} from "react-router-dom";

const HeroSection = () => {
    return (
        <div className="hero-content">
            <p className="hero-kicker">Bookly curated picks</p>
            <h1>
                Find Your Next Favorite Book
                <br/>
                In One Cozy Place
            </h1>
            <p className="hero-description">
                Discover best sellers, timeless classics, and fresh releases with gentle prices and fast delivery.
            </p>
            <Link to="/bookseller/home/morebook?type=activeBooks" className="hero-cta">
                Discover Now
            </Link>
        </div>
    );
}

export default HeroSection;