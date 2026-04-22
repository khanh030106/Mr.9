import {Link} from 'react-router-dom'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">

                    <div >
                        <h2 className="footer-title">About Us</h2>
                        <p className="footer-text">
                            <strong>K BOOKS</strong> is a leading online bookstore providing a wide selection of books
                            across
                            various genres.
                            Our mission is to foster a love for reading by offering quality books at competitive prices.
                        </p>

                        <div className="newsletter">
                            <h4 className="newsletter-title">Subscribe to our newsletter</h4>
                            <form className="newsletter-form">
                                <input type="email" placeholder="Your email address"/>
                                <button type="button">Subscribe</button>
                            </form>
                        </div>
                    </div>

                    <div className="customerCare" >
                        <h2 className="footer-title">Customer Care</h2>
                        <ul className="footer-links">
                            <li><a href="#"><span></span>Help Center</a></li>
                            <li><a href="#"><span></span>How to Buy</a></li>
                            <li><a href="#"><span></span>Track Your Order</a></li>
                            <li><a href="#"><span></span>Returns & Refunds</a></li>
                            <li><a href="#"><span></span>Contact Us</a></li>
                        </ul>
                    </div>
                    <div className="footer-contact" >
                        <h2 className="footer-title">Contact Us</h2>
                        <div className="contact-item" >
                            <i className="fas fa-map-marker-alt"></i>
                            <p style={{marginTop: 0, marginBottom: 0}}>51 Lac Long Quan St., Da Nang
                                city</p>
                        </div>

                        <div className="contact-item" >
                            <i className="fas fa-envelope"></i>
                            <a href="mailto:phamgiakhanh03012006@gmail.com">
                                phamgiakhanh03012006@gmail.com
                            </a>
                        </div>

                        <div className="contact-item" >
                            <i className="fas fa-phone"></i>
                            <a href="tel:+84328664814">+84 328664814</a>
                        </div>

                        <div className="socials" >
                            <a href="https://www.facebook.com/pham.gia.khanh.589369" target="_blank" rel="noreferrer"><i
                                className="fa-brands fa-facebook-f"></i></a>
                            <a href="https://www.instagram.com/khanhkdb/" target="_blank" rel="noreferrer"><i
                                className="fa-brands fa-instagram"></i></a>
                            <a href="https://www.linkedin.com/in/khanh-pham-gia-281616352/" target="_blank" rel="noreferrer"><i
                                className="fa-brands fa-linkedin-in"></i></a>
                        </div>
                    </div>

                </div>
                <div className="footer-bottom">
                    <p>
                        © 2026 <strong>K BOOKS</strong>. All rights reserved.
                    </p>
                    <div className="footer-policy">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;