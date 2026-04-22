import { Link, useSearchParams } from "react-router-dom";
import "../../../styles/customer/auth/VerifyEmailPage.css";

const STATUS_CONFIG = {
    success: {
        title: "Verify successfully",
        description: "Your account has been verified. You can login now",
        className: "verify-success",
    },
    expired: {
        title: "Your link is expired",
        description: "Verify token is expired. Please try again later.",
        className: "verify-warning",
    },
    used: {
        title: "Link has been used",
        description: "This link has been used. Please try again later.",
        className: "verify-warning",
    },
    invalid: {
        title: "Invalid link",
        description: "Invalid link. Please try again or register now.",
        className: "verify-error",
    },
    error: {
        title: "Error",
        description: "Cannot verify this account. Try again later.",
        className: "verify-error",
    },
};

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status") || "error";
    const backendMessage = searchParams.get("message");

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.error;
    const finalMessage = backendMessage || config.description;

    return (
        <main className="verify-main">
            <div className={`verify-card ${config.className}`}>
                <h1>{config.title}</h1>
                <p>{finalMessage}</p>

                <div className="verify-actions">
                    {status === "success" ? (
                        <Link to="/bookseller/login" className="verify-btn">
                            Đi đến đăng nhập
                        </Link>
                    ) : (
                        <Link to="/bookseller/register" className="verify-btn">
                            Đăng ký lại
                        </Link>
                    )}
                </div>
            </div>
        </main>
    );
};

export default VerifyEmailPage;
