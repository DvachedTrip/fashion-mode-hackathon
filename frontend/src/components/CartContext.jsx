
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const closeCart = () => setIsCartOpen(false);

    return (
        <CartContext.Provider value={{ isCartOpen, toggleCart, closeCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);