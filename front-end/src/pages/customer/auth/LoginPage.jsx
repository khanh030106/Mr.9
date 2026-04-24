import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, VisibilityOff, Visibility, Google } from "@mui/icons-material";
import bgi from "../../../assets/images/login_background_image.jpg";
import axiosClient from "../../../api/axiosClient.js";
import { AuthContext } from "../../../contexts/AuthContext.jsx";
import "../../../styles/customer/auth/LoginPage.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { fetchUser } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const fromLocation = location.state?.from;
    const redirectTo = fromLocation
        ? `${fromLocation.pathname || ""}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/bookseller/home";

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const res = await axiosClient.post("/auth/login", { email, password });
            const token = res.data.accessToken;
            
            if (token) {
                localStorage.setItem("accessToken", token);
                const me = await fetchUser();
                if (me) {
                    navigate(redirectTo, { replace: true, state: fromLocation?.state });
                }
            }
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            const serverMsg = typeof data === "string" ? data : data?.message || data?.error || "Đăng nhập thất bại";

            if (status === 404) setErrorMessage("Tài khoản không tồn tại.");
            else if (status === 401) setErrorMessage("Email hoặc mật khẩu không đúng.");
            else setErrorMessage(serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page-root">
            <div className="auth-card">
                {/* Left Side: Branding/Image */}
                <div className="auth-visual">
                    <div className="visual-bg" style={{ backgroundImage: `url(${bgi})` }}></div>
                    <div className="visual-overlay"></div>
                    <div className="visual-content">
                        <h2 className="visual-title">QBook</h2>
                        <p className="visual-text">Khám phá câu chuyện yêu thích tiếp theo của bạn. Tham gia cộng đồng độc giả của chúng tôi ngay hôm nay.</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="auth-form-container">
                    <div className="form-header">
                        <h1>Chào Mừng Quay Lại</h1>
                        <p>Vui lòng nhập thông tin chi tiết của bạn để đăng nhập</p>
                    </div>

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className={`form-group ${errorMessage ? "has-error" : ""}`}>
                            <label>Địa Chỉ Email</label>
                            <div className="input-group">
                                <Mail className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="ten@congty.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={`form-group ${errorMessage ? "has-error" : ""}`}>
                            <div className="label-row">
                                <label>Mật Khẩu</label>
                                <Link to="/forgot-password" id="forgot-pw">Quên?</Link>
                            </div>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="toggle-pw"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </button>
                            </div>
                        </div>

                        {errorMessage && <div className="error-alert">{errorMessage}</div>}

                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? <span className="spinner"></span> : "Đăng Nhập"}
                        </button>

                        <div className="divider">
                            <span>hoặc tiếp tục với</span>
                        </div>

                        <a href="http://localhost:8080/oauth2/authorization/google" className="btn-google">
                            <Google className="google-icon" />
                            Đăng nhập bằng Google
                        </a>

                        <p className="auth-footer">
                            Mới đến với QBook? <Link to="/bookseller/register">Tạo tài khoản</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;