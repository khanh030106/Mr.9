import {Link} from "react-router-dom";

const PromoHeroSection = () => {
    return (
        <section className="promo-hero" aria-label="Khuyến mãi đặc biệt">
            <div className="promo-hero__content">
                <p className="promo-hero__eyebrow">Chiến dịch có hạn</p>
                <h2 className="promo-hero__title">Làm mới kệ sách của bạn với những cuốn sách mùa xuân được chọn lọc.</h2>
                <p className="promo-hero__description">
                    Khám phá những tiêu đề bán chạy nhất với chiết khấu được tuyển chọn và giao hàng miễn phí trên các cuốn sách được chọn trong tuần này.
                </p>
            </div>

            <div className="promo-hero__action-wrap">
                <Link className="promo-hero__cta" to="/bookseller/allbook">
                    Mua Ngay
                </Link>
            </div>

            <div className="promo-hero__decor" aria-hidden="true"></div>
        </section>
    );
};

export default PromoHeroSection;

