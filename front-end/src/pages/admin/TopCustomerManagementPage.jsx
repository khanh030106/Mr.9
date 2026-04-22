import {FilterList, MoreVert} from "@mui/icons-material";
import "../../styles/admin/TopCustomerManagementPage.css";


const TopCustomerManagementPage = () => {
    return (
        <>
            <main className="top-customer-page">
                <div className="container">
                    <div className="main-wrapper">
                        <div className="main-content">
                            <div className="content-container">

                                <div className="controls-section">
                                    <form className="search-wrapper">
                                        <span className="search-icon material-symbols-outlined">search</span>
                                        <input type="hidden" name="period" />
                                        <input type="hidden" name="page" value="1"/>
                                        <input type="text"
                                               name="keyword"
                                               className="search-input"
                                               placeholder="Search by customer name, email or ID..."/>
                                    </form>
                                </div>

                                <div className="podium-section">
                                    <div className="podium-card rank-2">
                                        <div className="avatar-wrapper">
                                            <div className="avatar-container silver">
                                                <div className="avatar-img"></div>
                                            </div>
                                            <div className="rank-badge silver">#2</div>
                                        </div>
                                        <div className="podium-content">
                                            <h3 className="customer-name">Tran Thi B</h3>
                                            <p className="customer-email">tranthib@example.com</p>
                                            <div className="stats-box">
                                                <div className="stat-item">
                                                    <p className="stat-label">Total Spend</p>
                                                    <p className="stat-value">42.000.000 ₫</p>
                                                </div>
                                                <div className="stat-item right">
                                                    <p className="stat-label">Orders</p>
                                                    <p className="stat-value">120</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="podium-card rank-1">
                                        <div className="avatar-wrapper gold">
                                            <div className="avatar-container gold">
                                                <div className="avatar-img"></div>
                                            </div>
                                            <div className="rank-badge gold">#1</div>
                                        </div>
                                        <div className="podium-content gold">
                                            <h3 className="customer-name gold">Nguyen Van A</h3>
                                            <p className="customer-email gold">nguyenvana@example.com</p>
                                            <div className="stats-box gold">
                                                <div className="stat-item">
                                                    <p className="stat-label gold">Total Spend</p>
                                                    <p className="stat-value gold">50.000.000
                                                        ₫</p>
                                                </div>
                                                <div className="stat-item right">
                                                    <p className="stat-label gold">Orders</p>
                                                    <p className="stat-value gold">150</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="podium-card rank-3">
                                        <div className="avatar-wrapper">
                                            <div className="avatar-container bronze">
                                                <div className="avatar-img"></div>
                                            </div>
                                            <div className="rank-badge bronze">#3</div>
                                        </div>
                                        <div className="podium-content">
                                            <h3 className="customer-name">Le Van C</h3>
                                            <p className="customer-email">levanc@example.com</p>
                                            <div className="stats-box">
                                                <div className="stat-item">
                                                    <p className="stat-label">Total Spend</p>
                                                    <p className="stat-value">35.000.000 ₫</p>
                                                </div>
                                                <div className="stat-item right">
                                                    <p className="stat-label">Orders</p>
                                                    <p className="stat-value">90</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-card">
                                    <div className="table-header">
                                        <h3 className="table-title">Full Rankings</h3>
                                        <div className="table-actions">
                                            <button className="table-action-btn">
                                                <span className="material-symbols-outlined"><FilterList/></span>
                                            </button>
                                            <button className="table-action-btn">
                                                <span className="material-symbols-outlined"><MoreVert/></span>
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
                                            <tr>
                                                <td colSpan="5" className="center">No customer data found.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <span className="rank-number">04</span>
                                                </td>
                                                <td>
                                                    <div className="customer-cell">
                                                        <div className="customer-avatar"></div>
                                                        <div className="customer-details">
                                                            <span className="customer-details-name">Pham Minh D</span>
                                                            <span className="customer-details-email">pminhd@email.com</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="center">
                                                    <span className="order-badge">85</span>
                                                </td>
                                                <td className="right">347.058 ₫
                                                </td>
                                                <td className="right">
                                                <span className="total-spend">29.500.000 ₫</span>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pagination-footer">
                                        <p className="pagination-info">
                                            Showing <strong>4</strong>
                                            to <strong>7</strong>
                                            of <strong>128</strong> customers
                                        </p>
                                        <div className="pagination-buttons">
                                            <form>
                                                <input type="hidden" name="keyword"/>
                                                <input type="hidden" name="period"/>
                                                <input type="hidden" name="page"/>
                                                <button className="pagination-btn" type="submit">Previous
                                                </button>
                                            </form>
                                            <form>
                                                <input type="hidden" name="keyword"/>
                                                <input type="hidden" name="period"/>
                                                <input type="hidden" name="page"/>
                                                <button className="pagination-btn" type="submit">Next
                                                </button>
                                            </form>
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