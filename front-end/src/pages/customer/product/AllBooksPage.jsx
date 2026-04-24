import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import "../../../styles/customer/product/AllBooksPage.css";
import ProductCard from "../../../components/ProductCard.jsx";
import {getActiveBookAuthors, getActiveBooksPage, getAllCategories} from "../../../api/bookApi.js";

const ITEMS_PER_PAGE = 16;

const AllBooksPage =() =>{
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedPrice, setSelectedPrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState("");

    useEffect(() => {
        document.title = "BookStore-AllBooks";
    }, []);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchFilterOptions = async () => {
            try {
                const [categoryData, authorData] = await Promise.all([
                    getAllCategories(),
                    getActiveBookAuthors(controller.signal),
                ]);

                if (!isMounted) return;
                setCategories(Array.isArray(categoryData) ? categoryData : []);
                setAuthors(Array.isArray(authorData) ? authorData : []);
            } catch {
                if (!isMounted) return;
                setCategories([]);
                setAuthors([]);
            }
        };

        void fetchFilterOptions();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    useEffect(() => {
        // Reset to first page whenever user changes any filter criterion.
        setPageIndex(0);
    }, [selectedPrice, selectedCategory, selectedAuthor]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchActiveBooks = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const data = await getActiveBooksPage(
                    pageIndex,
                    ITEMS_PER_PAGE,
                    {
                        price: selectedPrice,
                        categoryId: selectedCategory,
                        authorId: selectedAuthor,
                    },
                    controller.signal
                );
                if (!isMounted) return;

                setBooks(Array.isArray(data?.content) ? data.content : []);
                setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1));
            } catch (error) {
                if (!isMounted || error?.name === "CanceledError") return;
                setErrorMessage("Không tải được sách active. Vui lòng thử lại.");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchActiveBooks();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [pageIndex, selectedPrice, selectedCategory, selectedAuthor]);
    // --- ALL BOOKS REFACTOR END: load active books and render ProductCard in existing grid container ---

    return(
        <main className="browse-books-page">
            <div className="mainContent" id="morebookTop">
                <div className="morebook-wrapper">

                    <div className="morebook-layout">
                    <aside className="morebook-sidebar">
                        <div className="filter-panel">
                            <h4>Bộ lọc sách</h4>

                            <form id="filterForm"
                            >
                                <input type="hidden" name="type"/>
                                <input type="hidden" name="pageSize" />
                                <input type="hidden" name="index" value="0"/>

                                <div className="filter-group">
                                    <h5>Giá tiền</h5>
                                    <label className="filter-radio-item">
                                        <input
                                            type="radio"
                                            name="price"
                                            value=""
                                            checked={selectedPrice === ""}
                                            onChange={(event) => setSelectedPrice(event.target.value)}
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                    <label className="filter-radio-item">
                                        <input
                                            type="radio"
                                            name="price"
                                            value="0-100000"
                                            checked={selectedPrice === "0-100000"}
                                            onChange={(event) => setSelectedPrice(event.target.value)}
                                        />
                                        <span>0 - 100.000</span>
                                    </label>
                                    <label className="filter-radio-item">
                                        <input
                                            type="radio"
                                            name="price"
                                            value="100000-200000"
                                            checked={selectedPrice === "100000-200000"}
                                            onChange={(event) => setSelectedPrice(event.target.value)}
                                        />
                                        <span>100.000 - 200.000</span>
                                    </label>
                                    <label className="filter-radio-item">
                                        <input
                                            type="radio"
                                            name="price"
                                            value="200000+"
                                            checked={selectedPrice === "200000+"}
                                            onChange={(event) => setSelectedPrice(event.target.value)}
                                        />
                                        <span>Trên 200.000</span>
                                    </label>
                                </div>

                                <div className="filter-group filter-group-categories">
                                    <h5>Loại sách</h5>
                                    <select
                                        className="filter-select"
                                        value={selectedCategory}
                                        onChange={(event) => setSelectedCategory(event.target.value)}
                                    >
                                        <option value="">Tất cả thể loại</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group filter-group-authors">
                                    <h5>Tác giả</h5>
                                    <select
                                        className="filter-select"
                                        value={selectedAuthor}
                                        onChange={(event) => setSelectedAuthor(event.target.value)}
                                    >
                                        <option value="">Tất cả tác giả</option>
                                        {authors.map((author) => (
                                            <option key={author.id} value={String(author.id)}>
                                                {author.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </form>

                            <div
                                id="filterIndicator"
                                className="filter-indicator htmx-indicator"
                                style={{display: isLoading ? "inline-flex" : "none"}}
                            >
                                <span className="spinner-border spinner-border-sm" role="status"
                                      aria-hidden="true"></span>
                                <span>Đang lọc sách...</span>
                            </div>
                        </div>
                    </aside>

                    <section className="morebook-content">

                        <div id="morebookResults" className="morebook-results">
                            <div className="products_gird allbooks-products-grid">
                                {books.map((item) => (
                                    <div className="allbooks-product-card-shell" key={item.id}>
                                        <ProductCard item={item} />
                                    </div>
                                ))}
                            </div>

                            <div className="mb-empty-state" style={{display: isLoading || errorMessage || books.length === 0 ? "block" : "none"}}>
                                {isLoading
                                    ? "Đang tải sách..."
                                    : (errorMessage || "Không có sách phù hợp")}
                            </div>

                            <div>
                                <div className="pagination" style={{display: totalPages > 1 ? "flex" : "none"}}>
                                    <button
                                        type="button"
                                        className="page-link"
                                        disabled={pageIndex <= 0}
                                        onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                                    >
                                        Previous
                                    </button>
                                    <span className="page-link" style={{pointerEvents: "none"}}>
                                        Page {pageIndex + 1} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="page-link"
                                        disabled={pageIndex >= totalPages - 1}
                                        onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                </div>
            </div>
        </main>
    );
}

export default AllBooksPage;