import {Link} from "react-router-dom";
import {Add, Close, Delete, Edit, ExpandMore, Search} from "@mui/icons-material";
import "../../styles/admin/BookManagementPage.css";


const BookManagementPage = () => {
    return (
        <>
            <main className="kb-inv-main">
                <div className="kb-inv-content">
                        <div className="kb-inv-header-actions">
                            <a className="kb-inv-btn kb-inv-btn-primary">
                                <span className="material-symbols-outlined kb-inv-btn-icon"><Add/></span>
                                <span>Add New Book</span>
                            </a>
                        </div>

                    <div className="kb-inv-modal-overlay">
                        <section className="kb-inv-form-card kb-inv-modal-card" id="bookForm">
                            <div className="kb-inv-modal-header">
                                <h3 className="kb-inv-form-title">Create Book</h3>
                                <Link to={null} className="kb-inv-modal-close"
                                      aria-label="Close form">
                                    <span className="material-symbols-outlined"><Close/></span>
                                </Link>
                            </div>
                            <form className="kb-inv-form"
                                  method="post"
                                  encType="multipart/form-data">
                                <div className="kb-inv-form-grid">
                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="title">Title</label>
                                        <input id="title" className="kb-inv-form-input" type="text"
                                               maxLength="255" required/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="isbn">ISBN</label>
                                        <input id="isbn" className="kb-inv-form-input" type="text"
                                               maxLength="20"/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="price">Price</label>
                                        <input id="price" className="kb-inv-form-input"
                                               type="number" min="0" step="0.01" required/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="quantity">Quantity</label>
                                        <input id="quantity" className="kb-inv-form-input"
                                               type="number" min="0" required/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="publisherId">Publisher</label>
                                        <select id="publisherId"
                                                className="kb-inv-form-input">
                                            <option value="">No publisher</option>
                                            <option>
                                            </option>
                                        </select>
                                        <input id="newPublisherName"
                                               className="kb-inv-form-input kb-inv-form-sub-input"
                                               type="text"
                                               maxLength="150"
                                               placeholder="Or type a new publisher name"/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="publishYear">Publish Year</label>
                                        <input id="publishYear" className="kb-inv-form-input"
                                               type="number" min="0" max="3000"/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="language">Language</label>
                                        <input id="language" className="kb-inv-form-input"
                                               type="text" maxLength="50"/>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="imageFile">Cover Image</label>
                                        <input id="imageFile" name="imageFile" className="kb-inv-form-input" type="file"
                                               style={{padding: "6px"}}
                                               accept="image/*"/>
                                        <input type="hidden"/>
                                        <small className="kb-inv-help-text">
                                            Current image
                                        </small>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="authorIds">Authors</label>
                                        <select id="authorIds"
                                                className="kb-inv-form-input kb-inv-form-multi" >
                                            <option>
                                            </option>
                                        </select>
                                        <textarea id="newAuthorNames"
                                                  className="kb-inv-form-input kb-inv-form-sub-input"
                                                  rows="2"
                                                  placeholder="Or enter new authors, separated by comma or new line"></textarea>
                                    </div>

                                    <div className="kb-inv-form-group">
                                        <label className="kb-inv-form-label" htmlFor="categoryIds">Categories</label>
                                        <select id="categoryIds"
                                                className="kb-inv-form-input kb-inv-form-multi">
                                            <option>
                                            </option>
                                        </select>
                                        <textarea id="newCategoryNames"
                                                  className="kb-inv-form-input kb-inv-form-sub-input"
                                                  rows="2"
                                                  placeholder="Or enter new categories, separated by comma or new line"></textarea>
                                    </div>

                                    <div className="kb-inv-form-group kb-inv-form-group-full">
                                        <label className="kb-inv-form-label" htmlFor="description">Description</label>
                                        <textarea id="description"
                                                  className="kb-inv-form-input kb-inv-form-textarea"
                                                  rows="4"></textarea>
                                    </div>
                                </div>

                                <div className="kb-inv-form-actions">
                                    <button className="kb-inv-btn kb-inv-btn-primary" type="submit">
                                        <span className="material-symbols-outlined kb-inv-btn-icon"><Add/></span>
                                        <span>Create Book</span>
                                    </button>
                                    <Link className="kb-inv-cancel-btn"
                                          to={null}>
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </section>
                    </div>

                    <form className="kb-inv-filters">
                        <div className="kb-inv-search-wrapper">
                            <div className="kb-inv-search-icon">
                                <span className="material-symbols-outlined"><Search/></span>
                            </div>
                            <input className="kb-inv-search-input"
                                   type="text"
                                   name="keyword"
                                   placeholder="Search by title or ISBN"/>
                        </div>

                        <div className="kb-inv-select-wrapper">
                            <select className="kb-inv-select" name="categoryId">
                                <option value="">All Categories</option>
                                <option>
                                </option>
                            </select>
                            <div className="kb-inv-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="kb-inv-select-wrapper">
                            <select className="kb-inv-select" name="stockStatus">
                                <option value="all">All Stock</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of
                                    Stock
                                </option>
                            </select>
                            <div className="kb-inv-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="kb-inv-filter-actions">
                            <button className="kb-inv-btn kb-inv-btn-secondary" type="submit">Apply</button>
                            <Link className="kb-inv-btn kb-inv-btn-secondary" to="/bookseller/admin/books">Reset</Link>
                        </div>
                    </form>

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
                                <tr className="kb-inv-table-row">
                                    <td className="kb-inv-td kb-inv-empty-cell" colSpan="7">No books found.</td>
                                </tr>

                                <tr className="kb-inv-table-row">
                                    <td className="kb-inv-td">
                                        <div className="kb-inv-cover">
                                            <img
                                                alt="Book cover"
                                                className="kb-inv-cover-img"/>
                                        </div>
                                    </td>
                                    <td className="kb-inv-td">
                                        <div className="kb-inv-book-title">Book title</div>
                                        <div className="kb-inv-book-isbn">ISBN: -
                                        </div>
                                    </td>
                                    <td className="kb-inv-td kb-inv-category-text"
                                    >Category
                                    </td>
                                    <td className="kb-inv-td kb-inv-author">Author</td>
                                    <td className="kb-inv-td kb-inv-price">
                                        0 VND
                                    </td>
                                    <td className="kb-inv-td">
                                        <div className="kb-inv-stock">
                                            <div className="kb-inv-stock-dot">
                                            </div>
                                            <span className="kb-inv-stock-text">
                                    0
                                </span>
                                        </div>
                                    </td>
                                    <td className="kb-inv-td kb-inv-actions-cell">
                                        <a className="kb-inv-action-btn kb-inv-edit-btn"
                                           title="Edit">
                                            <span
                                                className="material-symbols-outlined kb-inv-action-icon"><Edit/></span>
                                        </a>
                                        <form>
                                            <button className="kb-inv-action-btn kb-inv-delete-btn" type="submit"
                                                    title="Delete">
                                                <span
                                                    className="material-symbols-outlined kb-inv-action-icon"><Delete/></span>
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="kb-inv-pagination">
                            <div className="kb-inv-pagination-info">
                                Showing
                                <span className="kb-inv-pagination-bold">0</span>
                                -
                                <span className="kb-inv-pagination-bold">0</span>
                                of
                                <span className="kb-inv-pagination-bold">0</span>
                                (Page
                                <span className="kb-inv-pagination-bold">1</span>/
                                <span className="kb-inv-pagination-bold">1</span>)
                            </div>
                            <div className="kb-inv-pagination-buttons">
                                <a className="kb-inv-pagination-btn">
                                    Previous
                                </a>
                                <a className="kb-inv-pagination-btn">
                                    Next
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default BookManagementPage;