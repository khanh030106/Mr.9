import {FilterList, Search} from "@mui/icons-material";
import {useEffect, useMemo, useState} from "react";
import {getAdminTopCustomers} from "../../api/bookApi.js";
import {getUserImage} from "../../utils/GetImageUrl.js";
import {formatPrice} from "../../utils/FormatPrice.jsx";
import "../../styles/admin/TopCustomerManagementPage.css";

const PAGE_SIZE = 10;
const PERIOD_OPTIONS = [
    { value: "ALL", label: "All time" },
    { value: "WEEK", label: "Last 7 days" },
    { value: "MONTH", label: "Last 30 days" },
    { value: "YEAR", label: "Last 12 months" },
];

const emptyData = {
    period: "ALL",
    page: 0,
    size: PAGE_SIZE,
    totalPages: 1,
    totalElements: 0,
    podium: [],
    rankings: [],
};

const formatMoney = (value) => `${formatPrice(value || 0)} ₫`;

const getPodiumClassName = (rank) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "rank-2";
};

const getPodiumTone = (rank) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "silver";
};

const TopCustomerManagementPage = () => {
    const [period, setPeriod] = useState("ALL");
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [pageIndex, setPageIndex] = useState(0);

    const [data, setData] = useState(emptyData);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setPageIndex(0);
    }, [period]);

    useEffect(() => {
        let isMounted = true;

        // --- ADMIN TOP CUSTOMER START: load ranking data from backend endpoint ---
        const fetchTopCustomers = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const response = await getAdminTopCustomers({
                    period,
                    keyword,
                    page: pageIndex,
                    size: PAGE_SIZE,
                });

                if (!isMounted) return;

                setData({
                    ...emptyData,
                    ...response,
                    podium: Array.isArray(response?.podium) ? response.podium : [],
                    rankings: Array.isArray(response?.rankings) ? response.rankings : [],
                });
            } catch (error) {
                if (!isMounted) return;
                setData(emptyData);
                setErrorMessage(error?.response?.data?.message || "Khong tai duoc top customer.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchTopCustomers();
        // --- ADMIN TOP CUSTOMER END: load ranking data from backend endpoint ---

        return () => {
            isMounted = false;
        };
    }, [period, keyword, pageIndex]);

    const podiumRows = useMemo(() => {
        const byRank = new Map((data.podium || []).map((item) => [item.rank, item]));
        return [2, 1, 3].map((rank) => byRank.get(rank) || null);
    }, [data.podium]);

    const pageFrom = data.totalElements <= 0 ? 0 : pageIndex * PAGE_SIZE + 1;
    const pageTo = Math.min((pageIndex + 1) * PAGE_SIZE, data.totalElements || 0);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setPageIndex(0);
        setKeyword(keywordInput.trim());
    };

    const handleReset = () => {
        setKeywordInput("");
        setKeyword("");
        setPeriod("ALL");
        setPageIndex(0);
    };

    const canGoPrev = pageIndex > 0 && !isLoading;
    const canGoNext = pageIndex < Math.max((data.totalPages || 1) - 1, 0) && !isLoading;

    return (
        <>
            <main className="top-customer-page">
                <div className="container">
                    <div className="main-wrapper">
                        <div className="main-content">
                            <div className="content-container">

                                <div className="controls-section">
                                    <form className="search-wrapper" onSubmit={handleSearchSubmit}>
                                        <span className="search-icon material-symbols-outlined"><Search/></span>
                                        <select
                                            className="period-select"
                                            value={period}
                                            onChange={(event) => setPeriod(event.target.value)}
                                        >
                                            {PERIOD_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                        <input type="text"
                                               name="keyword"
                                               className="search-input"
                                               placeholder="Search by customer name, email or ID..."
                                               value={keywordInput}
                                               onChange={(event) => setKeywordInput(event.target.value)}
                                        />
                                        <button className="search-btn" type="submit">Search</button>
                                        <button className="search-btn ghost" type="button" onClick={handleReset}>Reset</button>
                                    </form>
                                    <p className="tc-error-text">{errorMessage}</p>
                                </div>

                                <div className="podium-section">
                                    {podiumRows.map((item, index) => {
                                        const rank = [2, 1, 3][index];
                                        const tone = getPodiumTone(rank);

                                        if (!item) {
                                            return (
                                                <div className={`podium-card ${getPodiumClassName(rank)}`} key={`empty-${rank}`}>
                                                    <div className="podium-empty">No data</div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className={`podium-card ${getPodiumClassName(rank)}`} key={item.userId || rank}>
                                                <div className={`avatar-wrapper ${rank === 1 ? "gold" : ""}`}>
                                                    <div className={`avatar-container ${tone}`}>
                                                        <div
                                                            className="avatar-img"
                                                            style={{ backgroundImage: `url(${getUserImage(item.avatar)})`, backgroundSize: "cover", backgroundPosition: "center" }}
                                                        ></div>
                                                    </div>
                                                    <div className={`rank-badge ${tone}`}>#{item.rank}</div>
                                                </div>
                                                <div className={`podium-content ${rank === 1 ? "gold" : ""}`}>
                                                    <h3 className={`customer-name ${rank === 1 ? "gold" : ""}`}>{item.customerName || "Unknown"}</h3>
                                                    <p className={`customer-email ${rank === 1 ? "gold" : ""}`}>{item.customerEmail || ""}</p>
                                                    <div className={`stats-box ${rank === 1 ? "gold" : ""}`}>
                                                        <div className="stat-item">
                                                            <p className={`stat-label ${rank === 1 ? "gold" : ""}`}>Total Spend</p>
                                                            <p className={`stat-value ${rank === 1 ? "gold" : ""}`}>{formatMoney(item.totalSpend)}</p>
                                                        </div>
                                                        <div className="stat-item right">
                                                            <p className={`stat-label ${rank === 1 ? "gold" : ""}`}>Orders</p>
                                                            <p className={`stat-value ${rank === 1 ? "gold" : ""}`}>{item.totalOrders || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="table-card">
                                    <div className="table-header">
                                        <h3 className="table-title">Full Rankings</h3>
                                        <div className="table-actions">
                                            <button className="table-action-btn" type="button" aria-label="Filter period">
                                                <span className="material-symbols-outlined"><FilterList/></span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>Customer</th>
                                                <th className="center">Orders</th>
                                                <th className="right">Avg. Order</th>
                                                <th className="right">Total Spend</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan="5" className="center">Loading customer data...</td>
                                                </tr>
                                            ) : data.rankings.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="center">No customer data found.</td>
                                                </tr>
                                            ) : (
                                                data.rankings.map((row) => (
                                                    <tr key={row.userId || row.rank}>
                                                        <td>
                                                            <span className="rank-number">{String(row.rank || 0).padStart(2, "0")}</span>
                                                        </td>
                                                        <td>
                                                            <div className="customer-cell">
                                                                <div
                                                                    className="customer-avatar"
                                                                    style={{ backgroundImage: `url(${getUserImage(row.avatar)})`, backgroundSize: "cover", backgroundPosition: "center" }}
                                                                ></div>
                                                                <div className="customer-details">
                                                                    <span className="customer-details-name">{row.customerName || "Unknown"}</span>
                                                                    <span className="customer-details-email">{row.customerEmail || ""}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="center">
                                                            <span className="order-badge">{row.totalOrders || 0}</span>
                                                        </td>
                                                        <td className="right">{formatMoney(row.averageOrderValue)}</td>
                                                        <td className="right">
                                                            <span className="total-spend">{formatMoney(row.totalSpend)}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pagination-footer">
                                        <p className="pagination-info">
                                            Showing <strong>{pageFrom}</strong>
                                            to <strong>{pageTo}</strong>
                                            of <strong>{data.totalElements || 0}</strong> customers
                                        </p>
                                        <div className="pagination-buttons">
                                            <button
                                                className="pagination-btn"
                                                type="button"
                                                disabled={!canGoPrev}
                                                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                className="pagination-btn"
                                                type="button"
                                                disabled={!canGoNext}
                                                onClick={() => setPageIndex((prev) => prev + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
export default TopCustomerManagementPage;