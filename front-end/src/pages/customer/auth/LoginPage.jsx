import bgi from "../../../assets/images/login_background_image.jpg"
import "../../../styles/customer/auth/LoginPage.css"
import {Mail, VisibilityOff, Visibility} from "@mui/icons-material";
import axiosClient from "../../../api/axiosClient.js";
import {useContext, useState} from "react";
import {AuthContext} from "../../../contexts/AuthContext.jsx";
import {Link, useLocation, useNavigate} from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {fetchUser} = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fromLocation = location.state?.from;
    const redirectTo = fromLocation
        ? `${fromLocation.pathname || ""}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/bookseller/home";

    const handleLogin = async(e) => {
        e.preventDefault();

        setErrorMessage("");
        setIsSubmitting(false);

        try {
            const res = await axiosClient.post("/auth/login", {
                email,
                password
            });

            const token = res.data.accessToken;
            if (!token) return;

            localStorage.setItem("accessToken", token);

            const me  = await fetchUser();
            if (!me) {
                console.error("Log ok nhưng confirm fail")
                return;
            }
            navigate(redirectTo, {replace:true, state: fromLocation?.state});

        }catch (err) {
            const status = err.response.status;
            const data = err.response.data;

            const serverMsg = typeof data === "string" ? data : data?.message || data?.error || "";

            if (status === 404){
                setErrorMessage("User not found");
            }else if(status === 401){
                setErrorMessage("Incorrect username or password");
            }else if(status === 400){
                setErrorMessage(serverMsg || "Invalid data");
            }else{
                setErrorMessage(serverMsg || "Login failed. Please try again");
            }
        }finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <main className="bl-main">
                <div className="bl-login-wrapper">
                    <div className="bl-login-container">
                        <div className="bl-image-panel">
                            <div className="bl-background-image" style={{backgroundImage: `url(${bgi})`}}></div>
                            <div className="bl-image-gradient"></div>
                            <div className="bl-image-content">
                                <p className="bl-image-title">Explore the world through your books.</p>
                                <p className="bl-image-subtitle">Thousands of books a waiting for you.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bl-form-panel">
                    <div className="bl-form-header">
                        <h1 className="bl-form-title">Log In</h1>
                        <p className="bl-form-subtitle">Welcome back to KBook!</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <p className="validation-message" ></p>

                        <div className="bl-form-group">
                            <label htmlFor="bl-email">Email</label>
                            <div className="bl-input-wrapper">
                                <input className="login-input" type="email" id="bl-email" placeholder="Please enter your email" autoComplete="email"
                                       value={email}
                                       onChange={(e) => setEmail(e.target.value)}/>
                                    <span className="bl-input-icon">
                                        <span className="material-symbols-outlined"><Mail/></span>
                                    </span>
                            </div>
                            {errorMessage && <p className="validation-message">{errorMessage}</p>}
                        </div>

                        <div className="bl-form-group">
                            <div className="bl-label-row">
                                <label htmlFor="bl-password">Password</label>
                                <a href="#" className="bl-forgot-link">Forget your password?</a>
                            </div>
                            <div className="bl-input-wrapper">
                                <input className="login-input" type={showPassword ? "password" : "text"}  id="bl-password" name="password"
                                       placeholder="Please enter your password" autoComplete="current-password" value={password}
                                       onChange={(e) => setPassword(e.target.value)}/>
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(prev => !prev)}>
                                    <span className="material-symbols-outlined">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </span>
                                </button>
                            </div>
                            {errorMessage && <p className="validation-message">{errorMessage}</p>}
                        </div>

                        <button type="submit" className="bl-submit-button" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Submit"}
                        </button>

                        <div className="bl-divider">
                            <div className="bl-divider-line"></div>
                            <span className="bl-divider-text">Or login with</span>
                            <div className="bl-divider-line"></div>
                        </div>

                        <div className="bl-social-login">
                            <a href="http://localhost:8080/oauth2/authorization/google" className="bl-social-button">
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z"
                                        fill="#fff" fillOpacity="0" stroke="none"></path>
                                    <path
                                        d="M20.1018 10.1654h-8.1014v3.6846h4.6322c-.1996 1.0776-.8072 1.99-1.7207 2.602l2.7845 2.1604c1.6293-1.5005 2.569-3.709 2.569-6.2846 0-.6163-.0553-1.2202-.1636-1.8024l-.0004-.3599Z"
                                        fill="#4285F4"></path>
                                    <path
                                        d="M12.0004 18.45c2.279 0 4.1906-.7555 5.5862-2.044l-2.7845-2.1604c-.756.5065-1.723.806-2.8017.806-2.199 0-4.0624-1.4854-4.7265-3.482l-2.8776 2.2312c1.4187 2.8166 4.316 4.6492 7.604 4.6492l.0001-.0001Z"
                                        fill="#34A853"></path>
                                    <path
                                        d="M7.2739 11.5696c-.1716-.514-.2696-1.0623-.2696-1.63 0-.5678.098-1.116.2696-1.63l-2.8776-2.2312C3.6053 7.6473 3.12 9.227 3.12 10.9396c0 1.7126.4853 3.2923 1.2764 4.8612l2.8775-2.2312Z"
                                        fill="#FBBC05"></path>
                                    <path
                                        d="M12.0004 6.3804c1.2393 0 2.352.426 3.2266 1.261l2.4173-2.4173C16.1866 3.9056 14.275 3.03 12.0004 3.03 8.7124 3.03 5.815 4.8626 4.3963 7.6792l2.8776 2.2312c.664-1.9966 2.5275-3.482 4.7265-3.482v-.048Z"
                                        fill="#EB4335"></path>
                                </svg>
                                <span>Google</span>
                            </a>
                        </div>

                        <div className="bl-footer-link">
                            <p>
                                Don't have an account yet?
                                <Link to="/bookseller/register">Sign up now!</Link>
                            </p>
                        </div>
                    </form>
                </div>
                </div>
            </main>
        </>
    );
}

export default LoginPage;
