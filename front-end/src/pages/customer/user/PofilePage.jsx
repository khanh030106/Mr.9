import {Badge, Cake, Call, Edit, ExpandMore, Mail, Person, PhotoCamera, Save, Wc} from "@mui/icons-material";
import {useContext, useEffect, useMemo, useState} from "react";
import {AuthContext} from "../../../contexts/AuthContext.jsx";
import axiosClient from "../../../api/axiosClient.js";
import "../../../styles/customer/user/ProfilePage.css";
import {getUserImage} from "../../../utils/GetImageUrl.js";

const initialForm = {
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
};

const ProfilePage = () => {
    const {user, fetchUser} = useContext(AuthContext);
    const [formData, setFormData] = useState(initialForm);
    // --- PROFILE AVATAR REFACTOR START: local avatar file + preview state for profile upload ---
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    // --- PROFILE AVATAR REFACTOR END: local avatar file + preview state for profile upload ---
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // --- BEGIN FIX: bind dữ liệu user từ AuthContext lên Profile form — revert: xóa useEffect này + state formData ---
    useEffect(() => {
        if (!user) return;
        setFormData({
            fullName: user.fullName ?? "",
            phone: user.phone ?? "",
            dateOfBirth: user.dateOfBirth ?? "",
            gender: user.gender ?? "",
        });
        setAvatarPreview(getUserImage(user.avatar));
        setAvatarFile(null);
    }, [user]);
    // --- END FIX: bind dữ liệu user ---

    const initials = useMemo(() => {
        const name = (user?.fullName || "").trim();
        if (!name) return "U";
        const parts = name.split(/\s+/).filter(Boolean);
        return parts.slice(-2).map((p) => p[0]?.toUpperCase() || "").join("") || "U";
    }, [user?.fullName]);

    const handleInputChange = (event) => {
        const {name, value} = event.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    // --- PROFILE AVATAR REFACTOR START: avatar picker validates file and previews before upload ---
    const handleAvatarFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type?.startsWith("image/")) {
            setErrorMessage("Avatar phải là file ảnh hợp lệ.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Avatar tối đa 5MB.");
            return;
        }

        setErrorMessage("");
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };
    // --- PROFILE AVATAR REFACTOR END: avatar picker validates file and previews before upload ---

    const handleCancel = () => {
        if (!user) return;
        setFormData({
            fullName: user.fullName ?? "",
            phone: user.phone ?? "",
            dateOfBirth: user.dateOfBirth ?? "",
            gender: user.gender ?? "",
        });
        setAvatarFile(null);
        setAvatarPreview(getUserImage(user.avatar));
        setSuccessMessage("");
        setErrorMessage("");
    };

    // --- BEGIN FIX: submit cập nhật profile lên backend PATCH /api/auth/profile — revert: xóa handleSubmit + onSubmit form ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        if (!formData.fullName.trim()) {
            setErrorMessage("Full name is required.");
            return;
        }

        setIsSaving(true);
        try {
            await axiosClient.patch("/auth/profile", {
                fullName: formData.fullName.trim(),
                phone: formData.phone.trim(),
                dateOfBirth: formData.dateOfBirth || "",
                gender: formData.gender || "",
            });

            // Upload avatar only when user picked a new file.
            if (avatarFile) {
                const form = new FormData();
                form.append("avatarFile", avatarFile);
                await axiosClient.post("/auth/profile/avatar", form, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });
            }

            await fetchUser();
            setSuccessMessage("Cập nhật thông tin thành công.");
        } catch (err) {
            setErrorMessage(err?.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };
    // --- END FIX: submit profile ---

    return (
        <>
            <main className="pf-main-content">
                <div className="pf-content-wrapper">
                    <div className="pf-profile-card">
                        <form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
                            <input id="backgroundFile" className="pf-hidden-file-input" type="file"
                                   name="backgroundFile" accept="image/*"/>
                            <input id="avatarFile" className="pf-hidden-file-input" type="file" name="avatarFile"
                                accept="image/*" onChange={handleAvatarFileChange}/>

                            <div
                                className="pf-cover-image"
                                style={user?.backgroundImage ? {backgroundImage: `url(${user.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center"} : undefined}
                            >
                                <div className="pf-cover-gradient"></div>
                                <label className="pf-change-cover-btn" htmlFor="backgroundFile">
                                    <span className="material-symbols-outlined"><PhotoCamera/></span>
                                    Change Cover
                                </label>
                            </div>

                            <div className="pf-profile-content">
                                <div className="pf-profile-header">
                                    <div className="pf-avatar-container">
                                        <div
                                            className="pf-profile-avatar"
                                            style={avatarPreview ? {backgroundImage: `url(${avatarPreview})`, backgroundSize: "cover", backgroundPosition: "center"} : undefined}
                                        >
                                            {!avatarPreview ? initials : null}
                                        </div>
                                        <label className="pf-edit-avatar-btn" htmlFor="avatarFile"
                                               aria-label="Edit Avatar">
                                            <span className="material-symbols-outlined"><Edit/></span>
                                        </label>
                                    </div>
                                    <div className="pf-profile-info">
                                        <h1 className="pf-profile-name">{user?.fullName || "User"}</h1>
                                        <p className="pf-profile-subtitle">{user?.email || ""}</p>
                                    </div>
                                </div>

                                <div
                                    className="pf-alert pf-alert-success"
                                    style={{display: successMessage ? "block" : "none"}}
                                >
                                    {successMessage}
                                </div>
                                <div
                                    className="pf-alert pf-alert-error"
                                    style={{display: errorMessage ? "block" : "none"}}
                                >
                                    {errorMessage}
                                </div>

                                <div className="pf-form-section">
                                    <div className="pf-section-header">
                                        <span className="material-symbols-outlined pf-section-header-icon"><Person/></span>
                                        <h3 className="pf-section-title">Personal Information</h3>
                                    </div>

                                    <div className="pf-form-grid">
                                        <div className="pf-form-column">
                                            <div className="pf-form-group">
                                                <label className="pf-form-label" htmlFor="fullName">Full Name</label>
                                                <div className="pf-input-wrapper">
                                                    <input id="fullName" name="fullName" className="pf-form-input"
                                                           type="text"
                                                           placeholder="Enter full name" required
                                                           value={formData.fullName}
                                                           onChange={handleInputChange}/>
                                                    <span className="material-symbols-outlined pf-input-icon"><Badge/></span>
                                                </div>
                                            </div>

                                            <div className="pf-form-group">
                                                <label className="pf-form-label" htmlFor="email">Email Address</label>
                                                <div className="pf-input-wrapper">
                                                    <input id="email" className="pf-form-input pf-readonly-input"
                                                           type="email" readOnly value={user?.email || ""}/>
                                                    <span className="material-symbols-outlined pf-input-icon"><Mail/></span>
                                                </div>
                                            </div>

                                            <div className="pf-form-group">
                                                <label className="pf-form-label" htmlFor="phone">Phone Number</label>
                                                <div className="pf-input-wrapper">
                                                    <input id="phone" name="phone" className="pf-form-input" type="tel"
                                                           placeholder="Enter phone number"
                                                           value={formData.phone}
                                                           onChange={handleInputChange}/>
                                                    <span className="material-symbols-outlined pf-input-icon"><Call/></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pf-form-column">
                                            <div className="pf-form-group">
                                                <label className="pf-form-label" htmlFor="dateOfBirth">Birthday</label>
                                                <div className="pf-input-wrapper">
                                                    <input id="dateOfBirth" name="dateOfBirth" className="pf-form-input"
                                                           type="date"
                                                           value={formData.dateOfBirth}
                                                           onChange={handleInputChange}/>
                                                    <span className="material-symbols-outlined pf-input-icon"><Cake/></span>
                                                </div>
                                            </div>

                                            <div className="pf-form-group">
                                                <label className="pf-form-label" htmlFor="gender">Gender</label>
                                                <div className="pf-input-wrapper">
                                                    <select
                                                        id="gender"
                                                        name="gender"
                                                        className="pf-form-input"
                                                        value={formData.gender}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="">Select gender
                                                        </option>
                                                        <option value="Nam">Nam
                                                        </option>
                                                        <option value="Nữ">Nữ
                                                        </option>
                                                        <option value="Khác">Khác
                                                        </option>
                                                    </select>
                                                    <span className="material-symbols-outlined pf-input-icon"><Wc/></span>
                                                    <span className="material-symbols-outlined pf-select-icon"><ExpandMore/></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pf-action-bar">
                                        <button className="pf-btn-cancel" type="button" onClick={handleCancel} disabled={isSaving}>Cancel</button>
                                        <button className="pf-btn-save" type="submit" disabled={isSaving}>
                                            <span className="material-symbols-outlined"><Save/></span>
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProfilePage;