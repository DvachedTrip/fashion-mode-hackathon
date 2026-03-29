import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../assets/css/Info.module.css';
// Импортируем стили магазина для сетки товаров внизу
import shopStyles from '../assets/css/Shop.module.css'; 
import sidebarStyles from '../assets/css/Sidebar.module.css';
import { useTheme } from '../components/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products';
const TRYON_API_URL = 'http://127.0.0.1:8000/api/ai/tryon/';

export default function Info() {
  const { id } = useParams();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]); // Состояние для других товаров
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [mainImage, setMainImage] = useState('');

  // Try-on state
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoFile, setUserPhotoFile] = useState(null);
  const [tryOnStatus, setTryOnStatus] = useState('idle');
  const [tryOnResult, setTryOnResult] = useState(null);
  const [tryOnError, setTryOnError] = useState(null);
  
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // cleanup polling
  useEffect(() => {
      return () => {
          if (pollingRef.current) {
              clearInterval(pollingRef.current);
          }
      };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    fetch(`${API_BASE_URL}/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        
        const getImageUrl = (url) => {
          if (!url) return '';
          return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
        };

        // ПРИОРЕТЕТ: 
        // 1. Главное фото (is_main)
        // 2. Первое фото из массива images
        // 3. Прямая ссылка main_image_url (если есть в API)
        const mainImgObj = data.images?.find(img => img.is_main) || data.images?.[0];
        const fallbackUrl = data.main_image_url;

        if (mainImgObj) {
          setMainImage(getImageUrl(mainImgObj.image));
        } else if (fallbackUrl) {
          setMainImage(getImageUrl(fallbackUrl));
        }

        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load product details", err);
        setLoading(false);
      });
  }, [id]);

// 2. Загрузка рекомендаций (других товаров) со случайной сортировкой
  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then(res => res.json())
      .then(data => {
        const allProducts = data.results || data;
        
        // 1. Убираем текущий товар из списка
        // 2. Перемешиваем массив случайным образом
        // 3. Берем первые 4 товара
        const randomRecommendations = allProducts
          .filter(item => String(item.id) !== String(id))
          .sort(() => Math.random() - 0.5) 
          .slice(0, 4);

        setRecommendations(randomRecommendations);
      })
      .catch(err => console.error("Error loading recommendations:", err));
  }, [id]); // Массив зависимостей [id] заставит код сработать при смене товара

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          setUserPhoto(URL.createObjectURL(file));
          setUserPhotoFile(file);
      }
  };

  const openTryOnModal = () => {
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
      if (!userPhotoFile || !product) return;
      
      let sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
          sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('chatSessionId', sessionId);
      }
      
      setTryOnStatus('uploading');
      setTryOnError(null);
      
      const formData = new FormData();
      formData.append('session_key', sessionId);
      formData.append('user_photo', userPhotoFile);
      formData.append('product_ids', product.id);

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

  const renderTryOnModalContent = () => {
      if (tryOnStatus === 'done' && tryOnResult) {
          return (
              <div className={sidebarStyles["result-container"]}>
                  <div className={sidebarStyles["result-badge"]}>ОБРАЗ ГОТОВ</div>
                  <img src={tryOnResult} alt="Результат примерки" className={sidebarStyles["result-img"]} />
                  
                  <div className={sidebarStyles["modal-actions"]}>
                      <button 
                          className={sidebarStyles["generate-btn"]}
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
                          className={sidebarStyles["download-btn"]}
                      >
                          СКАЧАТЬ
                      </a>
                  </div>
              </div>
          );
      }

      if (tryOnStatus === 'uploading' || tryOnStatus === 'processing') {
          return (
              <div className={sidebarStyles["processing-container"]}>
                  <div className={sidebarStyles["processing-animation"]}>
                      <div className={sidebarStyles["spinner"]} />
                  </div>
                  <p className={sidebarStyles["processing-text"]}>
                      {tryOnStatus === 'uploading' ? 'ЗАГРУЖАЕМ ОБРАЗ...' : 'ГЕНЕРИРУЕМ ОБРАЗ...'}
                  </p>
                  <p className={sidebarStyles["processing-steps"]}>
                      1 вещь в образе
                  </p>
                  <p className={sidebarStyles["processing-hint"]}>
                      Это может занять до 2 минут
                  </p>
              </div>
          );
      }

      if (tryOnStatus === 'failed') {
          return (
              <div className={sidebarStyles["processing-container"]}>
                  <div className={sidebarStyles["tryon-error"]}>
                      {tryOnError || 'Произошла ошибка при генерации'}
                  </div>
                  <div className={sidebarStyles["modal-actions"]}>
                      <button 
                          className={sidebarStyles["generate-btn"]}
                          onClick={() => {
                              setTryOnStatus('idle');
                              setTryOnError(null);
                          }}
                      >
                          ПОПРОБОВАТЬ СНОВА
                      </button>
                  </div>
              </div>
          );
      }

      const imgUrl = product.images?.find(img => img.is_main)?.image || product.main_image_url || '';
      const fullImgUrl = imgUrl.startsWith('http') ? imgUrl : `http://127.0.0.1:8000${imgUrl}`;

      return (
          <>
              <div className={sidebarStyles["modal-products"]}>
                  <p className={sidebarStyles["modal-label"]}>Элементы образа</p>
                  <div className={sidebarStyles["modal-product-list"]}>
                      <div key={product.id} className={sidebarStyles["modal-product-item"]}>
                          <img 
                              src={fullImgUrl} 
                              alt={product.name}
                              onError={(e) => { 
                                  e.target.src = 'https://via.placeholder.com/70x88/f0f0f0/666666?text=No+Photo'; 
                              }}
                          />
                          <span>{product.brand} {product.name}</span>
                      </div>
                  </div>
              </div>

              <p>Загрузите свое фото в полный рост</p>
              
              <div 
                  className={sidebarStyles["upload-area"]} 
                  onClick={() => fileInputRef.current.click()}
              >
                  {userPhoto ? (
                      <img src={userPhoto} alt="Превью" className={sidebarStyles["preview-img"]} />
                  ) : (
                      <div className={sidebarStyles["upload-placeholder"]}>
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
                  <div className={sidebarStyles["tryon-error"]}>
                      {tryOnError}
                  </div>
              )}
              
              <div className={sidebarStyles["modal-actions"]}>
                  <button 
                      className={sidebarStyles["generate-btn"]}
                      disabled={!userPhoto}
                      onClick={startTryOn}
                  >
                      ПРИМЕРИТЬ ОБРАЗ
                  </button>
                  {userPhoto && (
                      <a 
                          href={userPhoto} 
                          download="original_photo.jpg" 
                          className={sidebarStyles["download-btn"]}
                      >
                          ↓
                      </a>
                  )}
              </div>
          </>
      );
  };

  if (loading) return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Загрузка...</div>;
  if (!product) return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Не найдено.</div>;

  return (
    <>
      {isTryOnModalOpen && (
          <div className={`${sidebarStyles["tryon-modal-overlay"]} ${theme === 'dark' ? sidebarStyles.dark : sidebarStyles.light}`}>
              <div className={sidebarStyles["tryon-modal"]}>
                  <div className={sidebarStyles["modal-header"]}>
                      <h3>VIRTUAL TRY-ON</h3>
                      <button onClick={closeTryOnModal}>✕</button>
                  </div>
                  <div className={sidebarStyles["modal-body"]}>
                      {renderTryOnModalContent()}
                  </div>
              </div>
          </div>
      )}
    <div className={styles.wrapper}>
      {/* ... ВЕРХНЯЯ ЧАСТЬ (Хлебные крошки и Контейнер товара) остается БЕЗ ИЗМЕНЕНИЙ ... */}
      <nav className={styles.breadcrumb}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Каталог / </Link>
        {product.category && product.category.name}
      </nav>

      <div className={styles.container}>
        {/* Код левой, средней и правой колонок (как у тебя в примере) */}
        <div className={styles.leftCol}>
            <h1 className={styles.title}>{product.brand} {product.name}</h1>
            <p className={styles.price}>
                {parseFloat(product.price).toLocaleString('ru-RU')} ₸
            </p>
            <div className={styles.tabs}><button className={styles.activeTab}>ДЕТАЛИ</button></div>
            <div className={styles.detailsSection}>
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#b0b0b0', marginTop: '15px' }}>{product.description}</p>
            </div>
        </div>

        <div className={styles.midCol}>
            <div className={styles.mainImageWrapper}>
                <AnimatePresence mode="wait"> {/* Гарантирует, что старая картинка исчезнет до появления новой */}
                    <motion.img 
                        // 1. Уникальный key — КРИТИЧЕСКИ ВАЖНО для анимации смены
                        key={mainImage} 
                        src={mainImage} 
                        alt={product.name}
                        
                        // 2. Настройка анимации Framer Motion
                        initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }} // Начало смены
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} // Конец смены (видима)
                        exit={{ opacity: 0, scale: 1.02, filter: 'blur(3px)' }} // Уход старой картинки
                        
                        // 3. Параметры перехода (Плавность)
                        transition={{ 
                            duration: 0.4, // Скорость анимации (0.4с)
                            ease: [0.16, 1, 0.3, 1] // Кастомная кривая 'easeOutExpo' для мягкости
                        }}
                        
                        // Защита от битых путей
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x1200?text=Image+Not+Found';
                        }}
                    />
                </AnimatePresence>
            </div>
        </div>

        <div className={styles.rightCol}>
          {/* 1. Блок миниатюр (Thumbnails) — уже есть на макете */}
          <div className={styles.thumbnails}>
            {product.images?.map((img) => {
              const fullUrl = img.image.startsWith('http') ? img.image : `http://127.0.0.1:8000${img.image}`;
              return (
              <img 
                key={img.id} 
                src={fullUrl} 
                alt="thumb" 
                onClick={() => setMainImage(fullUrl)}
                style={{ 
                    cursor: 'pointer', 
                    opacity: mainImage.includes(img.image) ? 1 : 0.4,
                    transition: 'opacity 0.2s'
                }}
              />
            )})}
          </div>

          {/* 2. НОВЫЙ БЛОК: ВЫБОР ПАРАМЕТРОВ (между фото и кнопками) */}
          <div className={styles.selectionArea}>
            
            {/* Выбор цвета (если есть цвета в API) */}
            {product.color && (
              <div className={styles.colorPicker}>
                <p>ЦВЕТ: <span>{product.color.name || 'Standard'}</span></p>
                <div 
                  className={styles.colorBox} 
                  style={{ 
                    backgroundColor: product.color.hex_code || '#000', 
                    border: '1px solid #555' 
                  }}
                ></div>
              </div>
            )}

            {/* Выбор размера (если есть размеры в API) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className={styles.sizeSelection}>
                <div className={styles.sizeHeader}>
                  <p>ВЫБРАТЬ РАЗМЕР:</p>
                  <a href="#" className={styles.sizeGuide} onClick={(e) => e.preventDefault()}>ТАБЛИЦА РАЗМЕРОВ</a>
                </div>
                <div className={styles.sizeGrid}>
                  {product.sizes.map(sizeObj => (
                    <button 
                      key={sizeObj.id}
                      className={`${styles.sizeBtn} ${selectedSize === sizeObj.size ? styles.selectedSize : ''}`}
                      onClick={() => setSelectedSize(sizeObj.size)}
                      disabled={!sizeObj.in_stock}
                      style={{ opacity: sizeObj.in_stock ? 1 : 0.3 }}
                    >
                      {sizeObj.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Блок действий (Кнопки) — уже есть на макете */}
          <div className={styles.actions}>
            <button 
              className={styles.addBagBtn} 
              disabled={!selectedSize}
              onClick={() => alert(`Added ${product.name} (Size: ${selectedSize}) to cart!`)}
            >
              ДОБАВИТЬ В КОРЗИНУ
            </button>
            <button className={styles.wishlistBtn} onClick={openTryOnModal}>ПРИМЕРИТЬ</button>
          </div>
        </div>
      </div>

      {/* НОВАЯ СЕКЦИЯ: РЕКОМЕНДАЦИИ */}
      <section className={shopStyles.heroTitle}>
        <h3>ВАМ ТАКЖЕ МОЖЕТ ПОНРАВИТЬСЯ</h3>
      </section>

      <div className={shopStyles.productGrid}>
        <div className={shopStyles.gridInner}>
          {recommendations.map((item) => {
            const imgUrl = item.main_image_url?.startsWith('http') 
              ? item.main_image_url 
              : `http://127.0.0.1:8000${item.main_image_url || ''}`;

            return (
              <Link to={`/info/${item.id}`} key={item.id} className={shopStyles.productCard}>
                <div className={shopStyles.imageContainer}>
                  <img src={imgUrl} alt={item.name} className={shopStyles.productImage} />
                </div>
                  <div className={shopStyles.productInfo}>
                    <h3 className={shopStyles.productName}>{item.brand} {item.name}</h3>
                    <span className={shopStyles.productPrice}>
                      {parseFloat(item.price).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}