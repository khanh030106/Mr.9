import {Link} from "react-router-dom";

const FinalCtaSection = () => {
    return (
        <section className="final-cta" aria-label="Tiếp tục khám phá sách">
            <div className="final-cta__inner">
                <h2 className="final-cta__title">Tìm cuốn sách yêu thích tiếp theo của bạn</h2>
                <p className="final-cta__description">
                    Khám phá những cuốn sách mới đến, những cuốn sách bán chạy kinh điển, và những lựa chọn được tuyển chọn dành cho hành trình đọc sách của bạn.
                </p>
                <Link className="final-cta__button" to="/bookseller/allbook">
                    Duyệt tất cả sách
                </Link>
            </div>
        </section>
    );
};

export default FinalCtaSection;

