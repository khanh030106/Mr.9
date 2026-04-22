import {AutoStories, ChevronLeft, ChevronRight} from "@mui/icons-material";
import "../../styles/admin/RevenueManagementPage.css";


const RevenueManagementPage = () => {
    return (
        <>
            <main className="revenue-management-page">
                <div className="admin-content">

                    <div className="admin-stats-grid">
                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Tổng doanh thu</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">0đ</p>
                                <span className="admin-stat-change">0%</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar"></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Tổng số lượng bán</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">0</p>
                                <span className="admin-stat-change">0%</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar"></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Giá trung bình</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">0đ</p>
                                <span className="admin-stat-change">0%</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar"></div>
                            </div>
                        </div>

                        <div className="admin-stat-card">
                            <p className="admin-stat-label">Khách hàng mới</p>
                            <div className="admin-stat-value-row">
                                <p className="admin-stat-value">0</p>
                                <span className="admin-stat-change">0%</span>
                            </div>
                            <div className="admin-stat-progress">
                                <div className="admin-stat-progress-bar"></div>
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
                                <tr>
                                    <td colSpan="6">Chưa có dữ liệu doanh thu trong tháng này.</td>
                                </tr>
                                <tr >
                                    <td>
                                        <div className="admin-category-cell">
                                            <div className="admin-category-icon">
                                    <span className="material-symbols-outlined"><AutoStories/></span>
                                            </div>
                                            <span className="admin-category-name">Danh mục</span>
                                        </div>
                                    </td>
                                    <td className="admin-revenue-cell">0đ
                                    </td>
                                    <td>0</td>
                                    <td >0đ</td>
                                    <td>0đ</td>
                                    <td>
                                        <span className="admin-price-badge">0đ</span>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-table-footer">
                            <p className="admin-table-info">
                                Hiển thị 0 trên 0 danh mục
                            </p>
                            <div className="admin-pagination">
                                <button className="admin-pagination-btn" disabled>
                                    <span className="material-symbols-outlined"><ChevronLeft/></span>
                                </button>
                                <button className="admin-pagination-btn">
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
                                <div className="admin-bar">
                                    <div className="admin-bar-fill"></div>
                                </div>
                            </div>

                            <div className="admin-chart-labels">
                                <span>Thứ 2</span>
                            </div>
                        </div>

                        <div className="admin-progress-card">
                            <h3 className="admin-chart-title">Tỉ lệ đóng góp</h3>

                            <div className="admin-progress-content">
                                <div className="admin-progress-list">
                                    <div>
                                        <div className="admin-progress-item-header">
                                            <span className="admin-progress-label">Chưa có dữ liệu</span>
                                            <span className="admin-progress-percentage">0%</span>
                                        </div>
                                        <div className="admin-progress-bar-container">
                                            <div className="admin-progress-bar-fill slate"></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-progress-item-header">
                                            <span className="admin-progress-label">Danh mục</span>
                                            <span className="admin-progress-percentage">0%</span>
                                        </div>
                                        <div className="admin-progress-bar-container">
                                            <div className="admin-progress-bar-fill"></div>
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

export default RevenueManagementPage;