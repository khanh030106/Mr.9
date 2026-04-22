import {Add, Close, Delete, Edit, ExpandMore, Restore, Search} from "@mui/icons-material";
import {Link} from "react-router-dom";
import "../../styles/admin/UserManagemenyPage.css";


const UserManagementPage = () => {
    return (
        <>
            <main className="um-main">
                <div className="um-content">
                        <div className="um-header-actions">
                            <a className="um-btn um-btn-primary">
                                <span className="material-symbols-outlined um-btn-icon"><Add/></span>
                                <span >Add New User</span>
                            </a>
                        </div>

                    <div
                         className="um-alert">
                    </div>

                    <div className="um-modal-overlay">
                        <section className="um-form-card um-modal-card">
                            <div className="um-modal-header">
                                <h3 className="um-form-title">Create User</h3>
                                <a className="um-modal-close"
                                   aria-label="Close form">
                                    <span className="material-symbols-outlined"><Close/></span>
                                </a>
                            </div>

                            <form className="um-form"
                                  method="post">
                                <div className="um-form-grid">

                                    <div >
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="fullName">Full Name</label>
                                            <input id="fullName" className="um-form-input"
                                                   type="text" maxLength="50" required/>
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="email">Email</label>
                                            <input id="email" className="um-form-input" type="email" autoComplete="email"
                                                   maxLength="50" required/>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="phone">Phone</label>
                                            <input id="phone" className="um-form-input" type="text"
                                                   maxLength="15" placeholder="10-15 digits"/>
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="password">Password</label>
                                            <input id="password" className="um-form-input" autoComplete={"current-password"}
                                                   type="password" minLength="6" required/>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="roleName">Role</label>
                                            <select id="roleName" className="um-form-input"
                                                    required>
                                                <option value="">Select role</option>
                                                <option >
                                                </option>
                                            </select>
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="active">Status</label>
                                            <select id="active" className="um-form-input">
                                                <option>Active</option>
                                                <option>Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="um-form-actions">
                                    <button className="um-btn um-btn-primary" type="submit">
                                        <span className="material-symbols-outlined um-btn-icon"><Add/></span>
                                        <span >Create User</span>
                                    </button>
                                    <a className="um-cancel-btn">
                                        Cancel
                                    </a>
                                </div>
                            </form>
                        </section>
                    </div>

                    <form className="um-filters" >
                        <div className="um-search-wrapper">
                            <div className="um-search-icon">
                                <span className="material-symbols-outlined"><Search/></span>
                            </div>
                            <input className="um-search-input"
                                   type="text"
                                   name="keyword"
                                   placeholder="Search by full name or email"/>
                        </div>

                        <div className="um-select-wrapper">
                            <select className="um-select" name="role">
                                <option value="all" >All Roles</option>
                                <option>
                                </option>
                            </select>
                            <div className="um-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="um-select-wrapper">
                            <select className="um-select" name="accountStatus">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="deleted">Deleted</option>
                            </select>
                            <div className="um-select-icon">
                                <span className="material-symbols-outlined"><ExpandMore/></span>
                            </div>
                        </div>

                        <div className="um-filter-actions">
                            <button className="um-btn um-btn-secondary" type="submit">Apply</button>
                            <a className="um-btn um-btn-secondary">Reset</a>
                        </div>
                    </form>

                    <div className="um-table-card">
                        <div className="um-table-wrapper">
                            <table className="um-table">
                                <thead className="um-table-head">
                                <tr>
                                    <th className="um-th">User</th>
                                    <th className="um-th">Role</th>
                                    <th className="um-th">Joined Date</th>
                                    <th className="um-th">Status</th>
                                    <th className="um-th um-th-actions">Actions</th>
                                </tr>
                                </thead>

                                <tbody className="um-table-body">
                                <tr className="um-table-row">
                                    <td className="um-td um-empty-cell" colSpan="5">No users found.</td>
                                </tr>

                                <tr className="um-table-row">
                                    <td className="um-td">
                                        <div className="um-user-cell">
                                            <div className="um-avatar">
                                                <img alt="Avatar" className="um-avatar-img"/>
                                            </div>
                                            <div className="um-user-info" style={{textAlign: 'start'}}>
                                                <div className="um-user-name">Full name</div>
                                                <div className="um-user-email">email@domain.com
                                                </div>
                                                <div className="um-user-phone">
                                                    No phone
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="um-td">
                            <span className="um-role-badge">
                                CUSTOMER
                            </span>
                                    </td>
                                    <td className="um-td" >01/01/2026</td>
                                    <td className="um-td">
                            <span className="um-status-badge">
                                <span className="um-status-dot">
                                </span>
                                <span >Active</span>
                            </span>
                                    </td>
                                    <td className="um-td um-actions-cell" style={{display: 'flex'}}>
                                        <Link to={null} className="um-action-btn um-edit-btn"
                                           title="Edit user">
                                            <span className="material-symbols-outlined um-action-icon"><Edit/></span>
                                        </Link>

                                        <form>
                                            <button className="um-action-btn um-delete-btn" type="submit"
                                                    title="Delete user">
                                                <span className="material-symbols-outlined um-action-icon"><Delete/></span>
                                            </button>
                                        </form>

                                        <form className="um-inline-form">
                                            <button className="um-action-btn um-restore-btn" type="submit"
                                                    title="Restore user">
                                                <span
                                                    className="material-symbols-outlined um-action-icon"><Restore/></span>
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="um-pagination">
                            <div className="um-pagination-info">
                                Showing
                                <span className="um-pagination-bold">0</span>
                                -
                                <span className="um-pagination-bold">0</span>
                                of
                                <span className="um-pagination-bold">0</span>
                                (Page
                                <span className="um-pagination-bold">1</span>/
                                <span className="um-pagination-bold">1</span>)
                            </div>
                            <div className="um-pagination-buttons">
                                <a className="um-pagination-btn">
                                    Previous
                                </a>
                                <a className="um-pagination-btn">
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

export default UserManagementPage;