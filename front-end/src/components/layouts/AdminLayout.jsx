import ManagementSidebar from "../ui/manager/ManagementSidebar.jsx";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";

const AdminLayout = () => {
	useEffect(() => {
		document.title = "Admin Dashboard - KBOOKs.";
	}, []);

	return (
		<>
			<main className="admin-layout">
				<ManagementSidebar />
				<section className="admin-layout-content">
					<Outlet />
				</section>
			</main>
		</>
	);
};

export default AdminLayout;

