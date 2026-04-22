import {
    ExpandMore,
    Payments,
    PendingActions,
    ReceiptLong,
    Visibility
} from "@mui/icons-material";
import {useEffect, useMemo, useState} from "react";
import toast from "react-hot-toast";
import {
    confirmAdminCancelRequest,
    confirmAdminReturnRequest,
    getAdminOrderDetail,
    getAdminOrders,
    refuseAdminCancelRequest,
    refuseAdminReturnRequest,
    updateAdminOrderStatus
} from "../../api/bookApi.js";
import {formatPrice} from "../../utils/FormatPrice.jsx";
import "../../styles/admin/OrderManagementPage.css";

const PAGE_SIZE = 5;
const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Canceled", "Returned"];

const toApiStatus = (value) => (value || "").trim().toUpperCase();
const toDisplayStatus = (value) => {
    const normalized = (value || "PENDING").toUpperCase();
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
};

const OrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, revenueToday: 0 });
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailErrorMessage, setDetailErrorMessage] = useState("");

    const [statusToUpdate, setStatusToUpdate] = useState("Processing");
    const [statusNote, setStatusNote] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        document.title = "BookStore-AdminOrders";
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            setIsLoading(true);
            setErrorMessage("");
            try {
                const data = await getAdminOrders({
                    page: pageIndex,
                    size: PAGE_SIZE,
                    keyword,
                    status: statusFilter,
                });

                if (!isMounted) return;

                const nextOrders = Array.isArray(data?.content) ? data.content : [];
                setOrders(nextOrders);
                setStats(data?.stats || { totalOrders: 0, pendingOrders: 0, revenueToday: 0 });
                setTotalPages(Math.max(1, Number.isFinite(data?.totalPages) ? data.totalPages : 1));
                setTotalElements(Number.isFinite(data?.totalElements) ? data.totalElements : 0);

                if (nextOrders.length === 0) {
                    setSelectedOrderId(null);
                    setSelectedDetail(null);
                    return;
                }

                setSelectedOrderId((prev) => {
                    const hasCurrent = nextOrders.some((item) => item.orderId === prev);
                    return hasCurrent ? prev : nextOrders[0].orderId;
                });
            } catch (error) {
                if (!isMounted) return;
                const message = error?.response?.data?.message || "Không tải được danh sách đơn hàng.";
                setErrorMessage(message);
                setOrders([]);
                setSelectedOrderId(null);
                setSelectedDetail(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchOrders();

        return () => {
            isMounted = false;
        };
    }, [pageIndex, keyword, statusFilter]);

    useEffect(() => {
        if (!selectedOrderId) {
            setSelectedDetail(null);
            return;
        }

        let isMounted = true;
        const fetchDetail = async () => {
            setIsDetailLoading(true);
            setDetailErrorMessage("");

            try {
                const detail = await getAdminOrderDetail(selectedOrderId);
                if (!isMounted) return;
                setSelectedDetail(detail);
                setStatusToUpdate(toDisplayStatus(detail?.status));
                setStatusNote("");
            } catch (error) {
                if (!isMounted) return;
                setDetailErrorMessage(error?.response?.data?.message || "Không tải được chi tiết đơn hàng.");
                setSelectedDetail(null);
            } finally {
                if (isMounted) setIsDetailLoading(false);
            }
        };

        void fetchDetail();

        return () => {
            isMounted = false;
        };
    }, [selectedOrderId]);

    const refreshListAndDetail = async (orderId = selectedOrderId) => {
        const listData = await getAdminOrders({
            page: pageIndex,
            size: PAGE_SIZE,
            keyword,
            status: statusFilter,
        });

        const nextOrders = Array.isArray(listData?.content) ? listData.content : [];
        setOrders(nextOrders);
        setStats(listData?.stats || { totalOrders: 0, pendingOrders: 0, revenueToday: 0 });
        setTotalPages(Math.max(1, Number.isFinite(listData?.totalPages) ? listData.totalPages : 1));
        setTotalElements(Number.isFinite(listData?.totalElements) ? listData.totalElements : 0);

        const stillExists = nextOrders.some((item) => item.orderId === orderId);
        const nextSelected = stillExists ? orderId : (nextOrders[0]?.orderId ?? null);
        setSelectedOrderId(nextSelected);

        if (nextSelected) {
            const detail = await getAdminOrderDetail(nextSelected);
            setSelectedDetail(detail);
            setStatusToUpdate(toDisplayStatus(detail?.status));
        } else {
            setSelectedDetail(null);
        }
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        setPageIndex(0);
        setKeyword(keywordInput.trim());
    };

    const handleResetFilters = () => {
        setKeywordInput("");
        setKeyword("");
        setStatusFilter("All");
        setPageIndex(0);
    };

    const handleUpdateStatus = async (event) => {
        event.preventDefault();
        if (!selectedOrderId || isActionLoading) return;

        setIsActionLoading(true);
        try {
            await updateAdminOrderStatus(selectedOrderId, {
                status: toApiStatus(statusToUpdate),
                note: statusNote,
            });
            toast.success("Cập nhật trạng thái đơn hàng thành công.");
            setStatusNote("");
            await refreshListAndDetail(selectedOrderId);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const runDecisionAction = async (type) => {
        if (!selectedOrderId || isActionLoading) return;

        const reason = window.prompt("Nhập ghi chú (có thể bỏ trống):", "") ?? "";
        setIsActionLoading(true);
        try {
            if (type === "confirm-cancel") {
                await confirmAdminCancelRequest(selectedOrderId, { reason });
                toast.success("Đã xác nhận yêu cầu hủy đơn.");
            } else if (type === "refuse-cancel") {
                await refuseAdminCancelRequest(selectedOrderId, { reason });
                toast.success("Đã từ chối yêu cầu hủy đơn.");
            } else if (type === "confirm-return") {
                await confirmAdminReturnRequest(selectedOrderId, { reason });
                toast.success("Đã xác nhận yêu cầu hoàn hàng.");
            } else if (type === "refuse-return") {
                await refuseAdminReturnRequest(selectedOrderId, { reason });
                toast.success("Đã từ chối yêu cầu hoàn hàng.");
            }
            await refreshListAndDetail(selectedOrderId);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Không thể xử lý yêu cầu.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const paginationInfo = useMemo(() => {
        if (totalElements <= 0) {
            return { from: 0, to: 0 };
        }
        const from = pageIndex * PAGE_SIZE + 1;
        const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalElements);
        return { from, to };
    }, [pageIndex, totalElements]);

    return (
        <main className="order-management-page">
            <div className="container">
                <div className="content-area">
                    <div className="content-wrapper">
                        <div className="om-alert">{errorMessage || ""}</div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-header">
                                    <p className="stat-title">Total Orders</p>
                                    <span className="material-symbols-outlined stat-icon icon-primary"><ReceiptLong/></span>
                                </div>
                                <div className="stat-value-row">
                                    <p className="stat-value">{stats.totalOrders || 0}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <p className="stat-title">Pending Orders</p>
                                    <span className="material-symbols-outlined stat-icon icon-orange"><PendingActions/></span>
                                </div>
                                <div className="stat-value-row">
                                    <p className="stat-value">{stats.pendingOrders || 0}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-header">
                                    <p className="stat-title">Revenue Today</p>
                                    <span className="material-symbols-outlined stat-icon icon-green"><Payments/></span>
                                </div>
                                <div className="stat-value-row">
                                    <p className="stat-value">{formatPrice(stats.revenueToday || 0)} ₫</p>
                                </div>
                            </div>
                        </div>

                        <form className="controls-card" onSubmit={handleApplyFilters}>
                            <div className="search-box">
                                <span className="material-symbols-outlined search-icon">search</span>
                                <input
                                    type="text"
                                    className="search-input"
                                    name="keyword"
                                    placeholder="Search by Order ID, Customer Name..."
                                    value={keywordInput}
                                    onChange={(event) => setKeywordInput(event.target.value)}
                                />
                            </div>
                            <div className="filters-group">
                                <div className="select-wrapper">
                                    <select
                                        className="select-input"
                                        name="status"
                                        value={statusFilter}
                                        onChange={(event) => {
                                            setStatusFilter(event.target.value);
                                            setPageIndex(0);
                                        }}
                                    >
                                        <option value="All">All Statuses</option>
                                        {STATUS_OPTIONS.map((statusItem) => (
                                            <option key={statusItem} value={statusItem}>{statusItem}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined select-icon"><ExpandMore/></span>
                                </div>
                                <div className="om-filter-actions">
                                    <button className="btn-secondary" type="submit">Apply</button>
                                    <button className="btn-secondary" type="button" onClick={handleResetFilters}>Reset</button>
                                </div>
                            </div>
                        </form>

                        <div className="table-card">
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="om-empty">Loading orders...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr><td colSpan="6" className="om-empty">No orders found.</td></tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.orderId}>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="order-link"
                                                        onClick={() => setSelectedOrderId(order.orderId)}
                                                    >
                                                        #OD-{order.orderId}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="customer-cell">
                                                        <div className="customer-avatar">{(order.customerName || "NA").slice(0, 2).toUpperCase()}</div>
                                                        <div style={{textAlign: "start"}}>
                                                            <div className="customer-name">{order.customerName}</div>
                                                            <div className="om-customer-email">{order.customerEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="date-text">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</span>
                                                </td>
                                                <td>
                                                    <span className="amount-text">{formatPrice(order.totalAmount || 0)} ₫</span>
                                                </td>
                                                <td>
                                                    <span className="status-badge">
                                                        <span className="status-dot"></span>
                                                        <span>{toDisplayStatus(order.status)}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <button
                                                            type="button"
                                                            className="action-btn"
                                                            onClick={() => setSelectedOrderId(order.orderId)}
                                                            title="View Details"
                                                        >
                                                            <span className="material-symbols-outlined" style={{fontSize: 20}}><Visibility/></span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <div className="pagination-info">
                                    Showing <strong>{paginationInfo.from}</strong> to <strong>{paginationInfo.to}</strong> of <strong>{totalElements}</strong> results
                                </div>
                                <nav className="pagination-nav" aria-label="Pagination">
                                    <button
                                        type="button"
                                        className="page-link"
                                        disabled={pageIndex <= 0}
                                        onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                                    >
                                        Prev
                                    </button>
                                    <span className="page-link active">{pageIndex + 1}</span>
                                    <span className="page-link">/{totalPages}</span>
                                    <button
                                        type="button"
                                        className="page-link"
                                        disabled={pageIndex >= totalPages - 1}
                                        onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <section className="om-detail-card">
                            <div className="om-detail-header">
                                <div>
                                    <h3 className="om-detail-title">Order Detail</h3>
                                    <p className="om-detail-subtitle">{selectedDetail?.createdAt ? new Date(selectedDetail.createdAt).toLocaleString() : "Select an order"}</p>
                                </div>
                                <span className="status-badge">
                                    <span className="status-dot"></span>
                                    <span>{selectedDetail ? toDisplayStatus(selectedDetail.status) : "Pending"}</span>
                                </span>
                            </div>

                            {isDetailLoading ? (
                                <div className="om-empty">Loading order detail...</div>
                            ) : detailErrorMessage ? (
                                <div className="om-empty">{detailErrorMessage}</div>
                            ) : !selectedDetail ? (
                                <div className="om-empty">No order selected.</div>
                            ) : (
                                <>
                                    <div className="om-detail-grid">
                                        <div className="detail-info">
                                            <p><strong>Customer:</strong> <span>{selectedDetail.customerName}</span></p>
                                            <p><strong>Email:</strong> <span>{selectedDetail.customerEmail}</span></p>
                                            <p><strong>Receiver:</strong> <span>{selectedDetail.address?.receiverName || ""}</span></p>
                                        </div>
                                        <div className="detail-info">
                                            <p><strong>Phone:</strong> <span>{selectedDetail.address?.phone || ""}</span></p>
                                            <p><strong>Address:</strong>
                                                <span>
                                                    {[selectedDetail.address?.addressLine, selectedDetail.address?.ward, selectedDetail.address?.district, selectedDetail.address?.province]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </span>
                                            </p>
                                            <p><strong>Payment:</strong> <span>{selectedDetail.paymentMethod || "N/A"}</span></p>
                                        </div>
                                        <div className="detail-info">
                                            <p><strong>Items:</strong><span>{selectedDetail.items?.length || 0}</span></p>
                                            <p><strong>Shipping Fee:</strong><span>{formatPrice(selectedDetail.shippingFee || 0)} ₫</span></p>
                                            <p><strong>Discount:</strong><span>{formatPrice(selectedDetail.discountAmount || 0)} ₫</span></p>
                                        </div>
                                        <div className="detail-info">
                                            <p><strong>Total:</strong><span>{formatPrice(selectedDetail.totalAmount || 0)} ₫</span></p>
                                            <p><strong>Status:</strong><span>{toDisplayStatus(selectedDetail.status)}</span></p>
                                        </div>
                                    </div>

                                    {selectedDetail.note ? (
                                        <div className="om-note">
                                            <strong>Note:</strong> <span>{selectedDetail.note}</span>
                                        </div>
                                    ) : null}

                                    <div className="om-items-table-wrapper">
                                        <table className="om-items-table">
                                            <thead>
                                            <tr>
                                                <th>Book</th>
                                                <th>Author</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Line Total</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedDetail.items?.map((item) => (
                                                <tr key={`${selectedDetail.orderId}-${item.bookId}`}>
                                                    <td>{item.title}</td>
                                                    <td>{item.authorName}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatPrice(item.price || 0)} ₫</td>
                                                    <td>{formatPrice(item.lineTotal || 0)} ₫</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="om-actions-panel">
                                        <h4>Update Status</h4>

                                        {selectedDetail.cancelRequested ? (
                                            <div className="status-alert status-alert-warning">
                                                Customer requested cancellation: {selectedDetail.cancelRequestReason || "(No reason)"}
                                            </div>
                                        ) : null}

                                        {selectedDetail.returnRequested ? (
                                            <div className="status-alert status-alert-warning">
                                                Customer requested return: {selectedDetail.returnRequestReason || "(No reason)"}
                                            </div>
                                        ) : null}

                                        <form className="om-status-form" onSubmit={handleUpdateStatus}>
                                            <div className="select-wrapper">
                                                <select
                                                    className="select-input"
                                                    value={statusToUpdate}
                                                    onChange={(event) => setStatusToUpdate(event.target.value)}
                                                >
                                                    {STATUS_OPTIONS.map((statusItem) => (
                                                        <option key={statusItem} value={statusItem}>{statusItem}</option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined select-icon"><ExpandMore/></span>
                                            </div>

                                            <input
                                                className="search-input om-note-input"
                                                type="text"
                                                maxLength="255"
                                                placeholder="Optional note for status history"
                                                value={statusNote}
                                                onChange={(event) => setStatusNote(event.target.value)}
                                            />

                                            <button type="submit" className="btn-primary" disabled={isActionLoading}>Update</button>
                                        </form>

                                        {selectedDetail.cancelRequested ? (
                                            <div className="om-status-form">
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    disabled={isActionLoading}
                                                    onClick={() => runDecisionAction("confirm-cancel")}
                                                >
                                                    Confirm Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    disabled={isActionLoading}
                                                    onClick={() => runDecisionAction("refuse-cancel")}
                                                >
                                                    Refuse Cancel
                                                </button>
                                            </div>
                                        ) : null}

                                        {selectedDetail.returnRequested ? (
                                            <div className="om-status-form">
                                                <button
                                                    type="button"
                                                    className="btn-primary"
                                                    disabled={isActionLoading}
                                                    onClick={() => runDecisionAction("confirm-return")}
                                                >
                                                    Confirm Return
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    disabled={isActionLoading}
                                                    onClick={() => runDecisionAction("refuse-return")}
                                                >
                                                    Refuse Return
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default OrderManagementPage;
