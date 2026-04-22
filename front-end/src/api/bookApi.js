import axiosClient from "./axiosClient.js";

export const getAllCategories = async () => {
    const res = await axiosClient.get('/get/categories');
    return res.data;
}

export const getActiveBookAuthors = async (signal) => {
    const res = await axiosClient.get('/books/authors', { signal });
    return Array.isArray(res.data) ? res.data : [];
}

export const getBookDetail = async (id, signal) => {
    const res = await axiosClient.get(`/books/${id}`, { signal })
    return res.data
}

export const getRelatedBook = async (id, signal) => {
    const res = await axiosClient.get(`/books/${id}/related`, { signal })
    return res.data
}

// --- ALL BOOKS REFACTOR START: fetch paged active books for all-books grid ---
export const getActiveBooksPage = async (page = 0, size = 16, filters = {}, signal) => {
    const params = { page, size };

    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.authorId) params.authorId = filters.authorId;
    if (filters?.price) params.price = filters.price;

    const res = await axiosClient.get('/books/active', {
        params,
        signal,
    });
    return res.data;
}
// --- ALL BOOKS REFACTOR END: fetch paged active books for all-books grid ---

// --- REVIEW REFACTOR START: fetch reviews for detail page review tab ---
export const getBookReviews = async (id, limit = 20, signal) => {
    const res = await axiosClient.get(`/books/${id}/reviews`, {
        params: { limit },
        signal
    });
    return Array.isArray(res.data) ? res.data : [];
}

export const createBookReview = async (id, payload) => {
    const res = await axiosClient.post(`/books/${id}/reviews`, payload);
    return res.data;
}
// --- REVIEW REFACTOR END: fetch reviews for detail page review tab ---

// --- SEARCH REFACTOR START: live product suggestions API ---
export const getSearchSuggestions = async (q, limit = 5, signal) => {
    const keyword = q?.trim();
    if (!keyword) return [];

    const res = await axiosClient.get('/books/search', {
        params: { q: keyword, limit },
        signal
    });
    return Array.isArray(res.data) ? res.data : [];
}
// --- SEARCH REFACTOR END: live product suggestions API ---

export const addToCart = async (bookId, quantity = 1) => {
    const res = await axiosClient.post('/cart/add', { bookId, quantity });
    return res.data;
}

export const getCart = async (page = 0, pageSize = 50) => {
    const res = await axiosClient.get('/cart', { params: { page, pageSize } });
    return res.data;
}

// --- BEGIN FIX: gộp nhiều trang khi giỏ > pageSize (tối đa 50/trang từ BE) — revert: chỉ gọi getCart() một lần trong CartContext ---
export const getCartAllPages = async (pageSize = 50) => {
    let page = 0;
    const merged = [];
    let totalElements = 0;
    for (; ;) {
        const res = await getCart(page, pageSize);
        const list = Array.isArray(res) ? res : (res?.content ?? []);
        if (typeof res?.totalElements === "number") {
            totalElements = res.totalElements;
        }
        merged.push(...list);
        if (list.length < pageSize) break;
        if (totalElements > 0 && merged.length >= totalElements) break;
        page += 1;
        if (page > 100) break;
    }
    return { content: merged, totalElements: totalElements || merged.length };
};
// --- END FIX: gộp trang giỏ ---

export const removeCartItems = async (bookId) => {
    const response = await axiosClient.delete(`/cart/delete/${bookId}`);
    if (response.status === 204) return null;
    return response.data ?? null;
}

// --- BEGIN FIX: PATCH quantity (nút +/-) — revert: xóa export này + handler CartPage ---
export const updateCartItemQuantity = async (bookId, quantity) => {
    await axiosClient.patch(`/cart/item/${bookId}`, { quantity });
};
// --- END FIX: PATCH quantity ---

export const getFavourites = async () => {
    const res = await axiosClient.get('/favourites');
    return res.data;
}

export const addFavourite = async (bookID) => {
    const res = await axiosClient.post(`/favourites/add/${bookID}`);
    return res.data;
}

