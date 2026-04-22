import {Add, Delete, Edit} from "@mui/icons-material";
import {Link} from "react-router-dom";
import "../../styles/admin/CategoryManagementPage.css";


const CategoryManagementPage = () => {
    return (
        <>
            <main className="kb-cm-main">

                <div className="kb-cm-content">
                    <div className="kb-cm-alert">
                    </div>

                    <div className="kb-cm-form-card" id="categoryForm">
                        <h3 className="kb-cm-form-title"
                        >Create Category</h3>
                        <form className="kb-cm-form"
                              method="post">
                            <div className="kb-cm-form-grid">
                                <div className="kb-cm-form-group">
                                    <label className="kb-cm-form-label" htmlFor="categoryName">Category Name</label>
                                    <input id="categoryName"
                                           name="categoryName"
                                           className="kb-cm-form-input"
                                           type="text"
                                           maxLength="100"
                                           required
                                           placeholder="e.g. Self-Help"/>
                                </div>
                                <div className="kb-cm-form-group">
                                    <label className="kb-cm-form-label" htmlFor="parentId">Parent Category</label>
                                    <select id="parentId" name="parentId" className="kb-cm-form-input">
                                        <option value="">No parent</option>
                                        <option>
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div className="kb-cm-form-actions">
                                <button type="submit" className="kb-cm-add-button">
                                    <span className="material-symbols-outlined kb-cm-add-icon"><Add/></span>
                                    <span className="kb-cm-add-text">Create Category</span>
                                </button>
                                <Link to="/bookseller/admin/categories"
                                   className="kb-cm-cancel-btn">Cancel</Link>
                            </div>
                        </form>
                    </div>

                    <div className="kb-cm-table-card">
                        <div className="kb-cm-table-wrapper">
                            <table className="kb-cm-table">
                                <thead className="kb-cm-table-head">
                                <tr>
                                    <th className="kb-cm-th">Category Name</th>
                                    <th className="kb-cm-th kb-cm-th-parent" style={{textAlign: "center"}}>Parent</th>
                                    <th className="kb-cm-th kb-cm-th-total">Total Books</th>
                                    <th className="kb-cm-th kb-cm-th-status">Status</th>
                                    <th className="kb-cm-th kb-cm-th-actions">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="kb-cm-table-body">
                                <tr className="kb-cm-table-row">
                                    <td className="kb-cm-td kb-cm-empty-cell" colSpan="5">No category found.</td>
                                </tr>

                                <tr className="kb-cm-table-row">
                                    <td className="kb-cm-td">
                                        <div className="kb-cm-category-cell">
                                            <div className="kb-cm-category-icon kb-cm-icon-orange">
                                                <span className="material-symbols-outlined">category</span>
                                            </div>
                                            <div>
                                                <p className="kb-cm-category-name">Category</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="kb-cm-td kb-cm-parent-text">
                                        -
                                    </td>
                                    <td className="kb-cm-td kb-cm-total">
                                        0
                                    </td>
                                    <td className="kb-cm-td" style={{"textAlign": "center"}}>
                                        <span className="kb-cm-badge kb-cm-badge-active">Active</span>
                                    </td>
                                    <td className="kb-cm-td kb-cm-actions-cell">
                                        <div className="kb-cm-actions kb-cm-actions-always">
                                            <Link to={null} className="kb-cm-action-btn kb-cm-edit-btn"
                                               title="Edit">
                                                <span
                                                    className="material-symbols-outlined kb-cm-action-icon"><Edit/></span>
                                            </Link>
                                            <form>
                                                <button className="kb-cm-action-btn kb-cm-delete-btn" type="submit"
                                                        title="Delete">
                                                    <span
                                                        className="material-symbols-outlined kb-cm-action-icon"><Delete/></span>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="kb-cm-pagination">
                            <p className="kb-cm-pagination-info">
                                Total categories:
                                <span className="kb-cm-pagination-bold">0</span>
                            </p>
                            <div className="kb-cm-pagination-buttons">
                                <button className="kb-cm-pagination-btn" disabled>Previous</button>
                                <button className="kb-cm-pagination-btn" disabled>Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </>
    );
}

export default CategoryManagementPage;