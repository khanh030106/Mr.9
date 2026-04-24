import HeroSection from "./sections/HeroSection.jsx";
import BenefitsSection from "./sections/BenefitSection.jsx";
import "../../styles/customer/home/HomePage.css"
import "../../styles/Global.css"
import {useState, useEffect} from "react";
import {getHomeData} from "../../api/homeAPI.js";
import ProductSection from "./sections/ProductSection.jsx";
import PromoHeroSection from "./sections/PromoHeroSection.jsx";
import CategoryShowcaseSection from "./sections/CategoryShowcaseSection.jsx";
import FinalCtaSection from "./sections/FinalCtaSection.jsx";


const HomePage = () => {
    const [HomeData, setHomeData] = useState({
        topSoldOutBooks: [],
        promotionBooks: [],
        activeBooks: []
    });

    useEffect(() =>{
        document.title = "Cửa Hàng Sách - Trang Chủ"
        console.log(import.meta.env.VITE_API_URL);
        getHomeData().then(data => {
            const {top10SoldOutBooks, promotionBooks, activeBooks} = data;
            setHomeData({
                topSoldOutBooks: top10SoldOutBooks?.content || [],
                promotionBooks: promotionBooks?.content || [],
                activeBooks: activeBooks?.content || [],
            });
        }).catch(err => console.log(err));
    }, []);

    return (
        <div className="home-page">
            <section className="hero-section-wrap">
                <div className="hero-background">
                    <HeroSection/>
                </div>
            </section>
            <main>
                <section className="products_area">
                    <ProductSection
                        title="SÁCH KHUYẾN MÃI"
                        subtitle="Khám phá bộ sưu tập sách khuyến mãi độc quyền của chúng tôi, cung cấp chiết khấu đáng kinh ngạc và ưu đãi đặc biệt trên nhiều tiêu đề."
                        books={HomeData.promotionBooks}
                        loadMoreLink="/bookseller/allbook"
                    />
                </section>
                <section className="products_area promo-mid-area">
                    <PromoHeroSection/>
                </section>
                <section className="products_area">
                    <ProductSection
                        title="SÁCH BÁN CHẠY NHẤT"
                        subtitle="Khám phá những cuốn sách bán chạy nhất của chúng tôi đã thu hút độc giả trên toàn thế giới."
                        books={HomeData.topSoldOutBooks}
                        loadMoreLink="/bookseller/allbook"
                    />
                </section>
                <section className="products_area category-showcase-area">
                    <CategoryShowcaseSection/>
                </section>
                <section className="products_area">
                    <ProductSection
                        title="SÁCH KHÁC"
                        subtitle="Khám phá bộ sưu tập sách khác của chúng tôi, có nhiều tiêu đề đa dạng đã chinh phục trái tim độc giả trên toàn thế giới."
                        books={HomeData.activeBooks}
                        loadMoreLink="/bookseller/allbook"
                    />
                </section>
                <section className="products_area final-cta-area">
                    <FinalCtaSection/>
                </section>
            </main>
        </div>
    );
}

export default HomePage;