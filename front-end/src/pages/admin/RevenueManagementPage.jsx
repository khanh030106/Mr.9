import {AutoStories, ChevronLeft, ChevronRight} from "@mui/icons-material";
import {useEffect, useMemo, useState} from "react";
import {getAdminRevenueOverview} from "../../api/bookApi.js";
import {formatPrice} from "../../utils/FormatPrice.jsx";
import "../../styles/admin/RevenueManagementPage.css";

const CATEGORY_PAGE_SIZE = 5;

const emptyRevenueData = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    categoryPage: 0,
    categorySize: CATEGORY_PAGE_SIZE,
    categoryTotalPages: 1,
    categoryTotalElements: 0,
    summary: {
        totalRevenue: 0,
        totalQuantitySold: 0,
        averageOrderValue: 0,
        newCustomers: 0,
        revenueGrowthPercent: 0,
        quantityGrowthPercent: 0,
        averageOrderValueGrowthPercent: 0,
        newCustomersGrowthPercent: 0,
    },
    categoryRows: [],
    trendByDay: [],
    contributions: [],
};

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) => `${formatPrice(toNumber(value))}đ`;

const formatPercent = (value) => {
    const n = toNumber(value);
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(1)}%`;
};

const getProgressWidth = (value) => {
    const n = Math.abs(toNumber(value));
    return Math.max(4, Math.min(100, n));
};

const getMonthLabel = (year, month) => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
    });
};

const RevenueManagementPage = () => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [categoryPage, setCategoryPage] = useState(0);

    const [data, setData] = useState(emptyRevenueData);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setCategoryPage(0);
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        let isMounted = true;

        const fetchRevenue = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const response = await getAdminRevenueOverview({
                    year: selectedYear,
                    month: selectedMonth,
                    page: categoryPage,
                    size: CATEGORY_PAGE_SIZE,
                });

                if (!isMounted) return;
                setData({
                    ...emptyRevenueData,
                    ...response,
                    summary: {
                        ...emptyRevenueData.summary,
                        ...(response?.summary || {}),
                    },
                    categoryRows: Array.isArray(response?.categoryRows) ? response.categoryRows : [],
                    trendByDay: Array.isArray(response?.trendByDay) ? response.trendByDay : [],
                    contributions: Array.isArray(response?.contributions) ? response.contributions : [],
                });
            } catch (error) {
                if (!isMounted) return;
                setErrorMessage(error?.response?.data?.message || "Khong tai duoc thong ke doanh thu.");
                setData(emptyRevenueData);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchRevenue();
        // --- ADMIN REVENUE END: fetch real dashboard data from backend API ---

        return () => {
            isMounted = false;
        };
    }, [selectedYear, selectedMonth, categoryPage]);

    const summary = data.summary || emptyRevenueData.summary;

    const monthLabel = useMemo(() => getMonthLabel(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

    const trend = Array.isArray(data.trendByDay) ? data.trendByDay : [];
    const maxTrendRevenue = useMemo(() => {
        const max = trend.reduce((acc, item) => Math.max(acc, toNumber(item?.revenue)), 0);
        return max > 0 ? max : 1;
    }, [trend]);

    const categoryFrom = data.categoryTotalElements <= 0 ? 0 : categoryPage * CATEGORY_PAGE_SIZE + 1;
    const categoryTo = Math.min((categoryPage + 1) * CATEGORY_PAGE_SIZE, data.categoryTotalElements || 0);

    const goToPreviousMonth = () => {
        const current = new Date(selectedYear, selectedMonth - 1, 1);
        current.setMonth(current.getMonth() - 1);
        setSelectedYear(current.getFullYear());
        setSelectedMonth(current.getMonth() + 1);
    };

    const goToNextMonth = () => {
        const current = new Date(selectedYear, selectedMonth - 1, 1);
        current.setMonth(current.getMonth() + 1);
        setSelectedYear(current.getFullYear());
        setSelectedMonth(current.getMonth() + 1);
    };

    return (
        <>
            <main className="revenue-management-page">
                <div className="admin-content">
                    <section className="admin-title-section">
                        <h2 className="admin-page-title">Thong ke doanh thu</h2>
                        <p className="admin-page-subtitle">
                            Du lieu doanh thu cho {monthLabel}.
                        </p>
                        <div className="admin-month-switcher" role="group" aria-label="Chuyen thang thong ke">
                            <button className="admin-pagination-btn" type="button" onClick={goToPreviousMonth}>
                                <span className="material-symbols-outlined"><ChevronLeft/></span>
                            </button>
                            <span className="admin-month-label">{monthLabel}</span>
                            <button className="admin-pagination-btn" type="button" onClick={goToNextMonth}>
                                <span className="material-symbols-outlined"><ChevronRight/></span>
                            </button>
                        </div>
                        <p className="admin-error-text">{errorMessage}</p>
                    </section>

                    <div className="admin-stats-grid">
                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Tổng doanh thu</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">{formatCurrency(summary.totalRevenue)}</p>
                                <span className="admin-stat-change">{formatPercent(summary.revenueGrowthPercent)}</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar" style={{width: `${getProgressWidth(summary.revenueGrowthPercent)}%`}}></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Tổng số lượng bán</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">{toNumber(summary.totalQuantitySold)}</p>
                                <span className="admin-stat-change">{formatPercent(summary.quantityGrowthPercent)}</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar" style={{width: `${getProgressWidth(summary.quantityGrowthPercent)}%`}}></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Giá trung bình</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">{formatCurrency(summary.averageOrderValue)}</p>
                                <span className="admin-stat-change">{formatPercent(summary.averageOrderValueGrowthPercent)}</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar" style={{width: `${getProgressWidth(summary.averageOrderValueGrowthPercent)}%`}}></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Khách hàng mới</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">{toNumber(summary.newCustomers)}</p>
                                <span className="admin-stat-change">{formatPercent(summary.newCustomersGrowthPercent)}</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar" style={{width: `${getProgressWidth(summary.newCustomersGrowthPercent)}%`}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-table-card">
                        <div className="admin-table-header">
                            <h3 className="admin-table-title">Chi tiết theo Danh mục</h3>
                            <a href="#" className="admin-view-all">Xem tất cả</a>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>Loại sách</th>
                                    <th>Tổng doanh thu</th>
                                    <th>Tổng số lượng</th>
                                    <th>Giá cao nhất</th>
                                    <th>Giá thấp nhất</th>
                                    <th>Giá trung bình</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6">Dang tai du lieu doanh thu...</td>
                                    </tr>
                                ) : data.categoryRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">Chua co du lieu doanh thu trong thang nay.</td>
                                    </tr>
                                ) : (
                                    data.categoryRows.map((row) => (
                                        <tr key={`${row.categoryId}-${row.categoryName}`}>
                                            <td>
                                                <div className="admin-category-cell">
                                                    <div className="admin-category-icon">
                                                        <span className="material-symbols-outlined"><AutoStories/></span>
                                                    </div>
                                                    <span className="admin-category-name">{row.categoryName}</span>
                                                </div>
                                            </td>
                                            <td className="admin-revenue-cell">{formatCurrency(row.totalRevenue)}</td>
                                            <td>{toNumber(row.totalQuantity)}</td>
                                            <td>{formatCurrency(row.highestPrice)}</td>
                                            <td>{formatCurrency(row.lowestPrice)}</td>
                                            <td>
                                                <span className="admin-price-badge">{formatCurrency(row.averagePrice)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-table-footer">
                            <p className="admin-table-info">
                                Hien thi {categoryFrom}-{categoryTo} tren {data.categoryTotalElements || 0} danh muc
                            </p>
                            <div className="admin-pagination">
                                <button
                                    className="admin-pagination-btn"
                                    disabled={categoryPage <= 0 || isLoading}
                                    onClick={() => setCategoryPage((prev) => Math.max(0, prev - 1))}
                                >
                                    <span className="material-symbols-outlined"><ChevronLeft/></span>
                                </button>
                                <button
                                    className="admin-pagination-btn"
                                    disabled={isLoading || categoryPage >= Math.max((data.categoryTotalPages || 1) - 1, 0)}
                                    onClick={() => setCategoryPage((prev) => prev + 1)}
                                >
                                    <span className="material-symbols-outlined"><ChevronRight/></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="admin-secondary-grid">
                        <div className="admin-chart-card">
                            <div className="admin-chart-header">
                                <h3 className="admin-chart-title">Xu hướng doanh thu</h3>
                            </div>

                            <div className="admin-bar-chart">
                                {trend.map((point) => {
                                    const value = toNumber(point?.revenue);
                                    const barHeight = Math.max(3, (value / maxTrendRevenue) * 100);
                                    return (
                                        <div className="admin-bar" key={point.dayOfMonth}>
                                            <div className="admin-bar-fill" style={{height: `${barHeight}%`}}></div>
                                            <span className="admin-bar-day">{point.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="admin-progress-card">
                            <h3 className="admin-chart-title">Tỉ lệ đóng góp</h3>

                            <div className="admin-progress-content">
                                <div className="admin-progress-list">
                                    {isLoading ? (
                                        <div>
                                            <div className="admin-progress-item-header">
                                                <span className="admin-progress-label">Dang tai du lieu...</span>
                                                <span className="admin-progress-percentage">0%</span>
                                            </div>
                                            <div className="admin-progress-bar-container">
                                                <div className="admin-progress-bar-fill slate"></div>
                                            </div>
                                        </div>
                                    ) : data.contributions.length === 0 ? (
                                        <div>
                                            <div className="admin-progress-item-header">
                                                <span className="admin-progress-label">Chua co du lieu</span>
                                                <span className="admin-progress-percentage">0%</span>
                                            </div>
                                            <div className="admin-progress-bar-container">
                                                <div className="admin-progress-bar-fill slate"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        data.contributions.map((item) => (
                                            <div key={`${item.categoryId}-${item.categoryName}`}>
                                                <div className="admin-progress-item-header">
                                                    <span className="admin-progress-label">{item.categoryName}</span>
                                                    <span className="admin-progress-percentage">{toNumber(item.percentage).toFixed(1)}%</span>
                                                </div>
                                                <div className="admin-progress-bar-container">
                                                    <div
                                                        className="admin-progress-bar-fill"
                                                        style={{width: `${Math.max(3, Math.min(100, toNumber(item.percentage)))}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default RevenueManagementPage;