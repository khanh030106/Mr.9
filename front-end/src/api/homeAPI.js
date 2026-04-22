import axiosClient from "../api/axiosClient.js";

export const getHomeData = async () =>{
    const res = await axiosClient.get("/home");
    return res.data;
}