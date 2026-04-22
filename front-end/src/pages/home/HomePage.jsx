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
        document.title = "BookStore-HomePage"
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
                <BenefitsSection/>
            </section>
            <main>
                <section className="products_area">
                    <ProductSection
                        title="PROMOTION BOOKS"
                        subtitle="Explore our exclusive collection of promotion books, offering incredible discounts and special offers on a wide range of titles."
                        books={HomeData.promotionBooks}
                        loadMoreLink="/bookseller/allbook"
                    />
                </section>
                <section className="products_area promo-mid-area">
                    <PromoHeroSection/>
                </section>
                <section className="products_area">
                    <ProductSection
                        title="TOP SOLD OUT BOOKS"
                        subtitle="Discover our best-selling books that have captivated readers worldwide."
                        books={HomeData.topSoldOutBooks}
                        loadMoreLink="/bookseller/allbook"
                    />
                </section>
                <section className="products_area category-showcase-area">
                    <CategoryShowcaseSection/>
                </section>
                <section className="products_area">
                    <ProductSection
                        title="OTHER OUT BOOKS"
                        subtitle="Explore our collection of other out books, featuring a diverse range of titles that have captured the hearts of readers worldwide."
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