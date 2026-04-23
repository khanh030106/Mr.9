import {createContext, useEffect, useState} from "react";
import axiosClient from "../api/axiosClient.js";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    //----------------------------NORMALIZE USER DATA----------------------------//
    const normalizeUser = (rawData) => {
        const u = rawData?.data ?? rawData?.user ?? rawData ?? {};

        return {
            id: u.id ?? null,
            fullName: u.fullName ?? null,
            email: u.email ?? null,
            avatar: u.avatar ?? null,
            phone: u.phone ?? null,
            dateOfBirth: u.dateOfBirth ?? null,
            gender: u.gender ?? null,
            backgroundImage: u.backgroundImage ?? null,
            role: Array.isArray(u.role) ? u.role : [],
        };
    }

    //------------------------------FETCH USER DATA----------------------------------
    const fetchUser = async () => {
        try {
            const res = await axiosClient.get("/auth/me");
            const rawData = res.data;
            const userData = normalizeUser(rawData);
            setUser(userData);
            return userData;
        }catch (err){
            if (err.response?.status === 401 || err.response?.status === 403) {
                setUser(null);
            } else {
                console.error(err);
            }
            return null;
        }finally {
            setLoading(false);
        }
    };

    //-----------------------------AUTO FETCH USER ON MOUNT-------------------------------
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}