import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../assets/css/Info.module.css';
// Импортируем стили магазина для сетки товаров внизу
import shopStyles from '../assets/css/Shop.module.css'; 
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products';

export default function Info() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]); // Состояние для других товаров
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [mainImage, setMainImage] = useState('');

  // 1. Загрузка основного товара
  useEffect(() => {
    window.scrollTo(0, 0); // Прокрутка вверх при переходе на новый товар
    fetch(`${API_BASE_URL}/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        const getImageUrl = (url) => {
            if (!url) return '';
            return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
        };
        const mainImg = data.images?.find(img => img.is_main);
        setMainImage(mainImg ? getImageUrl(mainImg.image) : getImageUrl(data.images?.[0]?.image));
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

  if (loading) return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Загрузка...</div>;
  if (!product) return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Не найдено.</div>;

  return (
    <div className={styles.wrapper}>
      {/* ... ВЕРХНЯЯ ЧАСТЬ (Хлебные крошки и Контейнер товара) остается БЕЗ ИЗМЕНЕНИЙ ... */}
      <nav className={styles.breadcrumb}>
        <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Каталог / </Link>
        {product.category && product.category.name}
      </nav>

      <div className={styles.container}>
        {/* Код левой, средней и правой колонок (как у тебя в примере) */}
        <div className={styles.leftCol}>
            <h1 className={styles.title}>{product.brand} {product.name}</h1>
            <p className={styles.price}>{parseFloat(product.price).toLocaleString('ru-RU')} ₽</p>
            <div className={styles.detailsSection}>
                <h3>ДЕТАЛИ</h3>
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#b0b0b0', marginTop: '15px' }}>{product.description}</p>
            </div>
            <div className={styles.tabs}><button className={styles.activeTab}>ДЕТАЛИ</button></div>
        </div>

        <div className={styles.midCol}>
            <div className={styles.mainImageWrapper}>
                <img src={mainImage} alt={product.name} />
            </div>
        </div>

        <div className={styles.rightCol}>
            {/* Thumbnails, Size Selection, Actions (Твой текущий код) */}
            <div className={styles.thumbnails}>
                {product.images?.map((img) => (
                    <img 
                        key={img.id} 
                        src={img.image.startsWith('http') ? img.image : `http://127.0.0.1:8000${img.image}`} 
                        alt="thumb" 
                        onClick={() => setMainImage(img.image.startsWith('http') ? img.image : `http://127.0.0.1:8000${img.image}`)}
                    />
                ))}
            </div>
            <div className={styles.selectionArea}>
                {/* ... Блок выбора размера и кнопки ... */}
                <div className={styles.actions}>
                    <button className={styles.addBagBtn} disabled={!selectedSize}>ДОБАВИТЬ В КОРЗИНУ</button>
                    <button className={styles.wishlistBtn}>ПРИМЕРИТЬ</button>
                </div>
            </div>
        </div>
      </div>

      {/* НОВАЯ СЕКЦИЯ: РЕКОМЕНДАЦИИ */}
      <section className={shopStyles.heroTitle} style={{ borderTop: '1px solid var(--border-color)', marginTop: '80px' }}>
        <h2>ВАМ ТАКЖЕ МОЖЕТ ПОНРАВИТЬСЯ</h2>
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
                    {parseFloat(item.price).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}