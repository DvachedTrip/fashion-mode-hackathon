import React from 'react';
import { useCart } from '../components/CartContext';
import styles from '../assets/css/Sidebar.module.css';

export default function Sidebar() {
    const { isCartOpen, closeCart } = useCart();

    return (
        <>
            <div 
                className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""}`} 
                onClick={closeCart}
            />
            <aside className={`${styles["sidebar"]} ${isCartOpen ? styles["open"] : ""}`}>
                <div className={styles["sidebar-header"]}>
                    <h2>YOUR BAG</h2>
                    <button onClick={closeCart} className={styles["close-btn"]}>✕</button>
                </div>
                
                <div className={styles["sidebar-content"]}>
                    <p>Your bag is currently empty.</p>
                </div>

                <div className={styles["sidebar-footer"]}>
                    <button className={styles["checkout-btn"]}>CHECKOUT</button>
                </div>
            </aside>
        </>
    );
}