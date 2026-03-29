import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from '../assets/css/Shop.module.css';
import { useTheme } from '../components/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

import Footer from '../pages/Footer'

const API_BASE_URL = 'http://127.0.0.1:8000/api/products';

const ghostVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    filter: 'blur(10px)', 
    transition: { duration: 0.3 } 
  }
};

export default function Shop() {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Создаем отдельный стейт для ГЕРО-фотографий
  const [heroProducts, setHeroProducts] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const flattenCategories = (cats) => {
    const result = [];
    const traverse = (items) => {
      for (const cat of items) {
        result.push({ id: cat.id, name: cat.name, slug: cat.slug });
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      }
    };
    traverse(cats);
    return result;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/`)
      .then(res => res.json())
      .then(data => setCategories(flattenCategories(data)))
      .catch(err => console.error("Error categories:", err));
    
    // 2. Загружаем товары для Hero ОДИН РАЗ при загрузке страницы
    fetch(`${API_BASE_URL}/`)
      .then(res => res.json())
      .then(data => {
        const items = data.results || data;
        setHeroProducts(items); // Эти данные больше не будут меняться при кликах
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const baseUrl = selectedCategory ? `${API_BASE_URL}/?category=${selectedCategory}` : `${API_BASE_URL}/`;
    
    const fetchAllProducts = async () => {
      let allProducts = [];
      let url = baseUrl;
      try {
        while (url) {
          const res = await fetch(url);
          const data = await res.json();
          const items = data.results || data;
          allProducts = [...allProducts, ...items];
          url = data.next || null;
        }
        setProducts(allProducts);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllProducts();
  }, [selectedCategory]);

  // 3. Таймер теперь работает только с heroProducts и не зависит от фильтров
  useEffect(() => {
    if (heroProducts.length < 2) return;

    const interval = setInterval(() => {
      setHeroIndex((prevIndex) => {
        const nextIndex = prevIndex + 2;
        return nextIndex >= heroProducts.length ? 0 : nextIndex;
      });
    }, 120000); // 2 минуты

    return () => clearInterval(interval);
  }, [heroProducts.length]);

  return (
    <div className={`${styles.wrapperShop} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <Footer />

      <section className={styles.heroSection}>
        <div className={styles.heroPanel}>
          <div className={styles.heroBgImage1}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.mainTitle}>ВЫБЕРИТЕ СВОЙ ОБРАЗ</h1>
          </div>
        </div>

        {/* 4. Используем heroProducts вместо products — анимация только при смене по таймеру */}
        <div className={styles.heroPanel}>
          <AnimatePresence mode="wait">
            {heroProducts[heroIndex] ? (
              <motion.div
                key={`hero-1-${heroProducts[heroIndex].id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Link to={`/info/${heroProducts[heroIndex].id}`} className={styles.heroProductCard}>
                  <div className={styles.heroBgImage2}>
                    <img 
                      src={heroProducts[heroIndex].main_image_url?.startsWith('http') 
                        ? heroProducts[heroIndex].main_image_url 
                        : `http://127.0.0.1:8000${heroProducts[heroIndex].main_image_url || ''}`} 
                      alt={heroProducts[heroIndex].name} 
                    />
                  </div>
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        
        <div className={styles.heroPanel}>
          <AnimatePresence mode="wait">
            {heroProducts[heroIndex + 1] ? (
              <motion.div
                key={`hero-2-${heroProducts[heroIndex + 1].id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.3 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Link to={`/info/${heroProducts[heroIndex + 1].id}`} className={styles.heroProductCard}>
                  <div className={styles.heroBgImage3}>
                    <img 
                      src={heroProducts[heroIndex + 1].main_image_url?.startsWith('http') 
                        ? heroProducts[heroIndex + 1].main_image_url 
                        : `http://127.0.0.1:8000${heroProducts[heroIndex + 1].main_image_url || ''}`} 
                      alt={heroProducts[heroIndex + 1].name} 
                    />
                  </div>
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>
      
      {/* КАТАЛОГ ОДЕЖДЫ И ФИЛЬТРЫ — БЕЗ ИЗМЕНЕНИЙ */}
      <section className={styles.heroTitle}>
        <h2>КАТАЛОГ ОДЕЖДЫ</h2>
      </section>

      <section className={styles.filters}>
        <div className={styles.filterLinks}>
          <a href="#" className={!selectedCategory ? styles.active : ''} 
             onClick={(e) => { e.preventDefault(); setSelectedCategory(''); }}>
            Все
          </a>
          {categories.map((cat) => (
            <React.Fragment key={cat.id}>
              <span className={styles.divider}>|</span>
              <a href="#" className={selectedCategory === cat.slug ? styles.active : ''}
                 onClick={(e) => { e.preventDefault(); setSelectedCategory(cat.slug); }}>
                {cat.name}
              </a>
            </React.Fragment>
          ))}
        </div>
      </section>

      <main className={styles.productGrid}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" className={styles.statusMessage}>Загрузка...</motion.div>
          ) : (
            <motion.div 
              key={selectedCategory || 'all'}
              className={styles.gridInner} 
              initial="hidden" animate="visible" exit="exit"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={ghostVariants}>
                  {/* ... ваша карточка товара ... */}
                  <Link to={`/info/${product.id}`} className={styles.productCard}>
                    <div className={styles.imageContainer}>
                      <img 
                        src={product.main_image_url?.startsWith('http') ? product.main_image_url : `http://127.0.0.1:8000${product.main_image_url || ''}`} 
                        alt={product.name}
                        className={styles.productImage}
                      />
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.brand} {product.name}</h3>
                      <span className={styles.productPrice}>{parseFloat(product.price).toLocaleString('ru-RU')} ₸</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}