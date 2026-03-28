import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../components/CartContext';
import { useTheme } from '../components/ThemeContext'; 
import styles from '../assets/css/Sidebar.module.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/ai/chat';

export default function Sidebar() {
    const { isCartOpen, closeCart } = useCart();
    const { theme } = useTheme(); 
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Состояния для модального окна виртуальной примерки
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Автоматическая прокрутка чата вниз
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Инициализация сессии чата с проверкой на валидность
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

    // Обработка загрузки фото
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUserPhoto(URL.createObjectURL(file));
        }
    };

    // Отправка сообщения
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
            {/* Оверлей */}
            <div 
                className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""} ${theme === 'dark' ? styles.dark : styles.light}`} 
                onClick={closeCart}
            />
            
            {/* Модальное окно примерки */}
            {isTryOnModalOpen && (
                <div className={`${styles["tryon-modal-overlay"]} ${theme === 'dark' ? styles.dark : styles.light}`}>
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
                                        <p>Кликните чтобы добавить</p>
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
                                СГЕНЕРИРОВАТЬ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Сайдбар */}
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

// import React, { useState, useEffect, useRef } from 'react';
// import { useCart } from '../components/CartContext';
// import { useTheme } from '../components/ThemeContext'; // 1. Импортируем хук темы
// import styles from '../assets/css/Sidebar.module.css';

// const API_BASE_URL = 'http://127.0.0.1:8000/api/ai/chat';

// export default function Sidebar() {
//     const { isCartOpen, closeCart } = useCart();
//     const { theme } = useTheme(); // 2. Достаем текущую тему (light/dark)
//     const [message, setMessage] = useState("");
//     const [messages, setMessages] = useState([]);
//     const [sessionId, setSessionId] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
    
//     const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
//     const [userPhoto, setUserPhoto] = useState(null);
    
//     const messagesEndRef = useRef(null);
//     const fileInputRef = useRef(null);

//     // Скролл вниз
//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages, isLoading]);

//     // Инициализация чата (без изменений...)
//     useEffect(() => {
//         const initSession = async () => {
//             let currentSessionId = localStorage.getItem('chatSessionId');
//             if (!currentSessionId) {
//                 try {
//                     const res = await fetch(`${API_BASE_URL}/sessions/`, { method: 'POST' });
//                     if (res.ok) {
//                         const data = await res.json();
//                         currentSessionId = data.session_key;
//                         localStorage.setItem('chatSessionId', currentSessionId);
//                         setSessionId(currentSessionId);
//                         setMessages([{ role: 'assistant', text: 'Привет! Я твой персональный ИИ-стилист.' }]);
//                     }
//                 } catch (e) { console.error(e); }
//             } else {
//                 setSessionId(currentSessionId);
//             }
//         };
//         if (isCartOpen && !sessionId) initSession();
//     }, [isCartOpen, sessionId]);

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         const text = message.trim();
//         if (!text || !sessionId || isLoading) return;
//         setMessages(prev => [...prev, { role: 'user', text: text }]);
//         setMessage("");
//         setIsLoading(true);
//         // ... логика fetch ...
//         setIsLoading(false);
//     };

//     return (
//         <>
//             {/* Оверлей — теперь его цвет тоже зависит от темы */}
//             <div 
//                 className={`${styles["overlay"]} ${isCartOpen ? styles["active"] : ""} ${theme === 'dark' ? styles.dark : styles.light}`} 
//                 onClick={closeCart}
//             />
            
//             {/* Модальное окно — добавляем класс темы */}
//             {isTryOnModalOpen && (
//                 <div className={`${styles["tryon-modal-overlay"]} ${theme === 'dark' ? styles.dark : styles.light}`}>
//                     <div className={styles["tryon-modal"]}>
//                         <div className={styles["modal-header"]}>
//                             <h3>VIRTUAL TRY-ON</h3>
//                             <button onClick={() => setIsTryOnModalOpen(false)}>✕</button>
//                         </div>
//                         <div className={styles["modal-body"]}>
//                             <div className={styles["upload-area"]} onClick={() => fileInputRef.current.click()}>
//                                 {userPhoto ? <img src={userPhoto} className={styles["preview-img"]} /> : "CLICK TO UPLOAD"}
//                             </div>
//                             <input type="file" ref={fileInputRef} hidden onChange={(e) => {
//                                 const file = e.target.files[0];
//                                 if(file) setUserPhoto(URL.createObjectURL(file));
//                             }} />
//                             <button className={styles["generate-btn"]} disabled={!userPhoto}>GENERATE LOOK</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* ОСНОВНОЙ САЙДБАР — добавляем динамический класс темы */}
//             <aside className={`
//                 ${styles["sidebar"]} 
//                 ${isCartOpen ? styles["open"] : ""} 
//                 ${theme === 'dark' ? styles.dark : styles.light}
//             `}>
//                 <div className={styles["sidebar-header"]}>
//                     <h2>AI STYLIST</h2>
//                     <button onClick={closeCart} className={styles["close-btn"]}>✕</button>
//                 </div>
                
//                 <div className={styles["sidebar-content"]}>
//                     <div className={styles["chat-messages"]}>
//                         {messages.map((msg, index) => (
//                             <div key={index} className={msg.role === 'user' ? styles["message-user"] : styles["message-bot"]}>
//                                 <div className={styles["message-text"]}>{msg.text}</div>
//                             </div>
//                         ))}
//                         {isLoading && <div className={styles["typing-indicator"]}>Стилист думает...</div>}
//                         <div ref={messagesEndRef} />
//                     </div>
//                 </div>

//                 <form className={styles["sidebar-footer"]} onSubmit={handleSendMessage}>
//                     <input 
//                         type="text" 
//                         placeholder="Опиши образ..." 
//                         className={styles["chat-input"]}
//                         value={message}
//                         onChange={(e) => setMessage(e.target.value)}
//                     />
//                     <div className={styles["footer-buttons"]}>
//                         <button type="submit" className={styles["send-btn"]}>ОТПРАВИТЬ</button>
//                         <button type="button" className={styles["try-on-main-btn"]} onClick={() => setIsTryOnModalOpen(true)}>
//                             ПРИМЕРИТЬ
//                         </button>
//                     </div>
//                 </form>
//             </aside>
//         </>
//     );
// }