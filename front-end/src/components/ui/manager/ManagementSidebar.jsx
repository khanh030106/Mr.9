import { Link, NavLink } from "react-router-dom";
import {
    BarChartOutlined,
    DashboardOutlined,
    BookOutlined,
    CategoryOutlined,
    EmojiEventsOutlined,
    GroupOutlined, HelpOutline,
    NotificationsNone, PersonOutline,
    ShoppingCartOutlined
} from "@mui/icons-material";
const ManagementSidebar = () => {
    const managementLinks = [
        { to: "/bookseller/admin/manager_dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
        { to: "/bookseller/admin/order_mamagement", icon: <ShoppingCartOutlined />, label: "Orders" },
        { to: "/bookseller/admin/book_mamagement", icon: <BookOutlined />, label: "Books" },
        { to: "/bookseller/admin/category_mamagement", icon: <CategoryOutlined />, label: "Categories" },
        { to: "/bookseller/admin/user_mamagement", icon: <GroupOutlined />, label: "Users" },
        { to: "/bookseller/admin/revenue_mamagement", icon: <BarChartOutlined />, label: "Revenue" },
        { to: "/bookseller/admin/topcustomer_mamagement", icon: <EmojiEventsOutlined />, label: "Top customers" }
    ];

    const infoLinks = [
        { to: "/bookseller/profile", icon: <PersonOutline />, label: "Account" },
        { to: "#", icon: <NotificationsNone />, label: "Notification" },
        { to: "#", icon: <HelpOutline />, label: "Help" }
    ];

    const getNavClassName = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

    return (
        <>
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <span className="admin-sidebar-logo" aria-hidden="true"><BookOutlined/></span>
                    <div className="admin-sidebar-brand">
                        <h1>KBOOKs.</h1>
                        <p>Management Panel</p>
                    </div>
                </div>



                {/* REFACTOR START: Sidebar menu structure upgraded for modern ecommerce UI and reliable active states */}
                <div className="nav-section ">
                    <h3 className="section-title">Management menu</h3>
                    <ul className="nav-list">
                        {managementLinks.map((item) => (
                            <li className="nav-item" key={item.to}>
                                <NavLink to={item.to} className={getNavClassName} end>
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                    <span className="nav-link-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="nav-section">
                    <h3 className="section-title">Information</h3>
                    <ul className="nav-list">
                        {infoLinks.map((item) => (
                            <li className="nav-item" key={item.label}>
                                {item.to === "#" ? (
                                    <Link className="nav-link nav-link-muted" to={item.to}>
                                        <span className="material-icons-outlined">{item.icon}</span>
                                        <span className="nav-link-text">{item.label}</span>
                                    </Link>
                                ) : (
                                    <NavLink className={getNavClassName} to={item.to} end>
                                        <span className="material-icons-outlined">{item.icon}</span>
                                        <span className="nav-link-text">{item.label}</span>
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                {/* REFACTOR END: Sidebar menu structure upgraded for modern ecommerce UI and reliable active states */}
            </aside>
        </>
    );
}

export default ManagementSidebar;