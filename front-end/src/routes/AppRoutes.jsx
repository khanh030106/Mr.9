import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import HomeLayout from "../components/layouts/HomeLayout.jsx";
import HomePage from "../pages/home/HomePage.jsx";
import LoginPage from "../pages/customer/auth/LoginPage.jsx";
import UserLayout from "../components/layouts/UserLayout.jsx";
import ScrollToTop from "../utils/ScrollToTop.jsx";
import OAuthCallback from "../pages/customer/auth/OAuthCallback.jsx";
import RegisterPage from "../pages/customer/auth/RegisterPage.jsx";
import VerifyEmailPage from "../pages/customer/auth/VerifyEmailPage.jsx";
import CartPage from "../pages/customer/product/CartPage.jsx";
import ProfilePage from "../pages/customer/user/PofilePage.jsx";
import FavouritePage from "../pages/customer/product/FavouritePage.jsx";
import OrderPage from "../pages/customer/product/OrderPage.jsx";
import AdminLayout from "../components/layouts/AdminLayout.jsx";
import DashboardPage from "../pages/admin/DashboardPage.jsx";
import OrderManagementPage from "../pages/admin/OrderManagementPage.jsx";
import BookManagementPage from "../pages/admin/BookManagementPage.jsx";
import CategoryManagementPage from "../pages/admin/CategoryManagementPage.jsx";
import UserManagementPage from "../pages/admin/UserManagementPage.jsx";
import RevenueManagementPage from "../pages/admin/RevenueManagementPage.jsx";
import TopCustomerManagementPage from "../pages/admin/TopCustomerManagementPage.jsx";
import {DetailBookPage} from "../pages/customer/product/DetailBookPage.jsx";
import CheckoutPage from "../pages/customer/product/CheckoutPage.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import AllBooksPage from "../pages/customer/product/AllBooksPage.jsx";

const AppRoutes = () => {
    return (

        <BrowserRouter>
            <ScrollToTop/>

            <Routes>

                <Route path="/" element={<Navigate to="/bookseller/home" replace />}/>

                <Route element={<HomeLayout/>}>
                    <Route path="/bookseller/home" element={<HomePage/>}/>
                    <Route path="/bookseller/detail/:id" element={<DetailBookPage />}/>
                    <Route path="/bookseller/allbook" element={<AllBooksPage/>}/>
                </Route>

                <Route path="/bookseller/login" element={<LoginPage/>}/>
                <Route path="/bookseller/register" element={<RegisterPage/>}/>
                <Route path="/api/login/oauth2/callback" element={<OAuthCallback/>}/>
                <Route path="/verify-email" element={<VerifyEmailPage />} />


                <Route element={<ProtectedRoute/>}>
                    <Route element={<UserLayout/>}>
                        <Route path="/bookseller/order" element={<OrderPage/>}/>
                        <Route path="/bookseller/favourite" element={<FavouritePage/>}/>
                        <Route path="/bookseller/cart" element={<CartPage/>}/>
                        <Route path="/bookseller/profile" element={<ProfilePage/>}/>
                        <Route path="/bookseller/checkout" element={<CheckoutPage />} />
                    </Route>
                </Route>

                <Route element={<UserLayout/>}>
                    <Route path="/bookseller/morebook" element={<AllBooksPage/>}/>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["ADMIN", "ROLE_ADMIN"]}/>}>
                    <Route element={<AdminLayout/>}>
                        <Route path="/bookseller/admin/manager_dashboard" element={<DashboardPage/>}/>
                        <Route path="/bookseller/admin/order_mamagement" element={<OrderManagementPage/>}/>
                        <Route path="/bookseller/admin/book_mamagement" element={<BookManagementPage/>}></Route>
                        <Route path="/bookseller/admin/category_mamagement" element={<CategoryManagementPage/>}></Route>
                        <Route path="/bookseller/admin/user_mamagement" element={<UserManagementPage/>}></Route>
                        <Route path="/bookseller/admin/revenue_mamagement" element={<RevenueManagementPage/>}></Route>
                        <Route path="/bookseller/admin/topcustomer_mamagement" element={<TopCustomerManagementPage/>}></Route>
                    </Route>

                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
