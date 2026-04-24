import {Link} from 'react-router-dom'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">

                    <div >
                        <h2 className="footer-title">Về Chúng Tôi</h2>
                        <p className="footer-text">
                            <strong>K BOOKS</strong> là nhà sách trực tuyến hàng đầu cung cấp nhiều lựa chọn sách trên các thể loại khác nhau.
                            Sứ mệnh của chúng tôi là nuôi dưỡng tình yêu đọc sách bằng cách cung cấp sách chất lượng với giá cả cạnh tranh.
                        </p>

                        <div className="newsletter">
                            <h4 className="newsletter-title">Đăng ký nhận bản tin của chúng tôi</h4>
                            <form className="newsletter-form">
                                <input type="email" placeholder="Địa chỉ email của bạn"/>
                                <button type="button">Đăng ký</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>
                        © 2026 <strong>K BOOKS</strong>. Tất cả quyền được bảo lưu.
                    </p>
                    <div className="footer-policy">
                        <a href="#">Chính Sách Bảo Mật</a>
                        <a href="#">Điều Khoản Dịch Vụ</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;