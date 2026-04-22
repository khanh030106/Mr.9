import {Link} from "react-router-dom";
import {ArrowForward, CalendarMonth, Email, Person, Visibility, VisibilityOff} from "@mui/icons-material";
import "../../../styles/customer/auth/RegisterPage.css";
import {useMemo, useState} from "react";
import {registerUser} from "../../../api/authApi.js";

const initialForm = {
    fullName: "",
    email: "",
    gender: "Male",
    dob: "",
    password: "",
    confirmPassword: "",
    terms: false,
};

const RegisterPage = () => {

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [serverMessage, setServerMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const submitDisabled = useMemo(() => isSubmitting, [isSubmitting]);

    const onChange = (field) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((prev) => ({...prev, [field]: value}));
        setErrors((prev) => ({...prev, [field]: ""}));
        setServerMessage("");
        setSuccessMessage("");
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
        if (!form.email.trim()) {
            nextErrors.email = "Please enter your email.";
        } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            nextErrors.email = "Invalid email address.";
        }

        if (!form.password) {
            nextErrors.password = "Please enter your password.";
        } else if (form.password.length < 6) {
            nextErrors.password = "Password must be at least 6 characters.";
        }

        if (!form.confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your password.";
        } else if (form.confirmPassword !== form.password) {
            nextErrors.confirmPassword = "Confirm passwords must match.";
        }

        if (!form.terms) nextErrors.terms = "You must enter your terms!.";

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setServerMessage("");
        setSuccessMessage("");

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
            };

            const data = await registerUser(payload);
            setSuccessMessage(
                data?.message ||
                "Register successfully.Please check your email to get a active link."
            );
            setForm(initialForm);
        } catch (err) {

            console.log("err.message:", err.message);
            console.log("err.status:", err.status);
            console.log("err.data:", err.data);

            const apiErrors = err?.data?.errors || {};
            if (Object.keys(apiErrors).length) {
                setErrors((prev) => ({
                    ...prev,
                    fullName: apiErrors.fullName || prev.fullName,
                    email: apiErrors.email || prev.email,
                    password: apiErrors.password || prev.password,
                }));
            }
            setServerMessage(err?.data?.message || err.message || "Error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="register-main">
            <div className="register-background-decor">
                <div className="register-blob-1"></div>
                <div className="register-blob-2"></div>
            </div>

            <div className="register-card">
                <div className="register-card-content">
                    <div className="register-card-header">
                        <h1 className="register-card-title">Sign Up</h1>
                        <p className="register-card-subtitle">
                            Create an account to shop and track your orders more easily!
                        </p>
                    </div>
                    {serverMessage && <p className="register-error-banner">{serverMessage}</p>}
                    {successMessage && (
                        <p className="register-success-banner">{successMessage}</p>
                    )}
                    <form className="register-form" onSubmit={handleRegister} noValidate>
                        <div className="register-form-group">
                            <label htmlFor="fullname" className="register-label">
                                Full name
                            </label>
                            <div className="register-input-wrapper">
                                <input
                                    type="text"
                                    id="fullname"
                                    className="register-input"
                                    placeholder="Enter your full name"
                                    value={form.fullName}
                                    onChange={onChange("fullName")}
                                />
                                <div className="register-input-icon">
                                    <span className="material-symbols-outlined"><Person/></span>
                                </div>
                            </div>
                            {errors.fullName && <small className="register-error">{errors.fullName}</small>}
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="email" className="register-label">
                                Email
                            </label>
                            <div className="register-input-wrapper">
                                <input
                                    type="email"
                                    id="email"
                                    className="register-input"
                                    placeholder="example@email.com"
                                    value={form.email}
                                    onChange={onChange("email")}
                                    autoComplete="email"
                                />
                                <div className="register-input-icon">
                                    <span className="material-symbols-outlined"><Email/></span>
                                </div>
                            </div>
                            {errors.email && <small className="register-error">{errors.email}</small>}
                        </div>

                        <div className="register-form-row">
                            <div className="register-form-group">
                                <label htmlFor="gender" className="register-label">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    className="register-select"
                                    value={form.gender}
                                    onChange={onChange("gender")}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">None of them</option>
                                </select>
                            </div>

                            <div className="register-form-group">
                                <label htmlFor="dob" className="register-label">
                                    Date of Birth
                                </label>
                                <div className="register-input-wrapper">
                                    <input
                                        type="date"
                                        id="dob"
                                        className="register-input register-date-input"
                                        value={form.dob}
                                        onChange={onChange("dob")}
                                    />
                                    <div className="register-calendar-icon">
                                        <span className="material-symbols-outlined"><CalendarMonth/></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="password" className="register-label">
                                Password
                            </label>
                            <div className="register-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="register-input"
                                    placeholder="6 characters at least"
                                    value={form.password}
                                    autoComplete="password"
                                    onChange={onChange("password")}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? <Visibility/> : <VisibilityOff/>}
                                    </span>
                                </button>
                            </div>
                            {errors.password && <small className="register-error">{errors.password}</small>}
                        </div>

                        <div className="register-form-group">
                            <label htmlFor="confirm_password" className="register-label">
                                Confirm password
                            </label>
                            <div className="register-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirm_password"
                                    className="register-input"
                                    placeholder="Enter confirm password"
                                    value={form.confirmPassword}
                                    autoComplete="new-password"
                                    onChange={onChange("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                >
                                    <span className="material-symbols-outlined">
                                        {showConfirmPassword ? <Visibility/> : <VisibilityOff/>}
                                     </span>
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <small className="register-error">{errors.confirmPassword}</small>
                            )}
                        </div>

                        <div className="register-checkbox-wrapper">
                            <input
                                type="checkbox"
                                id="terms"
                                name="terms"
                                className="register-checkbox"
                                checked={form.terms}
                                onChange={onChange("terms")}
                            />
                            <label htmlFor="terms" className="register-checkbox-label">
                                I agree to <a href="#" className="register-link">Terms</a> and{" "}
                                <a href="#" className="register-link">privacy policy</a>.
                            </label>
                        </div>
                        {errors.terms && <small className="register-error">{errors.terms}</small>}

                        <button type="submit" className="register-submit-button" disabled={submitDisabled}>
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </form>

                    <div className="register-footer-link">
                        <p className="register-footer-text">
                            You have an account?
                            <Link to="/bookseller/login" className="register-footer-anchor">
                                Login now!
                                <span className="material-symbols-outlined"><ArrowForward/></span>
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default RegisterPage;