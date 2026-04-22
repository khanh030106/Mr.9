import {Link} from "react-router-dom";

const categoryTiles = [
    {
        key: "literature",
        title: "Literature",
        subtitle: "Best books by literature.",
        link: "/bookseller/home/",
        className: "category-tile--literature",
    },
    {
        key: "business",
        title: "Business",
        subtitle: "Leadership, strategy, and practical growth.",
        link: "/bookseller/home/",
        className: "category-tile--business",
    },
    {
        key: "psychology",
        title: "Psychology",
        subtitle: "Habits, mindset, and personal development.",
        link: "/bookseller/home/",
        className: "category-tile--growth",
    },
    {
        key: "kids",
        title: "Kids & Family",
        subtitle: "Joyful reading for young curious minds.",
        link: "/bookseller/home/",
        className: "category-tile--kids",
    },
];

const CategoryShowcaseSection = () => {
    return (
        <section className="category-showcase" aria-label="Category showcase">
            <div className="title-block">
                <h3>Explore by Category</h3>
                <p>Pick a vibe and jump into collections curated for every type of reader.</p>
            </div>

            <div className="category-showcase__grid">
                {categoryTiles.map((tile) => (
                    <Link key={tile.key} to={tile.link} className={`category-tile ${tile.className}`}>
                        <span className="category-tile__overlay" aria-hidden="true"></span>
                        <span className="category-tile__content">
                            <span className="category-tile__title">{tile.title}</span>
                            <span className="category-tile__subtitle">{tile.subtitle}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryShowcaseSection;

