import {useEffect, useMemo, useState} from "react";
import {Add, Close, Delete, Edit, ExpandMore, Search} from "@mui/icons-material";
import toast from "react-hot-toast";
import {
    createAdminBook,
    deleteAdminBook,
    getAdminBookDetail,
    getAdminBookOptions,
    getAdminBooks,
    updateAdminBook,
} from "../../api/bookApi.js";
import {getBookImage} from "../../utils/GetImageUrl.js";
import "../../styles/admin/BookManagementPage.css";

const PAGE_SIZE = 8;

const INITIAL_FORM = {
    title: "",
    isbn: "",
    description: "",
    price: "",
    quantity: "",
    publishYear: "",
    language: "",
    publisherId: "",
    newPublisherName: "",
    authorIds: [],
    newAuthorNames: "",
    categoryIds: [],
    newCategoryNames: "",
};

const BookManagementPage = () => {
    const [books, setBooks] = useState([]);
    const [options, setOptions] = useState({publishers: [], authors: [], categories: []});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [filterCategoryId, setFilterCategoryId] = useState("");
    const [filterAuthorId, setFilterAuthorId] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBookId, setEditingBookId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        document.title = "BookStore-AdminBookManagement";
    }, []);

    const loadBooks = async ({
        page = pageIndex,
        keywordValue = keyword,
        categoryId = filterCategoryId,
        authorId = filterAuthorId,
    } = {}) => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const data = await getAdminBooks({
                page,
                size: PAGE_SIZE,
                keyword: keywordValue,
                categoryId,
                authorId,
                includeDeleted: false,
            });

            setBooks(Array.isArray(data?.content) ? data.content : []);
            setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1));
            setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
        } catch (error) {
            setBooks([]);
            setErrorMessage(error?.response?.data?.message || "Không tải được danh sách sách.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const data = await getAdminBookOptions();
            setOptions({
                publishers: Array.isArray(data?.publishers) ? data.publishers : [],
                authors: Array.isArray(data?.authors) ? data.authors : [],
                categories: Array.isArray(data?.categories) ? data.categories : [],
            });
        } catch {
            setOptions({publishers: [], authors: [], categories: []});
        }
    };

    useEffect(() => {
        void loadOptions();
    }, []);

    useEffect(() => {
        void loadBooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageIndex, keyword, filterCategoryId, filterAuthorId]);

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setEditingBookId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = async (bookId) => {
        try {
            const detail = await getAdminBookDetail(bookId);
            setEditingBookId(bookId);
            setFormData({
                title: detail?.title || "",
                isbn: detail?.isbn || "",
                description: detail?.description || "",
                price: detail?.price != null ? String(detail.price) : "",
                quantity: detail?.quantity != null ? String(detail.quantity) : "0",
                publishYear: detail?.publishYear != null ? String(detail.publishYear) : "",
                language: detail?.language || "",
                publisherId: detail?.publisherId != null ? String(detail.publisherId) : "",
                newPublisherName: "",
                authorIds: Array.isArray(detail?.authorIds) ? detail.authorIds.map(String) : [],
                newAuthorNames: "",
                categoryIds: Array.isArray(detail?.categoryIds) ? detail.categoryIds.map(String) : [],
                newCategoryNames: "",
            });
            setIsModalOpen(true);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Không tải được chi tiết sách.");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const toNameList = (rawValue) => {
        if (!rawValue) return [];
        return rawValue
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const buildPayload = () => ({
        title: formData.title.trim(),
        isbn: formData.isbn.trim() || null,
        description: formData.description.trim() || null,
        price: Number(formData.price),
        quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
        publishYear: formData.publishYear === "" ? null : Number(formData.publishYear),
        language: formData.language.trim() || null,
        publisherId: formData.publisherId ? Number(formData.publisherId) : null,
        newPublisherName: formData.newPublisherName.trim() || null,
        categoryIds: formData.categoryIds.map(Number),
        newCategoryNames: toNameList(formData.newCategoryNames),
        authorIds: formData.authorIds.map(Number),
        newAuthorNames: toNameList(formData.newAuthorNames),
        isActive: true,
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        if (!formData.title.trim()) {
            toast.error("Vui lòng nhập tên sách.");
            return;
        }

        if (!formData.price || Number.isNaN(Number(formData.price))) {
            toast.error("Giá sách không hợp lệ.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = buildPayload();
            if (editingBookId) {
                await updateAdminBook(editingBookId, payload);
                toast.success("Cập nhật sách thành công.");
            } else {
                await createAdminBook(payload);
                toast.success("Thêm sách thành công.");
            }

            await Promise.all([
                loadBooks({page: 0}),
                loadOptions(),
            ]);
            setPageIndex(0);
            closeModal();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Không thể lưu sách.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (bookId) => {
        const ok = window.confirm("Bạn có chắc muốn xóa sách này?");
        if (!ok) return;

        try {
            await deleteAdminBook(bookId);
            toast.success("Xóa sách thành công.");

            const nextPage = books.length <= 1 && pageIndex > 0 ? pageIndex - 1 : pageIndex;
            setPageIndex(nextPage);
            await loadBooks({page: nextPage});
        } catch (error) {
            toast.error(error?.response?.data?.message || "Không thể xóa sách.");
        }
    };

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        setPageIndex(0);
        setKeyword(keywordInput.trim());
    };

    const handleFilterReset = () => {
        setKeywordInput("");
        setKeyword("");
        setFilterCategoryId("");
        setFilterAuthorId("");
        setPageIndex(0);
    };

    const paginationLabel = useMemo(() => {
        if (totalElements === 0) {
            return {from: 0, to: 0};
        }
        const from = pageIndex * PAGE_SIZE + 1;
        const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalElements);
        return {from, to};
    }, [pageIndex, totalElements]);

    const handleMultiSelectChange = (field) => (event) => {
        const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
        setFormData((prev) => ({...prev, [field]: selectedValues}));
    };

    const isCreateMode = !editingBookId;

    return (
        <>
            <main className="kb-inv-main">
                <div className="kb-inv-content">
                        <div className="kb-inv-header-actions">
                            <button className="kb-inv-btn kb-inv-btn-primary" type="button" onClick={openCreateModal}>
                                <span className="material-symbols-outlined kb-inv-btn-icon"><Add/></span>
                                <span>Add New Book</span>
                            </button>
                        </div>
                    

                    {isModalOpen ? (
                    <div className="kb-inv-modal-overlay">
                        <section className="kb-inv-form-card kb-inv-modal-card" id="bookForm">
                            <div className="kb-inv-modal-header">
                                <h3 className="kb-inv-form-title">{isCreateMode ? "Create Book" : "Edit Book"}</h3>
                                <button type="button" className="kb-inv-modal-close"
                                      aria-label="Close form" onClick={closeModal}>
                                    <span className="material-symbols-outlined"><Close/></span>
                                </button>
                            </div>
                            <form className="kb-inv-form" onSubmit={handleSubmit}>
                                <div className="kb-inv-form-grid">
                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="title">Title</label>
                                        <input id="title" className="kb-inv-form-input" type="text"
                                               maxLength="255" required value={formData.title}
                                               onChange={(e) => setFormData((prev) => ({...prev, title: e.target.value}))}/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="isbn">ISBN</label>
                                        <input id="isbn" className="kb-inv-form-input" type="text"
                                               maxLength="50" value={formData.isbn}
                                               onChange={(e) => setFormData((prev) => ({...prev, isbn: e.target.value}))}/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="price">Price</label>
                                        <input id="price" className="kb-inv-form-input"
                                               type="number" min="0" step="0.01" required value={formData.price}
                                               onChange={(e) => setFormData((prev) => ({...prev, price: e.target.value}))}/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="quantity">Quantity</label>
                                        <input id="quantity" className="kb-inv-form-input"
                                               type="number" min="0" required value={formData.quantity}
                                               onChange={(e) => setFormData((prev) => ({...prev, quantity: e.target.value}))}/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="publisherId">Publisher</label>
                                        <select id="publisherId"
                                                className="kb-inv-form-input" value={formData.publisherId}
                                                onChange={(e) => setFormData((prev) => ({...prev, publisherId: e.target.value}))}>
                                            <option value="">No publisher</option>
                                            {options.publishers.map((publisher) => (
                                                <option key={publisher.id} value={String(publisher.id)}>{publisher.name}</option>
                                            ))}
                                        </select>
                                        <input id="newPublisherName"
                                               className="kb-inv-form-input kb-inv-form-sub-input"
                                               type="text"
                                               maxLength="150"
                                               placeholder="Or type a new publisher name"
                                               value={formData.newPublisherName}
                                               onChange={(e) => setFormData((prev) => ({...prev, newPublisherName: e.target.value}))}
                                               style={{marginTop:'21px'}}
                                        />
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="publishYear">Publish Year</label>
                                        <input id="publishYear" className="kb-inv-form-input"
                                               type="number" min="0" max="3000" value={formData.publishYear}
                                               onChange={(e) => setFormData((prev) => ({...prev, publishYear: e.target.value}))}/>


                                        <label className="kb-inv-form-label" htmlFor="language">Language</label>
                                        <input id="language" className="kb-inv-form-input"
                                               type="text" maxLength="50" value={formData.language}
                                               onChange={(e) => setFormData((prev) => ({...prev, language: e.target.value}))}/>
                                    </div>



                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="authorIds">Authors</label>
                                        <select id="authorIds"
                                                className="kb-inv-form-input kb-inv-form-multi" multiple
                                                value={formData.authorIds}
                                                onChange={handleMultiSelectChange("authorIds")}
                                        >
                                            {options.authors.map((author) => (
                                                <option key={author.id} value={String(author.id)}>{author.name}</option>
                                            ))}
                                        </select>
                                        <textarea id="newAuthorNames"
                                                  className="kb-inv-form-input kb-inv-form-sub-input"
                                                  rows="2"
                                                  placeholder="Or enter new authors, separated by comma or new line"
                                                  value={formData.newAuthorNames}
                                                  onChange={(e) => setFormData((prev) => ({...prev, newAuthorNames: e.target.value}))}></textarea>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="categoryIds">Categories</label>
                                        <select id="categoryIds"
                                                className="kb-inv-form-input kb-inv-form-multi" multiple
                                                value={formData.categoryIds}
                                                onChange={handleMultiSelectChange("categoryIds")}
                                        >
                                            {options.categories.map((category) => (
                                                <option key={category.id} value={String(category.id)}>{category.name}</option>
                                            ))}
                                        </select>
                                        <textarea id="newCategoryNames"
                                                  className="kb-inv-form-input kb-inv-form-sub-input"
                                                  rows="2"
                                                  placeholder="Or enter new categories, separated by comma or new line"
                                                  value={formData.newCategoryNames}
                                                  onChange={(e) => setFormData((prev) => ({...prev, newCategoryNames: e.target.value}))}></textarea>
                                    </div>

                                    <div className="kb-inv-form-group kb-inv-form-group-full">
                                        <label className="kb-inv-form-label" htmlFor="description">Description</label>
                                        <textarea id="description"
                                                  className="kb-inv-form-input kb-inv-form-textarea"
                                                  rows="4" value={formData.description}
                                                  onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))}></textarea>
                                    </div>
                                </div>

                                <div className="kb-inv-form-actions">
                                    <button className="kb-inv-btn kb-inv-btn-primary" type="submit" disabled={isSubmitting}>
                                        <span className="material-symbols-outlined kb-inv-btn-icon"><Add/></span>
                                        <span>{isSubmitting ? "Saving..." : (isCreateMode ? "Create Book" : "Update Book")}</span>
                                    </button>
                                    <button className="kb-inv-cancel-btn" type="button" onClick={closeModal}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                    ) : null}

                    <form className="kb-inv-filters" onSubmit={handleFilterSubmit}>
                        <div className="kb-inv-search-wrapper">
                            <div className="kb-inv-search-icon">
                                <span className="material-symbols-outlined"><Search/></span>
                            </div>
                            <input className="kb-inv-search-input"
                                   type="text"
                                   name="keyword"
                                   placeholder="Search by title"
                                   value={keywordInput}
                                   onChange={(e) => setKeywordInput(e.target.value)}/>
                        </div>

                        <div className="kb-inv-select-wrapper">
                            <select className="kb-inv-select" name="categoryId" value={filterCategoryId}
                                    onChange={(e) => setFilterCategoryId(e.target.value)}>
                                <option value="">All Categories</option>
                                {options.categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                            </select>
                            <div className="kb-inv-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="kb-inv-select-wrapper">
                            <select className="kb-inv-select" name="authorId" value={filterAuthorId}
                                    onChange={(e) => setFilterAuthorId(e.target.value)}>
                                <option value="">All Authors</option>
                                {options.authors.map((author) => (
                                    <option key={author.id} value={String(author.id)}>{author.name}</option>
                                ))}
                            </select>
                            <div className="kb-inv-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="kb-inv-filter-actions">
                            <button className="kb-inv-btn kb-inv-btn-secondary" type="submit">Apply</button>
                            <button className="kb-inv-btn kb-inv-btn-secondary" type="button" onClick={handleFilterReset}>Reset</button>
                        </div>
                    </form>

                    {errorMessage ? <div className="kb-inv-alert" style={{color: "#dc2626"}}>{errorMessage}</div> : null}

                    <div className="kb-inv-table-card">
                        <div className="kb-inv-table-wrapper">
                            <table className="kb-inv-table">
                                <thead className="kb-inv-table-head">
                                <tr>
                                    <th className="kb-inv-th kb-inv-th-cover">Cover</th>
                                    <th className="kb-inv-th">Book Title</th>
                                    <th className="kb-inv-th">Category</th>
                                    <th className="kb-inv-th">Author</th>
                                    <th className="kb-inv-th">Price</th>
                                    <th className="kb-inv-th">Stock</th>
                                    <th className="kb-inv-th kb-inv-th-actions">Actions</th>
                                </tr>
                                </thead>

                                <tbody className="kb-inv-table-body">
                                {isLoading ? (
                                    <tr className="kb-inv-table-row">
                                        <td className="kb-inv-td kb-inv-empty-cell" colSpan="7">Loading books...</td>
                                    </tr>
                                ) : books.length === 0 ? (
                                    <tr className="kb-inv-table-row">
                                        <td className="kb-inv-td kb-inv-empty-cell" colSpan="7">No books found.</td>
                                    </tr>
                                ) : books.map((book) => (
                                    <tr className="kb-inv-table-row" key={book.id}>
                                        <td className="kb-inv-td">
                                            <div className="kb-inv-cover">
                                                <img
                                                    className="kb-inv-cover-img"
                                                    src={getBookImage(book.imageUrl)}
                                                    alt={book.title || "Book cover"}
                                                    loading="lazy"
                                                    onError={(event) => {
                                                        const fallback = getBookImage(null);
                                                        if (event.currentTarget.src !== fallback) {
                                                            event.currentTarget.src = fallback;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="kb-inv-td">
                                            <div className="kb-inv-book-title">{book.title}</div>
                                            <div className="kb-inv-book-isbn">ISBN: {book.isbn || "-"}</div>
                                        </td>
                                        <td className="kb-inv-td kb-inv-category-text">{(book.categories || []).join(", ") || "-"}</td>
                                        <td className="kb-inv-td kb-inv-author">{(book.authors || []).join(", ") || "-"}</td>
                                        <td className="kb-inv-td kb-inv-price">{Number(book.price || 0).toLocaleString("vi-VN")} VND</td>
                                        <td className="kb-inv-td">
                                            <div className="kb-inv-stock">
                                                <span className="kb-inv-stock-text">{book.quantity ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="kb-inv-td kb-inv-actions-cell">
                                            <button className="kb-inv-action-btn kb-inv-edit-btn" title="Edit" type="button"
                                                    onClick={() => openEditModal(book.id)}>
                                                <span className="material-symbols-outlined kb-inv-action-icon"><Edit/></span>
                                            </button>
                                            <button className="kb-inv-action-btn kb-inv-delete-btn" type="button" title="Delete"
                                                    onClick={() => handleDelete(book.id)}>
                                                <span className="material-symbols-outlined kb-inv-action-icon"><Delete/></span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="kb-inv-pagination">
                            <div className="kb-inv-pagination-info">
                                Showing
                                <span className="kb-inv-pagination-bold">{paginationLabel.from}</span>
                                -
                                <span className="kb-inv-pagination-bold">{paginationLabel.to}</span>
                                of
                                <span className="kb-inv-pagination-bold">{totalElements}</span>
                                (Page
                                <span className="kb-inv-pagination-bold">{pageIndex + 1}</span>/
                                <span className="kb-inv-pagination-bold">{totalPages}</span>)
                            </div>
                            <div className="kb-inv-pagination-buttons">
                                <button className="kb-inv-pagination-btn" type="button" disabled={pageIndex <= 0}
                                        onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}>
                                    Previous
                                </button>
                                <button className="kb-inv-pagination-btn" type="button" disabled={pageIndex >= totalPages - 1}
                                        onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}>
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
    // --- ADMIN BOOK MANAGEMENT UI END: list + modal form add/edit/delete with API integration ---
}

export default BookManagementPage;
