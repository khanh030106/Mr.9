import {Link} from "react-router-dom";

const HeroSection = () => {
    return (
        <div className="hero-content">
            <p className="hero-kicker">Những lựa chọn được tuyển chọn bởi Bookly</p>
            <h1>
                Tìm Cuốn Sách Yêu Thích Tiếp Theo Của Bạn
                <br/>
                Tại Một Nơi Ấm Áp
            </h1>
            <p className="hero-description">
                Khám phá những cuốn sách bán chạy nhất, những tác phẩm kinh điển vượt thời gian, và những bản phát hành mới với giá cả phải chăng và giao hàng nhanh chóng.
            </p>
            <Link to="/bookseller/home/morebook?type=activeBooks" className="hero-cta">
                Khám Phá Ngay
            </Link>
        </div>
    );
}

export default HeroSection;