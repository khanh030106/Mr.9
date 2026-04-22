import {createContext, useCallback, useContext, useState} from "react";
import {getCartAllPages} from "../api/bookApi.js";


const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
    const [cartItem, setCartItem] = useState([]);
    // --- BEGIN FIX: badge = totalElements (Page), không phải length(content) — revert: dùng lại cartItem.length ---
    const [cartCount, setCartCount] = useState(0);
    // --- END FIX: badge = totalElements ---

    //------------------------------CLEAR CART--------------------------
    const clearCart = useCallback(() => {
        setCartItem([]);
        setCartCount(0);
    }, []);


    //------------------------------GET CART ITEMS AMOUNT---------------------------
    const refreshCart = useCallback( async () =>{
        try {
            // --- BEGIN FIX: gộp mọi trang giỏ (nhiều hơn 50 dòng) — revert: await getCart() + parse một Page như trước ---
            const res = await getCartAllPages();
            // --- END FIX: gộp trang ---
            // --- BEGIN FIX: backend trả Spring Page { content, totalElements, ... } — revert: setCartItem(Array.isArray(res)?res:[]) ---
            const list = Array.isArray(res) ? res : (res?.content ?? []);
            const total =
                typeof res?.totalElements === "number" ? res.totalElements : list.length;
            setCartItem(list);
            setCartCount(total);
            // --- END FIX: parse Page ---
        }catch (err) {
            if (err.response?.status === 401) {
                setCartItem([]);
                setCartCount(0);
                return;
            }

            throw err;
        }
    }, []);

    return (
        <CartContext.Provider value={{ cartItem, cartCount, refreshCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
