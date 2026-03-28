import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from '../assets/css/Shop.module.css';
import { useTheme } from '../components/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products';

// Варианты анимации "Призрака"
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

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error categories:", err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let url = selectedCategory ? `${API_BASE_URL}/?category=${selectedCategory}` : `${API_BASE_URL}/`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => setProducts(data.results || data))
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

  return (
    <div className={`${styles.wrapperShop} ${theme === 'dark' ? styles.dark : styles.light}`}>

      <section className={styles.heroSection}>
        {/* Левая панель с заголовком */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBgImage1}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.mainTitle}>COMPLETE THE LOOK</h1>
            <div className={styles.paginationSimple}>
              <span className={styles.activePage}>[01]</span>
              <span>[02]</span>
            </div>
          </div>
        </div>

        {/* Правая панель с акцентным фото */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBgImage2}></div>
          <div className={styles.badgeSale}>Sale</div>
          <div className={styles.heroProductInfo}>
            <span className={styles.heroProductName}>LOULOU STUDIO TANIA SHOULDER BAG</span>
            <span className={styles.heroProductPrice}>
              <del>$665.00</del> $333.00
            </span>
          </div>
        </div>
        
        {/* Крайняя правая панель (опционально для сетки 3 колонки как на скрине) */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBgImage3}></div>
          <div className={styles.heroProductInfo}>
            <span className={styles.heroProductName}>GIA BORGHINI X HEIDI BIVENS HUNTER</span>
            <span className={styles.heroProductPrice}>$415.00</span>
          </div>
        </div>
      </section>
      
      <section className={styles.heroTitle}>
        <h2>КАТАЛОГ ОДЕЖДЫ</h2>
      </section>

      {/* Filters */}
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

      {/* Product Grid */}
      <main className={styles.productGrid}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.statusMessage}>
              Loading collection...
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.statusMessage}>
              No products found.
            </motion.div>
          ) : (
            <motion.div 
              key={selectedCategory || 'all'}
              className={styles.gridInner} 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {products.map((product) => {
                const imgUrl = product.main_image_url?.startsWith('http') 
                    ? product.main_image_url 
                    : `http://127.0.0.1:8000${product.main_image_url || ''}`;

                return (
                  <motion.div key={product.id} variants={ghostVariants}>
                    <Link to={`/info/${product.id}`} className={styles.productCard}>
                      <div className={styles.imageContainer}>
                        <img 
                          src={imgUrl} 
                          alt={product.name}
                          className={styles.productImage}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1200/f0f0f0/666666?text=No+Photo'; }}
                        />
                        {product.id <= 3 && <div className={styles.badge}>New in</div>}
                      </div>
                      <div className={styles.productInfo}>
                        <h3 className={styles.productName}>{product.brand} {product.name}</h3>
                        <span className={styles.productPrice}>
                          {parseFloat(product.price).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}