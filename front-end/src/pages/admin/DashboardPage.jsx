import {
    BarChartOutlined,
    BookOutlined,
    CategoryOutlined,
    EmojiEventsOutlined,
    GroupOutlined,
    ShoppingCartOutlined
} from "@mui/icons-material";
import "../../styles/admin/DashboardPage.css";

const managementFeatures = [
    {
        icon: ShoppingCartOutlined,
        title: "Order Management",
        description: "Track order status, and handle customer requests quickly."
    },
    {
        icon: BookOutlined,
        title: "Book Catalog",
        description: "Create, edit, and organize book records with full inventory control."
    },
    {
        icon: CategoryOutlined,
        title: "Category Setup",
        description: "Group products into clear categories for better browsing and discovery."
    },
    {
        icon: GroupOutlined,
        title: "User Administration",
        description: "Manage customer accounts, roles, and account activity in one place."
    },
    {
        icon: BarChartOutlined,
        title: "Revenue Insights",
        description: "Monitor sales performance with daily and monthly business metrics."
    },
    {
        icon: EmojiEventsOutlined,
        title: "Top Customers",
        description: "Identify loyal customers and drive retention with targeted actions."
    }
];

const DashboardPage = () => {
    return (
        <section className="dashboard-page">
            <div className="dashboard-shell">
                <header className="dashboard-header">
                    <p className="dashboard-kicker">Admin Dashboard</p>
                    <h1>Welcome back to QBOOK management</h1>
                    <p className="dashboard-subtitle">
                        Everything you need to manage operations, monitor business performance,
                        and keep the store running smoothly.
                    </p>
                </header>

                <section className="dashboard-feature-summary" aria-label="Management features">
                    {managementFeatures.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <article key={feature.title} className="feature-card">
                                <span className="feature-icon" aria-hidden="true">
                                    <Icon />
                                </span>
                                <div>
                                    <h2>{feature.title}</h2>
                                    <p>{feature.description}</p>
                                </div>
                            </article>
                        );
                    })}
                </section>
            </div>
        </section>
    );
};

export default DashboardPage;