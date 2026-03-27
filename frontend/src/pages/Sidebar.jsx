import React, { useState } from 'react';
import { useCart } from '../components/CartContext';
import styles from '../assets/css/Sidebar.module.css';

export default function Sidebar() {
    const { isCartOpen, closeCart } = useCart();
    const [message, setMessage] = useState("");

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            console.log("Отправлено:", message);
            setMessage(""); // Очистка поля
        }
    };

    return (
        <>
            <div 
                className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""}`} 
                onClick={closeCart}
            />
            <aside className={`${styles["sidebar"]} ${isCartOpen ? styles["open"] : ""}`}>
                <div className={styles["sidebar-header"]}>
                    <h2>RAUM SUPPORT</h2>
                    <button onClick={closeCart} className={styles["close-btn"]}>✕</button>
                </div>
                
                <div className={styles["sidebar-content"]}>
                    <div className={styles["chat-messages"]}>
                        <div className={styles["message-bot"]}>
                            Hello! How can we help you today?
                        </div>
                    </div>
                </div>

                <form className={styles["sidebar-footer"]} onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        placeholder="Type your message..." 
                        className={styles["chat-input"]}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button type="submit" className={styles["send-btn"]}>
                        SEND
                    </button>
                </form>
            </aside>
        </>
    );
}