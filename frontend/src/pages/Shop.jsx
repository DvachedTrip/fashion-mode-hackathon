import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../assets/css/Shop.module.css';
import { useTheme } from '../components/ThemeContext';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products';

export default function Shop() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { theme } = useTheme();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  // Fetch products dynamically based on selected category
  useEffect(() => {
    setIsLoading(true);
    let url = `${API_BASE_URL}/`;
    if (selectedCategory) {
      url += `?category=${selectedCategory}`;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Обработка пагинации от DRF, если есть data.results
        if (data.results) {
          setProducts(data.results);
        } else {
          setProducts(data);
        }
      })
      .catch(err => console.error("Failed to load products", err))
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

  return (
    <div className={`${styles.wrapperShop} ${isDarkMode ? styles.dark : styles.light}`}>
      <section className={styles.heroTitle}>
        <h2>All Clothing</h2>
      </section>

      {/* Filters */}
      <section className={styles.filters}>
        <div className={styles.filterLinks}>
          <a 
            href="#" 
            className={!selectedCategory ? styles.active : ''} 
            onClick={(e) => { e.preventDefault(); setSelectedCategory(''); }}
          >
            All
          </a>
          {categories.map((cat) => (
            <React.Fragment key={cat.id}>
              <span className={styles.divider}>|</span>
              <a 
                href="#" 
                className={selectedCategory === cat.slug ? styles.active : ''}
                onClick={(e) => { e.preventDefault(); setSelectedCategory(cat.slug); }}
              >
                {cat.name}
              </a>
            </React.Fragment>
          ))}
        </div>
        <button className={styles.filterBtn}>
          Filter & Sort <Plus size={14} />
        </button>
      </section>


      {/* Product Grid */}
      <main className={styles.productGrid}>
        {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-color)' }}>
                Loading collection...
            </div>
        ) : products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-color)', fontFamily: 'sans-serif' }}>
                No products found in this category.
            </div>
            // <div className={styles.loaderContainer}>
            //   <div className={styles.loader}></div>
            // </div>
        ) : (
          products.map((product) => {
            const imgUrl = product.main_image_url?.startsWith('http') 
                ? product.main_image_url 
                : `http://127.0.0.1:8000${product.main_image_url || ''}`;

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.imageContainer}>
                  <img 
                    src={imgUrl} 
                    alt={product.name}
                    className={styles.productImage}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1200/f0f0f0/666666?text=No+Photo'; }}
                  />
                  {/* Имитируем бейджик "new" просто для показа (первые 3 товара) */}
                  {product.id <= 3 && (
                    <div className={styles.badge}>
                      New in
                    </div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>
                    {product.brand} {product.name}
                  </h3>
                  <span className={styles.productPrice}>
                    {parseFloat(product.price).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            );
          })
        )}
      </main>




    </div>
  );
}