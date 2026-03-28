import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../components/CartContext';
import { useTheme } from '../components/ThemeContext'; 
import styles from '../assets/css/Sidebar.module.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/ai/chat';
const TRYON_API_URL = 'http://127.0.0.1:8000/api/ai/tryon/';


export default function Sidebar() {
    const { isCartOpen, closeCart } = useCart();
    const { theme } = useTheme(); 
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(true);
    const [tryOnProducts, setTryOnProducts] = useState([]);
    const [userPhoto, setUserPhoto] = useState(null);
    const [userPhotoFile, setUserPhotoFile] = useState(null);
    const [tryOnStatus, setTryOnStatus] = useState('idle');
    const [tryOnResult, setTryOnResult] = useState(null);
    const [tryOnError, setTryOnError] = useState(null);
    const [tryOnItemCount, setTryOnItemCount] = useState(0);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollingRef = useRef(null);

    const formatPrice = (price) => `${parseFloat(price).toLocaleString('ru-RU')} ₸`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const initSession = async () => {
            let currentSessionId = localStorage.getItem('chatSessionId');
            
            const createNewSession = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/sessions/`, { method: 'POST' });
                    if (res.ok) {
                        const data = await res.json();
                        const newId = data.session_key;
                        localStorage.setItem('chatSessionId', newId);
                        setSessionId(newId);
                        setMessages([{ 
                            role: 'assistant', 
                            text: 'Привет! Я твой персональный ИИ-стилист. Помочь тебе подобрать образ на сегодня или найти конкретную вещь?' 
                        }]);
                    }
                } catch (error) {
                    console.error("Ошибка при создании сессии:", error);
                }
            };

            if (!currentSessionId) {
                await createNewSession();
            } else {
                try {
                    const res = await fetch(`${API_BASE_URL}/sessions/${currentSessionId}/messages/`);
                    if (res.status === 404) {
                        localStorage.removeItem('chatSessionId');
                        await createNewSession();
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
                    }
                } catch (error) {
                    console.error("Ошибка при загрузке истории:", error);
                }
            }
        };

        if (isCartOpen && !sessionId) {
            initSession();
        }
    }, [isCartOpen, sessionId]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUserPhoto(URL.createObjectURL(file));
            setUserPhotoFile(file);
        }
    };

    const openTryOnModal = (products) => {
        setTryOnProducts(products);
        setUserPhoto(null);
        setUserPhotoFile(null);
        setTryOnStatus('idle');
        setTryOnResult(null);
        setTryOnError(null);
        setIsTryOnModalOpen(true);
    };

    const closeTryOnModal = () => {
        setIsTryOnModalOpen(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const startTryOn = async () => {
        if (!userPhotoFile || tryOnProducts.length === 0) return;
        
        setTryOnStatus('uploading');
        setTryOnError(null);
        setTryOnItemCount(tryOnProducts.length);
        
        const formData = new FormData();
        formData.append('session_key', sessionId);
        formData.append('user_photo', userPhotoFile);
        tryOnProducts.forEach(p => {
            formData.append('product_ids', p.id);
        });

        try {
            const res = await fetch(TRYON_API_URL, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error_message || 'Ошибка при создании запроса');
            }

            const data = await res.json();
            
            if (data.status === 'done' && data.result_image_url) {
                setTryOnResult(data.result_image_url);
                setTryOnStatus('done');
            } else if (data.status === 'failed') {
                setTryOnError(data.error_message || 'Генерация не удалась');
                setTryOnStatus('failed');
            } else {
                setTryOnStatus('processing');
                startPolling(data.id);
            }
        } catch (error) {
            console.error("TryOn error:", error);
            setTryOnError(error.message);
            setTryOnStatus('failed');
        }
    };

    const startPolling = (requestId) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${TRYON_API_URL}${requestId}/`);
                if (!res.ok) return;
                
                const data = await res.json();
                
                if (data.status === 'done' && data.result_image_url) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setTryOnResult(data.result_image_url);
                    setTryOnStatus('done');
                } else if (data.status === 'failed') {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    setTryOnError(data.error_message || 'Генерация не удалась');
                    setTryOnStatus('failed');
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);
    };

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

    const renderTryOnModalContent = () => {
        if (tryOnStatus === 'done' && tryOnResult) {
            return (
                <div className={styles["result-container"]}>
                    <div className={styles["result-badge"]}>ОБРАЗ ГОТОВ</div>
                    <img src={tryOnResult} alt="Результат примерки" className={styles["result-img"]} />
                    
                    {/* Группа кнопок после генерации */}
                    <div className={styles["modal-actions"]}>
                        <button 
                            className={styles["generate-btn"]}
                            onClick={() => {
                                setTryOnStatus('idle');
                                setTryOnResult(null);
                                setUserPhoto(null);
                                setUserPhotoFile(null);
                            }}
                        >
                            ДРУГОЕ ФОТО
                        </button>
                        <a 
                            href={tryOnResult} 
                            download="ai_look.jpg" 
                            target="_blank" 
                            rel="noreferrer"
                            className={styles["download-btn"]}
                        >
                            СКАЧАТЬ
                        </a>
                    </div>
                </div>
            );
        }

        // ... (код состояний загрузки без изменений)

        return (
            <>
                {/* ... (код списка продуктов без изменений) */}

                <p>Загрузите свое фото в полный рост</p>
                
                <div 
                    className={styles["upload-area"]} 
                    onClick={() => fileInputRef.current.click()}
                >
                    {userPhoto ? (
                        <img src={userPhoto} alt="Превью" className={styles["preview-img"]} />
                    ) : (
                        <div className={styles["upload-placeholder"]}>
                            <span>+</span>
                            <p>Нажмите для загрузки</p>
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

                {tryOnError && (
                    <div className={styles["tryon-error"]}>
                        {tryOnError}
                    </div>
                )}
                
                {/* Группа кнопок в обычном состоянии */}
                <div className={styles["modal-actions"]}>
                    <button 
                        className={styles["generate-btn"]}
                        disabled={!userPhoto}
                        onClick={startTryOn}
                    >
                        ПРИМЕРИТЬ ОБРАЗ
                    </button>
                    {userPhoto && (
                        <a 
                            href={userPhoto} 
                            download="original_photo.jpg" 
                            className={styles["download-btn"]}
                        >
                            ↓
                        </a>
                    )}
                </div>
            </>
        );
    };

    return (
        <>
            <div 
                className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""} ${theme === 'dark' ? styles.dark : styles.light}`} 
                onClick={closeCart}
            />
            
            {isTryOnModalOpen && (
                <div className={`${styles["tryon-modal-overlay"]} ${theme === 'dark' ? styles.dark : styles.light}`}>
                    <div className={styles["tryon-modal"]}>
                        <div className={styles["modal-header"]}>
                            <h3>VIRTUAL TRY-ON</h3>
                            <button onClick={closeTryOnModal}>✕</button>
                        </div>
                        <div className={styles["modal-body"]}>
                            {renderTryOnModalContent()}
                        </div>
                    </div>
                </div>
            )}

            <aside className={`
                ${styles["sidebar"]} 
                ${isCartOpen ? styles["open"] : ""} 
                ${theme === 'dark' ? styles.dark : styles.light}
            `}>
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
                                    <>
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
                                                                {formatPrice(p.price)}Т
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button 
                                            className={styles["tryon-btn"]}
                                            onClick={() => openTryOnModal(msg.products)}
                                        >
                                            <span className={styles["tryon-btn-icon"]}>👗</span>
                                            ПРИМЕРИТЬ ОБРАЗ
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles["typing-indicator"]}>Стилист подбирает образ...</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

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
                    </div>
                </form>
            </aside>
        </>
    );
}