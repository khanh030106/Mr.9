import {Link, useNavigate} from 'react-router-dom';
import LOGO from "../../../assets/images/LOGO.jpg"
import {AuthContext} from "../../../contexts/AuthContext.jsx";
import {useContext, useEffect, useRef, useState} from "react";
import axiosClient from "../../../api/axiosClient.js";
import {useCart} from "../../../contexts/CartContext.jsx";
import {getAllCategories, getSearchSuggestions} from "../../../api/bookApi.js";
import {getBookImage} from "../../../utils/GetImageUrl.js";
import {formatPrice} from "../../../utils/FormatPrice.jsx";

const Header = () => {

    const {user, loading} = useContext(AuthContext);
    const {cartCount, refreshCart, clearCart} = useCart();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
    const searchWrapRef = useRef(null);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            clearCart();
            return;
        }

        void refreshCart();
    }, [loading, user, refreshCart, clearCart])


    useEffect(() => {
        // --- BEGIN FIX: tránh unhandled rejection khi API category lỗi — revert: gọi getAllCategories() không try/catch ---
        const fetchCategory = async () => {
            try {
                const data = await getAllCategories();
                setCategories(Array.isArray(data) ? data : []);
            } catch {
                setCategories([]);
            }
        };
        void fetchCategory();
        // --- END FIX: category error ---
    }, []);


    const logout = async () => {
        try {
            await axiosClient.post("/auth/logout");
            localStorage.removeItem("accessToken");
            navigate("/bookseller/login", { replace: true });
        }catch (err) {
            console.error(err);
        }
    }

    // --- SEARCH REFACTOR START: live search dropdown + submit behavior ---
    const closeSuggestions = () => {
        setIsSuggestionOpen(false);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const keyword = searchKeyword.trim();
        closeSuggestions();

        if (!keyword) {
            navigate("/bookseller/allbook");
            return;
        }

        navigate(`/bookseller/allbook?q=${encodeURIComponent(keyword)}`);
    };

    const handleSuggestionClick = (bookId) => {
        setSearchKeyword("");
        closeSuggestions();
        navigate(`/bookseller/detail/${bookId}`);
    };

    useEffect(() => {
        const keyword = searchKeyword.trim();
        if (keyword.length < 2) {
            setSuggestions([]);
            setIsSuggesting(false);
            closeSuggestions();
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsSuggesting(true);
            try {
                const data = await getSearchSuggestions(keyword, 5, controller.signal);
                setSuggestions(data);
                setIsSuggestionOpen(true);
            } catch (error) {
                if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
                    setSuggestions([]);
                    closeSuggestions();
                }
            } finally {
                setIsSuggesting(false);
            }
        }, 250);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchKeyword]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!searchWrapRef.current?.contains(event.target)) {
                closeSuggestions();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // --- SEARCH REFACTOR END: live search dropdown + submit behavior ---

    if(loading) return null;

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <button
                    type="button"
                    className="site-header__hamburger"
                    aria-label="Toggle navigation"
                >
                    <i className="fa-solid fa-bars" aria-hidden="true"/>
                </button>

                <div className="site-header__brand">
                    <Link to="/bookseller/home" className="site-header__logo">
                        <img alt="logo" src={LOGO} className="site-header__logo"/>
                    </Link>
                </div>

                <nav className="site-header__nav" aria-label="Primary">
                    <Link to="/bookseller/home" className="site-header__nav-link">Home</Link>
                    <div className="site-header__dropdown">
                        <button
                            type="button"
                            className="site-header__nav-link site-header__dropdown-trigger"
                            aria-haspopup="menu"
                        >
                            Categories <span aria-hidden="true" className="site-header__dropdown-caret">▾</span>
                        </button>
                        <div className="site-header__dropdown-menu" role="menu" aria-label="Book categories">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Link to={`/bookseller/home/morebook?cateId=${category.id}`} key={category.id} className="site-header__dropdown-link" role="menuitem">{category.name}</Link>
                                ))
                            ) : (
                                <span className="site-header__dropdown-empty">No categories</span>
                            )}
                        </div>
                    </div>
                    <Link to="/bookseller/order" className="site-header__nav-link">Orders</Link>
                </nav>

                <div className="site-header__search-wrap">
                    <div className="site-header__search-box" ref={searchWrapRef}>
                        <form className="site-header__search" onSubmit={handleSearchSubmit}>
                            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"/>
                            <input
                                type="text"
                                placeholder="Tìm sách, tác giả..."
                                autoComplete="off"
                                value={searchKeyword}
                                onFocus={() => {
                                    if (suggestions.length > 0) setIsSuggestionOpen(true);
                                }}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                            />
                        </form>

                        {isSuggestionOpen ? (
                            <div className="site-header__search-suggestion-list" role="listbox" aria-label="Search suggestions">
                                {isSuggesting ? (
                                    <div className="site-header__search-suggestion-empty">Đang tìm kiếm...</div>
                                ) : suggestions.length === 0 ? (
                                    <div className="site-header__search-suggestion-empty">Không có sản phẩm phù hợp.</div>
                                ) : (
                                    suggestions.map((book) => (
                                        <button
                                            key={book.id}
                                            type="button"
                                            className="site-header__search-suggestion-item"
                                            onClick={() => handleSuggestionClick(book.id)}
                                        >
                                            <img
                                                className="site-header__search-suggestion-image"
                                                src={getBookImage(book.imageUrl)}
                                                alt={book.title}
                                            />
                                            <span className="site-header__search-suggestion-content">
                                                <span className="site-header__search-suggestion-title">{book.title}</span>
                                                <span className="site-header__search-suggestion-price">
                                                    {formatPrice(book.finalPrice || book.price)}d
                                                </span>
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="site-header__actions">
                    <Link to="/bookseller/favourite" className="site-header__icon-btn" aria-label="Wishlist">
                        <i className="bi bi-heart" aria-hidden="true"/>
                    </Link>

                    <Link to="/bookseller/cart" className="site-header__icon-btn" aria-label="Cart">
                        <i className="bi bi-cart2" aria-hidden="true"/>
                        <span className="site-header__cart-badge">{cartCount > 0 ? cartCount : 0}</span>
                    </Link>
                    <>
                        <Link to="/bookseller/profile" className="site-header__avatar" aria-label="Profile">
                            <i className="fa-regular fa-user" aria-hidden="true"/>
                        </Link>
                        {user == null ? (
                            <button className="site-header__auth-btn" type="button">
                                <Link to="bookseller/login" style={{color: "white", textDecoration: "none"}}>
                                    Login
                                </Link>
                            </button>
                        ):(
                            <button onClick={logout} className="site-header__auth-btn" type="button">Logout</button>
                        )}
                    </>
                </div>
            </div>
        </header>
    );
}

export default Header;