export const removeFavourite = async (bookID) => {
    // === REFACTOR START: prefer RESTful DELETE endpoint, fallback to legacy POST /remove/{bookID} ===
    try {
        const res = await axiosClient.delete(`/favourites/${bookID}`);
        return res.data ?? null;
    } catch (error) {
        // Backward compatibility with backend versions that still expose POST remove endpoint.
        if (error?.response?.status === 404 || error?.response?.status === 405) {
            const legacyRes = await axiosClient.post(`/favourites/remove/${bookID}`);
            return legacyRes.data ?? null;
        }
        throw error;
    }
    // === REFACTOR END: prefer RESTful DELETE endpoint, fallback to legacy POST /remove/{bookID} ===
}

// === REFACTOR START: get current user orders for order page tabs ===
export const getMyOrders = async () => {
    const res = await axiosClient.get('/orders/me');
    return res.data;
}

export const getMyOrderDetail = async (orderId) => {
    const res = await axiosClient.get(`/orders/me/${orderId}`);
    return res.data;
}

export const requestCancelOrder = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/me/${orderId}/cancel-request`, payload);
    return res.data;
}

export const requestReturnOrder = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/me/${orderId}/return-request`, payload);
    return res.data;
}
// === REFACTOR END: get current user orders for order page tabs ===

// --- ADMIN ORDERS REFACTOR START: admin order management APIs ---
export const getAdminOrders = async ({ page = 0, size = 5, keyword = "", status = "All" } = {}) => {
    const res = await axiosClient.get('/orders/admin', {
        params: {
            page,
            size,
            keyword: keyword?.trim() || undefined,
            status: status || undefined,
        },
    });
    return res.data;
}

export const getAdminOrderDetail = async (orderId) => {
    const res = await axiosClient.get(`/orders/admin/${orderId}`);
    return res.data;
}

export const updateAdminOrderStatus = async (orderId, payload) => {
    const res = await axiosClient.patch(`/orders/admin/${orderId}/status`, payload);
    return res.data;
}

export const confirmAdminCancelRequest = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/admin/${orderId}/cancel-request/confirm`, payload);
    return res.data;
}

export const refuseAdminCancelRequest = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/admin/${orderId}/cancel-request/refuse`, payload);
    return res.data;
}

