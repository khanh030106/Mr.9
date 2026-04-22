import {useContext} from "react";
import {Navigate, Outlet, useLocation} from "react-router-dom";
import {AuthContext} from "../../contexts/AuthContext.jsx";

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/bookseller/login" replace state={{ from: location }} />;
    }

    if (allowedRoles.length > 0) {
        const hasRole = allowedRoles.some((role) => user.role?.includes(role));

        if (!hasRole) {
            return <Navigate to="/bookseller/home" replace />;
        }
    }
    return <Outlet />;
};

export default ProtectedRoute;
