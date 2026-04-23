import { useEffect, useMemo, useState } from "react";
import {Add, Close, Delete, Edit, ExpandMore, Restore, Search, ToggleOff, ToggleOn} from "@mui/icons-material";
import toast from "react-hot-toast";
import {
    createAdminUser,
    getAdminUserDetail,
    getAdminUserOptions,
    getAdminUsers,
    restoreAdminUser,
    setAdminUserStatus,
    softDeleteAdminUser,
    updateAdminUser,
} from "../../api/bookApi.js";
import { getUserImage } from "../../utils/GetImageUrl.js";
import "../../styles/admin/UserManagemenyPage.css";

const PAGE_SIZE = 8;

const INITIAL_FORM = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleName: "",
    isActive: true,
    gender: "",
    dateOfBirth: "",
};

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [errorMessage, setErrorMessage] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);

    useEffect(() => {
        document.title = "BookStore-AdminUserManagement";
    }, []);

    const resolveStatusParams = (status) => {
        if (status === "active") {
            return { isActive: true, isDeleted: false };
        }
        if (status === "inactive") {
            return { isActive: false, isDeleted: false };
        }
        if (status === "deleted") {
            return { isDeleted: true };
        }
        return {};
    };

    const loadUsers = async ({
        page = pageIndex,
        keywordValue = keyword,
        roleValue = roleFilter,
        statusValue = statusFilter,
    } = {}) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const statusParams = resolveStatusParams(statusValue);
            const data = await getAdminUsers({
                page,
                size: PAGE_SIZE,
                keyword: keywordValue,
                role: roleValue === "all" ? undefined : roleValue,
                ...statusParams,
            });

            setUsers(Array.isArray(data?.content) ? data.content : []);
            setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1));
            setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
        } catch (error) {
            setUsers([]);
            setErrorMessage(error?.response?.data?.message || "Khong tai duoc danh sach nguoi dung.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadRoleOptions = async () => {
        try {
            const data = await getAdminUserOptions();
            setRoles(Array.isArray(data?.roles) ? data.roles : []);
        } catch {
            setRoles([]);
        }
    };

    useEffect(() => {
        void loadRoleOptions();
    }, []);

    useEffect(() => {
        void loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageIndex, keyword, roleFilter, statusFilter]);

    const resetForm = () => {
        setEditingUserId(null);
        setFormData(INITIAL_FORM);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = async (userId) => {
        try {
            const detail = await getAdminUserDetail(userId);
            setEditingUserId(userId);
            setFormData({
                fullName: detail?.fullName || "",
                email: detail?.email || "",
                phone: detail?.phone || "",
                password: "",
                roleName: Array.isArray(detail?.roles) && detail.roles.length > 0 ? detail.roles[0] : "",
                isActive: Boolean(detail?.active),
                gender: detail?.gender || "",
                dateOfBirth: detail?.dateOfBirth || "",
            });
            setIsModalOpen(true);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong tai duoc thong tin nguoi dung.");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        const fullName = formData.fullName.trim();
        if (!fullName) {
            toast.error("Vui long nhap ho ten.");
            return;
        }

        if (!formData.roleName) {
            toast.error("Vui long chon role.");
            return;
        }

        if (!editingUserId) {
            if (!formData.email.trim()) {
                toast.error("Vui long nhap email.");
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                toast.error("Mat khau phai co it nhat 6 ky tu.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (editingUserId) {
                const updatePayload = {
                    fullName,
                    phone: formData.phone.trim() || null,
                    gender: formData.gender.trim() || null,
                    dateOfBirth: formData.dateOfBirth || null,
                    roleName: formData.roleName,
                    isActive: Boolean(formData.isActive),
                };
                await updateAdminUser(editingUserId, updatePayload);
                toast.success("Cap nhat nguoi dung thanh cong.");
            } else {
                const createPayload = {
                    fullName,
                    email: formData.email.trim(),
                    phone: formData.phone.trim() || null,
                    password: formData.password,
                    roleName: formData.roleName,
                    isActive: Boolean(formData.isActive),
                };
                await createAdminUser(createPayload);
                toast.success("Them nguoi dung thanh cong.");
            }

            await Promise.all([
                loadUsers({ page: 0 }),
                loadRoleOptions(),
            ]);
            setPageIndex(0);
            closeModal();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the luu nguoi dung.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSoftDelete = async (userId) => {
        const ok = window.confirm("Ban co chac muon xoa mem tai khoan nay?");
        if (!ok) return;
        try {
            await softDeleteAdminUser(userId);
            toast.success("Da xoa mem tai khoan.");

            const nextPage = users.length <= 1 && pageIndex > 0 ? pageIndex - 1 : pageIndex;
            setPageIndex(nextPage);
            await loadUsers({ page: nextPage });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the xoa nguoi dung.");
        }
    };

    const handleRestore = async (userId) => {
        try {
            await restoreAdminUser(userId);
            toast.success("Da khoi phuc tai khoan.");
            await loadUsers();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the khoi phuc nguoi dung.");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await setAdminUserStatus(user.id, !user.active);  //!Boolean(user.active)
            toast.success("Cap nhat trang thai thanh cong.");
            await loadUsers();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the cap nhat trang thai.");
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
        setRoleFilter("all");
        setStatusFilter("all");
        setPageIndex(0);
    };

    const paginationLabel = useMemo(() => {
        if (totalElements === 0) {
            return { from: 0, to: 0 };
        }
        const from = pageIndex * PAGE_SIZE + 1;
        const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalElements);
        return { from, to };
    }, [pageIndex, totalElements]);

    const isCreateMode = !editingUserId;

    const statusMeta = (user) => {
        if (user.deleted) {
            return { text: "Deleted", className: "um-status-badge um-status-badge-deleted" };
        }
        if (user.active) {
            return { text: "Active", className: "um-status-badge um-status-badge-active" };
        }
        return { text: "Inactive", className: "um-status-badge um-status-badge-inactive" };
    };

    return (
        <main className="um-main">
            <div className="um-content">
                <div className="um-header-actions">
                    <button className="um-btn um-btn-primary" type="button" onClick={openCreateModal}>
                        <span className="material-symbols-outlined um-btn-icon"><Add /></span>
                        <span>Add New User</span>
                    </button>
                </div>

                {isModalOpen ? (
                    <div className="um-modal-overlay">
                        <section className="um-form-card um-modal-card">
                            <div className="um-modal-header">
                                <h3 className="um-form-title">{isCreateMode ? "Create User" : "Edit User"}</h3>
                                <button className="um-modal-close" type="button" aria-label="Close form" onClick={closeModal}>
                                    <span className="material-symbols-outlined"><Close /></span>
                                </button>
                            </div>

                            <form className="um-form" onSubmit={handleSubmit}>
                                <div className="um-form-grid">
                                    <div className="um-form-group">
                                        <label className="um-form-label" htmlFor="fullName">Full Name</label>
                                        <input
                                            id="fullName"
                                            className="um-form-input"
                                            type="text"
                                            maxLength="50"
                                            required
                                            value={formData.fullName}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                                        />
                                    </div>

                                    <div className="um-form-group">
                                        <label className="um-form-label" htmlFor="email">Email</label>
                                        <input
                                            id="email"
                                            className="um-form-input"
                                            type="email"
                                            maxLength="255"
                                            required={isCreateMode}
                                            disabled={!isCreateMode}
                                            value={formData.email}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                                        />
                                        {!isCreateMode ? (
                                            <span className="um-help-text">Email cannot be edited.</span>
                                        ) : null}
                                    </div>

                                    <div className="um-form-group">
                                        <label className="um-form-label" htmlFor="phone">Phone</label>
                                        <input
                                            id="phone"
                                            className="um-form-input"
                                            type="text"
                                            maxLength="20"
                                            value={formData.phone}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                                        />
                                    </div>

                                    {isCreateMode ? (
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="password">Password</label>
                                            <input
                                                id="password"
                                                className="um-form-input"
                                                type="password"
                                                minLength="6"
                                                required
                                                value={formData.password}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                                            />
                                        </div>
                                    ) : (
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="gender">Gender</label>
                                            <input
                                                id="gender"
                                                className="um-form-input"
                                                type="text"
                                                maxLength="20"
                                                value={formData.gender}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, gender: event.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {!isCreateMode ? (
                                        <div className="um-form-group">
                                            <label className="um-form-label" htmlFor="dateOfBirth">Date of Birth</label>
                                            <input
                                                id="dateOfBirth"
                                                className="um-form-input"
                                                type="date"
                                                value={formData.dateOfBirth || ""}
                                                onChange={(event) => setFormData((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                                            />
                                        </div>
                                    ) : null}

                                    <div className="um-form-group">
                                        <label className="um-form-label" htmlFor="roleName">Role</label>
                                        <select
                                            id="roleName"
                                            className="um-form-input"
                                            required
                                            value={formData.roleName}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, roleName: event.target.value }))}
                                        >
                                            <option value="">Select role</option>
                                            {roles.map((role) => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="um-form-group">
                                        <label className="um-form-label" htmlFor="active">Status</label>
                                        <select
                                            id="active"
                                            className="um-form-input"
                                            value={String(formData.isActive)}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="um-form-actions">
                                    <button className="um-btn um-btn-primary" type="submit" disabled={isSubmitting}>
                                        <span className="material-symbols-outlined um-btn-icon"><Add /></span>
                                        <span>{isSubmitting ? "Saving..." : (isCreateMode ? "Create User" : "Update User")}</span>
                                    </button>
                                    <button className="um-cancel-btn" type="button" onClick={closeModal}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                ) : null}

                {errorMessage ? <div className="um-alert" style={{ color: "#dc2626" }}>{errorMessage}</div> : null}

                <form className="um-filters" onSubmit={handleFilterSubmit}>
                    <div className="um-search-wrapper">
                        <div className="um-search-icon">
                            <span className="material-symbols-outlined"><Search /></span>
                        </div>
                        <input
                            className="um-search-input"
                            type="text"
                            name="keyword"
                            placeholder="Search by full name or email"
                            value={keywordInput}
                            onChange={(event) => setKeywordInput(event.target.value)}
                        />
                    </div>

                    <div className="um-select-wrapper">
                        <select className="um-select" name="role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                            <option value="all">All Roles</option>
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                        <div className="um-select-icon">
                            <span className="material-symbols-outlined"><ExpandMore /></span>
                        </div>
                    </div>

                    <div className="um-select-wrapper">
                        <select className="um-select" name="accountStatus" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="deleted">Deleted</option>
                        </select>
                        <div className="um-select-icon">
                            <span className="material-symbols-outlined"><ExpandMore /></span>
                        </div>
                    </div>

                    <div className="um-filter-actions">
                        <button className="um-btn um-btn-secondary" type="submit">Apply</button>
                        <button className="um-btn um-btn-secondary" type="button" onClick={handleFilterReset}>Reset</button>
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
                                {isLoading ? (
                                    <tr className="um-table-row">
                                        <td className="um-td um-empty-cell" colSpan="5">Loading users...</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr className="um-table-row">
                                        <td className="um-td um-empty-cell" colSpan="5">No users found.</td>
                                    </tr>
                                ) : users.map((user) => {
                                    const meta = statusMeta(user);
                                    const rolesText = Array.isArray(user.roles) ? user.roles.join(", ") : "";

                                    return (
                                        <tr className="um-table-row" key={user.id}>
                                            <td className="um-td">
                                                <div className="um-user-cell">
                                                    <div className="um-avatar">
                                                        <img src={getUserImage(user.avatar)} alt={user.fullName || "Avatar"} className="um-avatar-img" />
                                                    </div>
                                                    <div className="um-user-info" style={{ textAlign: "start" }}>
                                                        <div className="um-user-name">{user.fullName}</div>
                                                        <div className="um-user-email">{user.email}</div>
                                                        <div className="um-user-phone">{user.phone || "No phone"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="um-td">
                                                <span className="um-role-badge">{rolesText || "N/A"}</span>
                                            </td>
                                            <td className="um-td">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                                            <td className="um-td">
                                                <span className={meta.className}>
                                                    <span className="um-status-dot"></span>
                                                    <span>{meta.text}</span>
                                                </span>
                                            </td>
                                            <td className="um-td um-actions-cell" style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    className="um-action-btn um-edit-btn"
                                                    title="Edit user"
                                                    onClick={() => openEditModal(user.id)}
                                                >
                                                    <span className="material-symbols-outlined um-action-icon"><Edit /></span>
                                                </button>

                                                {!user.deleted ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="um-action-btn um-edit-btn"
                                                            title={user.active ? "Set Inactive" : "Set Active"}
                                                            onClick={() => handleToggleStatus(user)}
                                                        >
                                                            <span className="material-symbols-outlined um-action-icon">
                                                                {user.active ? <ToggleOn/> : <ToggleOff/>}
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="um-action-btn um-delete-btn"
                                                            title="Delete user"
                                                            onClick={() => handleSoftDelete(user.id)}
                                                        >
                                                            <span className="material-symbols-outlined um-action-icon"><Delete /></span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="um-action-btn um-restore-btn"
                                                        title="Restore user"
                                                        onClick={() => handleRestore(user.id)}
                                                    >
                                                        <span className="material-symbols-outlined um-action-icon"><Restore /></span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="um-pagination">
                        <div className="um-pagination-info">
                            Showing
                            <span className="um-pagination-bold">{paginationLabel.from}</span>
                            -
                            <span className="um-pagination-bold">{paginationLabel.to}</span>
                            of
                            <span className="um-pagination-bold">{totalElements}</span>
                            (Page
                            <span className="um-pagination-bold">{pageIndex + 1}</span>/
                            <span className="um-pagination-bold">{totalPages}</span>)
                        </div>
                        <div className="um-pagination-buttons">
                            <button
                                className="um-pagination-btn"
                                type="button"
                                disabled={pageIndex <= 0}
                                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                            >
                                Previous
                            </button>
                            <button
                                className="um-pagination-btn"
                                type="button"
                                disabled={pageIndex >= totalPages - 1}
                                onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default UserManagementPage;
