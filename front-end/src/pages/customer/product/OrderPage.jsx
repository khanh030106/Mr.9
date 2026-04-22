import {useEffect, useMemo, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {getMyOrderDetail, getMyOrders, requestCancelOrder, requestReturnOrder} from "../../../api/bookApi.js";
import {getBookImage} from "../../../utils/GetImageUrl.js";
import {formatPrice} from "../../../utils/FormatPrice.jsx";
import toast from "react-hot-toast";

const ORDER_TABS = [
    {key: "ALL", label: "All Orders"},
    {key: "PENDING", label: "Pending"},
    {key: "PROCESSING", label: "Processing"},
    {key: "SHIPPED", label: "Shipped"},
    {key: "DELIVERED", label: "Delivered"},
    {key: "CANCELED", label: "Canceled"},
    {key: "RETURNED", label: "Returned"}
];
const ORDERS_PER_PAGE = 5;

const OrderPage = () => {
    // === REFACTOR START: fetch current user orders and split UI by status tabs ===
    const [activeTab, setActiveTab] = useState("ALL");
    const [orders, setOrders] = useState([]);
    const [counts, setCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailErrorMessage, setDetailErrorMessage] = useState("");
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [allOrdersPage, setAllOrdersPage] = useState(0);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = "BookStore-OrderPage";
    }, []);

    useEffect(() => {
        const vnpayStatus = searchParams.get("vnpayStatus")
            || searchParams.get("payosStatus")
            || searchParams.get("stripeStatus");
        const checkoutStatus = searchParams.get("checkoutStatus");
        const orderId = searchParams.get("orderId");

        // --- VNPAY REFACTOR START: surface checkout/VNPay result after redirect ---
        if (checkoutStatus === "ORDER_CREATED") {
            toast.success(orderId ? `Order #${orderId} da duoc tao.` : "Order da duoc tao.");
        }

        if (vnpayStatus === "SUCCESS") {
            toast.success(orderId
                ? `Thanh toan VNPay thanh cong. Order #${orderId} da duoc cap nhat Processing.`
                : "Thanh toan VNPay thanh cong.");
        } else if (vnpayStatus === "CANCELED") {
            toast.error(orderId
                ? `Thanh toan VNPay khong thanh cong. Order #${orderId} van o trang thai Pending.`
                : "Thanh toan VNPay khong thanh cong.");
        }

        if (checkoutStatus || vnpayStatus) {
            navigate("/bookseller/order", { replace: true });
        }
        // --- VNPAY REFACTOR END: surface checkout/VNPay result after redirect ---
    }, [navigate, searchParams]);

    useEffect(() => {
        let isMounted = true;

        const fetchOrders = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const data = await getMyOrders();
                if (!isMounted) return;
                setOrders(Array.isArray(data?.orders) ? data.orders : []);
                setCounts(data?.counts || {});
            } catch (error) {
                if (!isMounted) return;
                if (error?.response?.status === 401) {
                    navigate("/bookseller/login");
                    return;
                }
                setErrorMessage("Failed to load your orders. Please try again.");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchOrders();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    // --- ORDER ACTION REFACTOR START: user order detail modal + cancel/return action handlers ---
    const refreshOrders = async () => {
        const data = await getMyOrders();
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setCounts(data?.counts || {});
    };

    const canRequestCancel = (status) => ["PENDING", "PROCESSING"].includes(status);
    const canRequestReturn = (status) => status === "DELIVERED";

    const openOrderDetail = async (orderId) => {
        setIsDetailLoading(true);
        setDetailErrorMessage("");
        setSelectedOrderDetail(null);

        try {
            const detail = await getMyOrderDetail(orderId);
            setSelectedOrderDetail(detail);
        } catch (error) {
            const backendMessage = error?.response?.data?.message || "Cannot load order detail.";
            setDetailErrorMessage(backendMessage);
            if (error?.response?.status === 401) {
                navigate("/bookseller/login");
            }
        } finally {
            setIsDetailLoading(false);
        }
    };

    const closeOrderDetail = () => {
        setSelectedOrderDetail(null);
        setDetailErrorMessage("");
    };

    const submitOrderAction = async (order, action) => {
        if (!order || isSubmittingAction) {
            return;
        }

        const status = order.status;
        if (action === "cancel" && !canRequestCancel(status)) {
            toast.error("Chỉ đơn Pending/Processing mới được yêu cầu hủy.");
            return;
        }

        if (action === "return" && !canRequestReturn(status)) {
            toast.error("Chỉ đơn Delivered mới được yêu cầu trả hàng.");
            return;
        }

        const promptMessage = action === "cancel"
            ? "Nhập lý do hủy đơn (có thể bỏ trống):"
            : "Nhập lý do trả hàng (có thể bỏ trống):";
        const reason = window.prompt(promptMessage, "") ?? "";

        setIsSubmittingAction(true);
        try {
            if (action === "cancel") {
                await requestCancelOrder(order.orderId, { reason });
                toast.success(`Đã gửi yêu cầu hủy đơn #${order.orderId}.`);
            } else {
                await requestReturnOrder(order.orderId, { reason });
                toast.success(`Đã gửi yêu cầu trả hàng cho đơn #${order.orderId}.`);
            }

            await refreshOrders();
            if (selectedOrderDetail?.orderId === order.orderId) {
                const detail = await getMyOrderDetail(order.orderId);
                setSelectedOrderDetail(detail);
            }
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data === "string" ? error.response.data : "");
            toast.error(backendMessage || "Không thể gửi yêu cầu cho đơn hàng.");
            if (error?.response?.status === 401) {
                navigate("/bookseller/login");
            }
        } finally {
            setIsSubmittingAction(false);
        }
    };
    // --- ORDER ACTION REFACTOR END: user order detail modal + cancel/return action handlers ---

    const filteredOrders = useMemo(() => {
        if (activeTab === "ALL") return orders;
        return orders.filter(order => order.status === activeTab);
    }, [activeTab, orders]);

    // === REFACTOR START: paginate All Orders tab (max 5 cards per page) ===
    const allOrdersPageCount = useMemo(() => {
        if (activeTab !== "ALL") return 1;
        return Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
    }, [activeTab, filteredOrders.length]);

    useEffect(() => {
        if (activeTab !== "ALL") {
            setAllOrdersPage(0);
            return;
        }
        setAllOrdersPage(prev => Math.min(prev, allOrdersPageCount - 1));
    }, [activeTab, allOrdersPageCount]);

    const ordersToRender = useMemo(() => {
        if (activeTab !== "ALL") return filteredOrders;
        const start = allOrdersPage * ORDERS_PER_PAGE;
        return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
    }, [activeTab, allOrdersPage, filteredOrders]);
    // === REFACTOR END: paginate All Orders tab (max 5 cards per page) ===

    const getStatusLabel = (statusKey) => {
        const tab = ORDER_TABS.find(item => item.key === statusKey);
        return tab?.label || "Pending";
    };

    return (
        <div className="kb-container">
            <main className="kb-main">
                <div className="kb-tabs">
                    <div className="kb-tabs-list" role="tablist" aria-label="Order status tabs">
                        {ORDER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`kb-tab ${activeTab === tab.key ? "kb-tab--active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <span className="kb-tab-label">{tab.label}</span>
                                <span className="kb-tab-badge">{counts?.[tab.key] ?? 0}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="kb-orders-empty">Loading your orders...</div>
                ) : errorMessage ? (
                    <div className="kb-orders-empty">{errorMessage}</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="kb-orders-empty">No orders found for this status.</div>
                ) : (
                    <>
                    <div className="kb-orders-list">
                        {ordersToRender.map(order => (
                            <div className="kb-order-card" key={order.orderId}>
                                <div className="kb-order-header">
                                    <div className="kb-order-info">
                                        <div className="kb-order-info-item">
                                            <p className="kb-order-info-label">Order Time</p>
                                            <p>{new Date(order.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="kb-order-info-item">
                                            <p className="kb-order-info-label">Order ID</p>
                                            <p>#{order.orderId}</p>
                                        </div>
                                        <div className="kb-order-info-item kb-order-total">
                                            <p className="kb-order-info-label">Total</p>
                                            <p>{formatPrice(order.totalAmount)} d</p>
                                        </div>
                                    </div>
                                    <div className="kb-order-status-actions">
                                        <span className="kb-status-badge">{getStatusLabel(order.status)}</span>
                                    </div>
                                </div>

                                <div className="kb-order-content">
                                    <div className="kb-order-body">
                                        <div className="kb-items-list">
                                            {order.items?.map(item => (
                                                <div className="kb-order-item" key={`${order.orderId}-${item.bookId}`}>
                                                    <div className="kb-item-image">
                                                        <img src={getBookImage(item.imageUrl)} alt={item.title}/>
                                                    </div>
                                                    <div className="kb-item-details">
                                                        <h3 className="kb-item-title">{item.title}</h3>
                                                        <p className="kb-item-author">{item.authorName}</p>
                                                        <div className="kb-item-price-quantity">
                                                            <span className="kb-item-price">
                                                                {formatPrice(item.price)} d x {item.quantity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="kb-order-actions">
                                            <button
                                                type="button"
                                                className="kb-btn-action kb-btn-secondary"
                                                onClick={() => openOrderDetail(order.orderId)}
                                            >
                                                View detail
                                            </button>

                                            {canRequestCancel(order.status) ? (
                                                <button
                                                    type="button"
                                                    className="kb-btn-action kb-btn-cancel-order"
                                                    onClick={() => submitOrderAction(order, "cancel")}
                                                    disabled={isSubmittingAction}
                                                >
                                                    Request cancel
                                                </button>
                                            ) : null}

                                            {canRequestReturn(order.status) ? (
                                                <button
                                                    type="button"
                                                    className="kb-btn-action kb-btn-return-order"
                                                    onClick={() => submitOrderAction(order, "return")}
                                                    disabled={isSubmittingAction}
                                                >
                                                    Request return
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* === REFACTOR START: pagination controls for All Orders tab only === */}
                    {activeTab === "ALL" && filteredOrders.length > ORDERS_PER_PAGE ? (
                        <nav className="kb-order-pagination" aria-label="All orders pagination">
                            <button
                                type="button"
                                className="kb-order-pagination__btn"
                                onClick={() => setAllOrdersPage(prev => Math.max(0, prev - 1))}
                                disabled={allOrdersPage <= 0}
                            >
                                Previous
                            </button>
                            <span className="kb-order-pagination__info">
                                Page {allOrdersPage + 1} / {allOrdersPageCount}
                            </span>
                            <button
                                type="button"
                                className="kb-order-pagination__btn"
                                onClick={() => setAllOrdersPage(prev => Math.min(allOrdersPageCount - 1, prev + 1))}
                                disabled={allOrdersPage >= allOrdersPageCount - 1}
                            >
                                Next
                            </button>
                        </nav>
                    ) : null}
                    {/* === REFACTOR END: pagination controls for All Orders tab only === */}
                    </>
                )}

                {(selectedOrderDetail || isDetailLoading || detailErrorMessage) ? (
                    <div className="kb-order-detail-overlay" onClick={closeOrderDetail}>
                        <div className="kb-order-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                            <div className="kb-order-detail-header">
                                <h3>Order Detail</h3>
                                <button type="button" className="kb-order-detail-close" onClick={closeOrderDetail}>x</button>
                            </div>

                            {isDetailLoading ? (
                                <div className="kb-order-detail-empty">Loading order detail...</div>
                            ) : detailErrorMessage ? (
                                <div className="kb-order-detail-empty">{detailErrorMessage}</div>
                            ) : selectedOrderDetail ? (
                                <div className="kb-order-detail-content">
                                    <div className="kb-order-detail-grid">
                                        <p><strong>Order ID:</strong> #{selectedOrderDetail.orderId}</p>
                                        <p><strong>Status:</strong> {getStatusLabel(selectedOrderDetail.status)}</p>
                                        <p><strong>Created at:</strong> {selectedOrderDetail.createdAt ? new Date(selectedOrderDetail.createdAt).toLocaleString() : ""}</p>
                                        <p><strong>Payment:</strong> {selectedOrderDetail.paymentMethod || "N/A"}</p>
                                        <p><strong>Shipping fee:</strong> {formatPrice(selectedOrderDetail.shippingFee || 0)} d</p>
                                        <p><strong>Discount:</strong> {formatPrice(selectedOrderDetail.discountAmount || 0)} d</p>
                                        <p><strong>Total:</strong> {formatPrice(selectedOrderDetail.totalAmount || 0)} d</p>
                                    </div>

                                    <div className="kb-order-detail-section">
                                        <h4>Shipping Address</h4>
                                        <p>{selectedOrderDetail.address?.receiverName || ""} - {selectedOrderDetail.address?.phone || ""}</p>
                                        <p>
                                            {selectedOrderDetail.address?.addressLine || ""}
                                            {selectedOrderDetail.address?.ward ? `, ${selectedOrderDetail.address.ward}` : ""}
                                            {selectedOrderDetail.address?.district ? `, ${selectedOrderDetail.address.district}` : ""}
                                            {selectedOrderDetail.address?.province ? `, ${selectedOrderDetail.address.province}` : ""}
                                        </p>
                                    </div>

                                    {selectedOrderDetail.note ? (
                                        <div className="kb-order-detail-section">
                                            <h4>Note</h4>
                                            <p>{selectedOrderDetail.note}</p>
                                        </div>
                                    ) : null}

                                    {selectedOrderDetail.canceledReason ? (
                                        <div className="kb-order-detail-section">
                                            <h4>Cancel Reason</h4>
                                            <p>{selectedOrderDetail.canceledReason}</p>
                                        </div>
                                    ) : null}

                                    <div className="kb-order-detail-section">
                                        <h4>Items</h4>
                                        <div className="kb-items-list">
                                            {selectedOrderDetail.items?.map(item => (
                                                <div className="kb-order-item" key={`detail-${selectedOrderDetail.orderId}-${item.bookId}`}>
                                                    <div className="kb-item-image">
                                                        <img src={getBookImage(item.imageUrl)} alt={item.title}/>
                                                    </div>
                                                    <div className="kb-item-details">
                                                        <h3 className="kb-item-title">{item.title}</h3>
                                                        <p className="kb-item-author">{item.authorName}</p>
                                                        <div className="kb-item-price-quantity">
                                                            <span className="kb-item-price">{formatPrice(item.price)} d x {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="kb-order-actions">
                                        {canRequestCancel(selectedOrderDetail.status) ? (
                                            <button
                                                type="button"
                                                className="kb-btn-action kb-btn-cancel-order"
                                                onClick={() => submitOrderAction(selectedOrderDetail, "cancel")}
                                                disabled={isSubmittingAction}
                                            >
                                                Request cancel
                                            </button>
                                        ) : null}

                                        {canRequestReturn(selectedOrderDetail.status) ? (
                                            <button
                                                type="button"
                                                className="kb-btn-action kb-btn-return-order"
                                                onClick={() => submitOrderAction(selectedOrderDetail, "return")}
                                                disabled={isSubmittingAction}
                                            >
                                                Request return
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
    // === REFACTOR END: fetch current user orders and split UI by status tabs ===
}

export default OrderPage;
