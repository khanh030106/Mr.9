import {createContext, useCallback, useContext, useState} from "react";
import {getCartAllPages} from "../api/bookApi.js";


const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
    const [cartItem, setCartItem] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    //------------------------------CLEAR CART--------------------------
    const clearCart = useCallback(() => {
        setCartItem([]);
        setCartCount(0);
    }, []);


    //------------------------------GET CART ITEMS AMOUNT---------------------------
    const refreshCart = useCallback( async () =>{
        try {
            const res = await getCartAllPages();
            const list = Array.isArray(res) ? res : (res?.content ?? []);
            const total =
                typeof res?.totalElements === "number" ? res.totalElements : list.length;
            setCartItem(list);
            setCartCount(total);
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
