const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";


//-----------------------------PARSE RESPONSE API--------------------------------
async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const error = new Error(data?.message || "Request failed");
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

//--------------------------REGISTER API-------------------------------------------
export async function registerUser(payload) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}