export const confirmAdminReturnRequest = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/admin/${orderId}/return-request/confirm`, payload);
    return res.data;
}

export const refuseAdminReturnRequest = async (orderId, payload = {}) => {
    const res = await axiosClient.patch(`/orders/admin/${orderId}/return-request/refuse`, payload);
    return res.data;
}
// --- ADMIN ORDERS REFACTOR END: admin order management APIs ---

// --- ADMIN BOOK MANAGEMENT START: admin book CRUD/list/options APIs ---
export const getAdminBooks = async ({
    page = 0,
    size = 10,
    keyword = "",
    categoryId,
    authorId,
    includeDeleted = false,
} = {}) => {
    const res = await axiosClient.get("/admin/books", {
        params: {
            page,
            size,
            keyword: keyword?.trim() || undefined,
            categoryId: categoryId || undefined,
            authorId: authorId || undefined,
            includeDeleted,
        },
    });
    return res.data;
};

export const getAdminBookDetail = async (bookId) => {
    const res = await axiosClient.get(`/admin/books/${bookId}`);
    return res.data;
};

export const getAdminBookOptions = async () => {
    const res = await axiosClient.get("/admin/books/options");
    return res.data;
};

export const createAdminBook = async (payload) => {
    const res = await axiosClient.post("/admin/books", payload);
    return res.data;
};

export const updateAdminBook = async (bookId, payload) => {
    const res = await axiosClient.put(`/admin/books/${bookId}`, payload);
    return res.data;
};

export const deleteAdminBook = async (bookId) => {
    const res = await axiosClient.delete(`/admin/books/${bookId}`);
    return res.data ?? null;
};
// --- ADMIN BOOK MANAGEMENT END: admin book CRUD/list/options APIs ---

// --- ADMIN CATEGORY MANAGEMENT START: admin category CRUD/list/options APIs ---
export const getAdminCategories = async ({
    page = 0,
    size = 10,
    keyword = "",
    includeDeleted = false,
} = {}) => {
    const res = await axiosClient.get("/admin/categories", {
        params: {
            page,
            size,
            keyword: keyword?.trim() || undefined,
            includeDeleted,
        },
    });
    return res.data;
};

export const getAdminCategoryDetail = async (categoryId) => {
    const res = await axiosClient.get(`/admin/categories/${categoryId}`);
    return res.data;
};

export const getAdminCategoryOptions = async () => {
    const res = await axiosClient.get("/admin/categories/options");
    return res.data;
};

export const createAdminCategory = async (payload) => {
    const res = await axiosClient.post("/admin/categories", payload);
    return res.data;
};

export const updateAdminCategory = async (categoryId, payload) => {
    const res = await axiosClient.put(`/admin/categories/${categoryId}`, payload);
    return res.data;
};

export const deleteAdminCategory = async (categoryId) => {
    const res = await axiosClient.delete(`/admin/categories/${categoryId}`);
    return res.data ?? null;
};
// --- ADMIN CATEGORY MANAGEMENT END: admin category CRUD/list/options APIs ---

// --- ADMIN USER MANAGEMENT START: admin user CRUD/list/options APIs ---
export const getAdminUsers = async ({
    page = 0,
    size = 10,
    keyword = "",
    role,
    isActive,
    isDeleted,
} = {}) => {
    const res = await axiosClient.get("/admin/users", {
        params: {
            page,
            size,
            keyword: keyword?.trim() || undefined,
            role: role || undefined,
            isActive: typeof isActive === "boolean" ? isActive : undefined,
            isDeleted: typeof isDeleted === "boolean" ? isDeleted : undefined,
        },
    });
    return res.data;
};

export const getAdminUserDetail = async (userId) => {
    const res = await axiosClient.get(`/admin/users/${userId}`);
    return res.data;
};

export const getAdminUserOptions = async () => {
    const res = await axiosClient.get("/admin/users/options");
    return res.data;
};

export const createAdminUser = async (payload) => {
    const res = await axiosClient.post("/admin/users", payload);
    return res.data;
};

export const updateAdminUser = async (userId, payload) => {
    const res = await axiosClient.put(`/admin/users/${userId}`, payload);
    return res.data;
};

export const setAdminUserStatus = async (userId, isActive) => {
    const res = await axiosClient.patch(`/admin/users/${userId}/status`, { isActive });
    return res.data;
};

export const softDeleteAdminUser = async (userId) => {
    const res = await axiosClient.patch(`/admin/users/${userId}/soft-delete`);
    return res.data;
};

export const restoreAdminUser = async (userId) => {
    const res = await axiosClient.patch(`/admin/users/${userId}/restore`);
    return res.data;
};
// --- ADMIN USER MANAGEMENT END: admin user CRUD/list/options APIs ---

// === CHECKOUT REFACTOR START: checkout profile APIs (contact + addresses) ===
export const getCheckoutProfile = async () => {
    const res = await axiosClient.get('/checkout/profile');
    return res.data;
}

export const saveCheckoutProfile = async (payload) => {
    const res = await axiosClient.put('/checkout/profile', payload);
    return res.data;
}
// === CHECKOUT REFACTOR END: checkout profile APIs (contact + addresses) ===

// --- MOMO MIGRATION START: place order before COD completion or MoMo checkout session creation ---
export const placeOrder = async (payload) => {
    const res = await axiosClient.post('/checkout/place-order', payload);
    return res.data;
}

export const createCheckoutSession = async (payload) => {
    const res = await axiosClient.post('/payment/create-checkout-session', payload);
    return res.data;
}
// --- MOMO MIGRATION END: place order before COD completion or MoMo checkout session creation ---
