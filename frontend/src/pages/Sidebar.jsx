import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../components/CartContext';
import styles from '../assets/css/Sidebar.module.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/ai/chat';

export default function Sidebar() {
    const { isCartOpen, closeCart } = useCart();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Состояния для модального окна виртуальной примерки
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Функция для прокрутки чата вниз
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Инициализация сессии чата
    useEffect(() => {
        const initSession = async () => {
            let currentSessionId = localStorage.getItem('chatSessionId');
            
            if (!currentSessionId) {
                try {
                    const res = await fetch(`${API_BASE_URL}/sessions/`, { method: 'POST' });
                    if (res.ok) {
                        const data = await res.json();
                        currentSessionId = data.session_key;
                        localStorage.setItem('chatSessionId', currentSessionId);
                        setSessionId(currentSessionId);
                        setMessages([{ 
                            role: 'assistant', 
                            text: 'Привет! Я твой персональный ИИ-стилист. Помочь тебе подобрать образ на сегодня или найти конкретную вещь?' 
                        }]);
                    }
                } catch (error) {
                    console.error("Ошибка при создании сессии:", error);
                }
            } else {
                try {
                    const res = await fetch(`${API_BASE_URL}/sessions/${currentSessionId}/messages/`);
                    if (res.status === 404) {
                        // Stale session — create a fresh one
                        localStorage.removeItem('chatSessionId');
                        currentSessionId = null;
                    } else if (res.ok) {
                        setSessionId(currentSessionId);
                        const data = await res.json();
                        if (data.length > 0) {
                            setMessages(data);
                        } else {
                            setMessages([{ 
                                role: 'assistant', 
                                text: 'Привет! Я твой персональный ИИ-стилист. Помочь тебе подобрать образ на сегодня?' 
                            }]);
                        }
                        return; // session is valid, stop here
                    }
                } catch (error) {
                    console.error("Ошибка при загрузке истории:", error);
                }

                // If we reach here, session was invalid — create a new one
                if (!currentSessionId) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/sessions/`, { method: 'POST' });
                        if (res.ok) {
                            const data = await res.json();
                            currentSessionId = data.session_key;
                            localStorage.setItem('chatSessionId', currentSessionId);
                            setSessionId(currentSessionId);
                            setMessages([{ 
                                role: 'assistant', 
                                text: 'Привет! Я твой персональный ИИ-стилист. Помочь тебе подобрать образ на сегодня или найти конкретную вещь?' 
                            }]);
                        }
                    } catch (error) {
                        console.error("Ошибка при создании новой сессии:", error);
                    }
                }
            }
        };

        if (isCartOpen && !sessionId) {
            initSession();
        }
    }, [isCartOpen, sessionId]);

    // Обработка загрузки фото пользователем
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Отправка текстового сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = message.trim();
        if (!text || !sessionId || isLoading) return;

        const userMsg = { role: 'user', text: text };
        setMessages(prev => [...prev, userMsg]);
        setMessage("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                const assistantMsg = await res.json();
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    text: "Ой, что-то пошло не так при обращении к стилисту." 
                }]);
            }
        } catch (error) {
            console.error("Network error:", error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: "Проблема с сетью или сервером. Попробуйте попозже." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Оверлей для закрытия сайдбара */}
            <div 
                className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""}`} 
                onClick={closeCart}
            />
            
            {/* МОДАЛЬНОЕ ОКНО ПРИМЕРКИ */}
            {isTryOnModalOpen && (
                <div className={styles["tryon-modal-overlay"]}>
                    <div className={styles["tryon-modal"]}>
                        <div className={styles["modal-header"]}>
                            <h3>VIRTUAL TRY-ON</h3>
                            <button onClick={() => setIsTryOnModalOpen(false)}>✕</button>
                        </div>
                        <div className={styles["modal-body"]}>
                            <p>Загрузите свое фото в полный рост для генерации образа</p>
                            
                            <div 
                                className={styles["upload-area"]} 
                                onClick={() => fileInputRef.current.click()}
                            >
                                {userPhoto ? (
                                    <img src={userPhoto} alt="User preview" className={styles["preview-img"]} />
                                ) : (
                                    <div className={styles["upload-placeholder"]}>
                                        <span>+</span>
                                        <p>Click to upload</p>
                                    </div>
                                )}
                            </div>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoUpload} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                            
                            <button 
                                className={styles["generate-btn"]}
                                disabled={!userPhoto}
                                onClick={() => alert("Генерация образа на основе вашего фото...")}
                            >
                                GENERATE LOOK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ОСНОВНОЙ САЙДБАР */}
            <aside className={`${styles["sidebar"]} ${isCartOpen ? styles["open"] : ""}`}>
                <div className={styles["sidebar-header"]}>
                    <h2>AI STYLIST</h2>
                    <button onClick={closeCart} className={styles["close-btn"]}>✕</button>
                </div>
                
                <div className={styles["sidebar-content"]}>
                    <div className={styles["chat-messages"]}>
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={msg.role === 'user' ? styles["message-user"] : styles["message-bot"]}
                            >
                                <div className={styles["message-text"]}>{msg.text}</div>
                                
                                {msg.products && msg.products.length > 0 && (
                                    <div className={styles["product-list"]}>
                                        {msg.products.map(p => {
                                            const imgUrl = p.main_image_url?.startsWith('http') 
                                                ? p.main_image_url 
                                                : `http://127.0.0.1:8000${p.main_image_url}`;
                                                
                                            return (
                                                <div key={p.id} className={styles["product-card"]}>
                                                    <img 
                                                        src={imgUrl} 
                                                        alt={p.name} 
                                                        className={styles["product-image"]} 
                                                        onError={(e) => { 
                                                            e.target.src = 'https://via.placeholder.com/60x75/f0f0f0/666666?text=No+Photo'; 
                                                        }}
                                                    />
                                                    <div className={styles["product-info"]}>
                                                        <span className={styles["product-name"]}>{p.brand} {p.name}</span>
                                                        <span className={styles["product-price"]}>
                                                            {parseFloat(p.price).toLocaleString('ru-RU')} ₽
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles["typing-indicator"]}>Стилист подбирает образ...</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* ФУТЕР С КНОПКАМИ */}
                <form className={styles["sidebar-footer"]} onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        placeholder="Опиши образ, который хочешь..." 
                        className={styles["chat-input"]}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className={styles["footer-buttons"]}>
                        <button 
                            type="submit" 
                            className={styles["send-btn"]} 
                            disabled={isLoading || !message.trim()}
                        >
                            {isLoading ? "..." : "ОТПРАВИТЬ"}
                        </button>
                        
                        <button 
                            type="button" 
                            className={styles["try-on-main-btn"]}
                            onClick={() => setIsTryOnModalOpen(true)}
                        >
                            ПРИМЕРИТЬ
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}