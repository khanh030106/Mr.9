import {Link} from "react-router-dom";

const categoryTiles = [
    {
        key: "literature",
        title: "Văn Học",
        subtitle: "Những cuốn sách hay nhất về văn học.",
        link: "/bookseller/home/",
        className: "category-tile--literature",
    },
    {
        key: "business",
        title: "Kinh Doanh",
        subtitle: "Lãnh đạo, chiến lược và phát triển thực tế.",
        link: "/bookseller/home/",
        className: "category-tile--business",
    },
    {
        key: "psychology",
        title: "Tâm Lý Học",
        subtitle: "Thói quen, tư duy và phát triển cá nhân.",
        link: "/bookseller/home/",
        className: "category-tile--growth",
    },
    {
        key: "kids",
        title: "Trẻ Em & Gia Đình",
        subtitle: "Đọc sách vui vẻ cho những tâm hồn tò mò trẻ tuổi.",
        link: "/bookseller/home/",
        className: "category-tile--kids",
    },
];

const CategoryShowcaseSection = () => {
    return (
        <section className="category-showcase" aria-label="Trưng bày danh mục">
            <div className="title-block">
                <h3>Khám phá theo danh mục</h3>
                <p>Chọn một phong cách và nhảy vào các bộ sưu tập được tuyển chọn cho mọi loại độc giả.</p>
            </div>

            <ul className="category-showcase__list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px', padding: 0 }}>
                {categoryTiles.map((tile) => (
                    <li key={tile.key}>
                        <Link to={tile.link} className={`category-tile ${tile.className}`}>
                            <span className="category-tile__overlay" aria-hidden="true"></span>
                            <span className="category-tile__content">
                                <span className="category-tile__title">{tile.title}</span>
                                <span className="category-tile__subtitle">{tile.subtitle}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default CategoryShowcaseSection;

