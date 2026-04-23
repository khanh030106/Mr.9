import { useEffect, useMemo, useState } from "react";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
import toast from "react-hot-toast";
import {
    createAdminCategory,
    deleteAdminCategory,
    getAdminCategories,
    getAdminCategoryDetail,
    getAdminCategoryOptions,
    updateAdminCategory,
} from "../../api/bookApi.js";
import "../../styles/admin/CategoryManagementPage.css";

const PAGE_SIZE = 8;

const INITIAL_FORM = {
    categoryName: "",
    parentId: "",
};

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [parentOptions, setParentOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);

    useEffect(() => {
        document.title = "BookStore-AdminCategoryManagement";
    }, []);

    const loadCategories = async ({
        page = pageIndex,
        keywordValue = keyword,
    } = {}) => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const data = await getAdminCategories({
                page,
                size: PAGE_SIZE,
                keyword: keywordValue,
                includeDeleted: false,
            });

            setCategories(Array.isArray(data?.content) ? data.content : []);
            setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1));
            setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
        } catch (error) {
            setCategories([]);
            setErrorMessage(error?.response?.data?.message || "Khong tai duoc danh sach loai sach.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadParentOptions = async () => {
        try {
            const data = await getAdminCategoryOptions();
            setParentOptions(Array.isArray(data?.categories) ? data.categories : []);
        } catch {
            setParentOptions([]);
        }
    };

    useEffect(() => {
        void loadParentOptions();
    }, []);

    useEffect(() => {
        void loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageIndex, keyword]);

    const resetForm = () => {
        setEditingCategoryId(null);
        setFormData(INITIAL_FORM);
    };

    const openEdit = async (categoryId) => {
        try {
            const detail = await getAdminCategoryDetail(categoryId);
            setEditingCategoryId(categoryId);
            setFormData({
                categoryName: detail?.categoryName || "",
                parentId: detail?.parentId != null ? String(detail.parentId) : "",
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong tai duoc chi tiet loai sach.");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        const categoryName = formData.categoryName.trim();
        if (!categoryName) {
            toast.error("Vui long nhap ten loai sach.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                categoryName,
                parentId: formData.parentId ? Number(formData.parentId) : null,
            };

            if (editingCategoryId) {
                await updateAdminCategory(editingCategoryId, payload);
                toast.success("Cap nhat loai sach thanh cong.");
            } else {
                await createAdminCategory(payload);
                toast.success("Them loai sach thanh cong.");
            }

            await Promise.all([
                loadCategories({ page: 0 }),
                loadParentOptions(),
            ]);
            setPageIndex(0);
            resetForm();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the luu loai sach.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category) => {
        if ((category?.totalBooks ?? 0) > 0) {
            toast.error("Chi co the xoa loai sach khi da het sach.");
            return;
        }

        const ok = window.confirm("Ban co chac muon xoa loai sach nay?");
        if (!ok) return;

        try {
            await deleteAdminCategory(category.id);
            toast.success("Xoa loai sach thanh cong.");

            const nextPage = categories.length <= 1 && pageIndex > 0 ? pageIndex - 1 : pageIndex;
            setPageIndex(nextPage);
            await Promise.all([
                loadCategories({ page: nextPage }),
                loadParentOptions(),
            ]);

            if (editingCategoryId === category.id) {
                resetForm();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Khong the xoa loai sach.");
        }
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setPageIndex(0);
        setKeyword(keywordInput.trim());
    };

    const handleSearchReset = () => {
        setKeywordInput("");
        setKeyword("");
        setPageIndex(0);
    };

    const parentSelectOptions = useMemo(() => {
        return parentOptions.filter((option) => option.id !== editingCategoryId);
    }, [editingCategoryId, parentOptions]);

    const paginationLabel = useMemo(() => {
        if (totalElements === 0) {
            return { from: 0, to: 0 };
        }
        const from = pageIndex * PAGE_SIZE + 1;
        const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalElements);
        return { from, to };
    }, [pageIndex, totalElements]);

    const isCreateMode = !editingCategoryId;

    return (
        <main className="kb-cm-main">
            <div className="kb-cm-content">
                <div className="kb-cm-alert">
                    {errorMessage ? <span style={{ color: "#dc2626" }}>{errorMessage}</span> : null}
                </div>

                <div className="kb-cm-form-card" id="categoryForm">
                    <h3 className="kb-cm-form-title">{isCreateMode ? "Create Category" : "Edit Category"}</h3>
                    <form className="kb-cm-form" onSubmit={handleSubmit}>
                        <div className="kb-cm-form-grid">
                            <div className="kb-cm-form-group">
                                <label className="kb-cm-form-label" htmlFor="categoryName">Category Name</label>
                                <input
                                    id="categoryName"
                                    className="kb-cm-form-input"
                                    type="text"
                                    maxLength="100"
                                    required
                                    placeholder="e.g. Self-Help"
                                    value={formData.categoryName}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, categoryName: event.target.value }))}
                                />
                            </div>
                            <div className="kb-cm-form-group">
                                <label className="kb-cm-form-label" htmlFor="parentId">Parent Category</label>
                                <select
                                    id="parentId"
                                    className="kb-cm-form-input"
                                    value={formData.parentId}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, parentId: event.target.value }))}
                                >
                                    <option value="">No parent</option>
                                    {parentSelectOptions.map((category) => (
                                        <option key={category.id} value={String(category.id)}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="kb-cm-form-actions">
                            <button type="submit" className="kb-cm-add-button" disabled={isSubmitting}>
                                <span className="material-symbols-outlined kb-cm-add-icon"><Add /></span>
                                <span className="kb-cm-add-text">
                                    {isSubmitting ? "Saving..." : (isCreateMode ? "Create Category" : "Update Category")}
                                </span>
                            </button>
                            <button type="button" className="kb-cm-cancel-btn" onClick={resetForm}>
                                {isCreateMode ? "Reset" : "Cancel Edit"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="kb-cm-form-card">
                    <form className="kb-cm-form" onSubmit={handleSearchSubmit}>
                        <div className="kb-cm-form-grid">
                            <div className="kb-cm-form-group">
                                <label className="kb-cm-form-label" htmlFor="keyword">Search</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                                        <Search fontSize="small" />
                                    </span>
                                    <input
                                        id="keyword"
                                        className="kb-cm-form-input"
                                        type="text"
                                        placeholder="Search by category name"
                                        style={{ paddingLeft: 40 }}
                                        value={keywordInput}
                                        onChange={(event) => setKeywordInput(event.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="kb-cm-form-actions">
                            <button type="submit" className="kb-cm-add-button">Apply</button>
                            <button type="button" className="kb-cm-cancel-btn" onClick={handleSearchReset}>Reset</button>
                        </div>
                    </form>
                </div>

                <div className="kb-cm-table-card">
                    <div className="kb-cm-table-wrapper">
                        <table className="kb-cm-table">
                            <thead className="kb-cm-table-head">
                                <tr>
                                    <th className="kb-cm-th">Category Name</th>
                                    <th className="kb-cm-th kb-cm-th-parent" style={{ textAlign: "center" }}>Parent</th>
                                    <th className="kb-cm-th kb-cm-th-total">Total Books</th>
                                    <th className="kb-cm-th kb-cm-th-status">Status</th>
                                    <th className="kb-cm-th kb-cm-th-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="kb-cm-table-body">
                                {isLoading ? (
                                    <tr className="kb-cm-table-row">
                                        <td className="kb-cm-td kb-cm-empty-cell" colSpan="5">Loading categories...</td>
                                    </tr>
                                ) : categories.length === 0 ? (
                                    <tr className="kb-cm-table-row">
                                        <td className="kb-cm-td kb-cm-empty-cell" colSpan="5">No category found.</td>
                                    </tr>
                                ) : categories.map((category) => {
                                    const canDelete = (category?.totalBooks ?? 0) === 0;
                                    return (
                                        <tr className="kb-cm-table-row" key={category.id}>
                                            <td className="kb-cm-td">
                                                <div className="kb-cm-category-cell">
                                                    <div>
                                                        <p className="kb-cm-category-name">{category.categoryName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="kb-cm-td kb-cm-parent-text">{category.parentName || "-"}</td>
                                            <td className="kb-cm-td kb-cm-total">{category.totalBooks ?? 0}</td>
                                            <td className="kb-cm-td" style={{ textAlign: "center" }}>
                                                <span className="kb-cm-badge kb-cm-badge-active">Active</span>
                                            </td>
                                            <td className="kb-cm-td kb-cm-actions-cell">
                                                <div className="kb-cm-actions">
                                                    <button
                                                        className="kb-cm-action-btn kb-cm-edit-btn"
                                                        title="Edit"
                                                        type="button"
                                                        onClick={() => openEdit(category.id)}
                                                    >
                                                        <span className="material-symbols-outlined kb-cm-action-icon"><Edit /></span>
                                                    </button>
                                                    <button
                                                        className="kb-cm-action-btn kb-cm-delete-btn"
                                                        type="button"
                                                        title={canDelete ? "Delete" : "Cannot delete category that still has books"}
                                                        disabled={!canDelete}
                                                        onClick={() => handleDelete(category)}
                                                    >
                                                        <span className="material-symbols-outlined kb-cm-action-icon"><Delete /></span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="kb-cm-pagination">
                        <p className="kb-cm-pagination-info">
                            Showing
                            <span className="kb-cm-pagination-bold">{paginationLabel.from}</span>
                            -
                            <span className="kb-cm-pagination-bold">{paginationLabel.to}</span>
                            of
                            <span className="kb-cm-pagination-bold">{totalElements}</span>
                            (Page
                            <span className="kb-cm-pagination-bold">{pageIndex + 1}</span>/
                            <span className="kb-cm-pagination-bold">{totalPages}</span>)
                        </p>
                        <div className="kb-cm-pagination-buttons">
                            <button
                                className="kb-cm-pagination-btn"
                                type="button"
                                disabled={pageIndex <= 0}
                                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                            >
                                Previous
                            </button>
                            <button
                                className="kb-cm-pagination-btn"
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

export default CategoryManagementPage;
