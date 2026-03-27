import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../assets/css/Shop.module.css';
import { useTheme } from '../components/ThemeContext';

const PRODUCTS = [
  { id: 1, name: "MAVIS OVERSIZED TRENCH", price: "$345.00", image: "https://picsum.photos/seed/fashion1/800/1200", isNew: true },
  { id: 2, name: "NAICA LEATHER JACKET", price: "$595.00", image: "https://picsum.photos/seed/fashion2/800/1200", isNew: true },
  { id: 3, name: "ARLISE TRENCH COAT", price: "$325.00", image: "https://picsum.photos/seed/fashion3/800/1200" },
  { id: 4, name: "ARBOR LEATHER JACKET", price: "$275.00", image: "https://picsum.photos/seed/fashion4/800/1200" },
  { id: 5, name: "PRILLY OVERSIZED SHIRT", price: "$169.00", image: "https://picsum.photos/seed/fashion5/800/1200" },
  { id: 6, name: "BEAUFILLE BAES CROP TOP", price: "$478.00", image: "https://picsum.photos/seed/fashion6/800/1200" },
  { id: 7, name: "ROTATE OVERSIZED T-SHIRT", price: "$90.00", image: "https://picsum.photos/seed/fashion7/800/1200" },
  { id: 8, name: "PELSO BARN JACKET", price: "$255.00", image: "https://picsum.photos/seed/fashion8/800/1200", isNew: true },
  { id: 9, name: "PEORIA SUEDE BLAZER", price: "$275.00", image: "https://picsum.photos/seed/fashion9/800/1200" },
  { id: 10, name: "IVA BLAZER", price: "$469.00", image: "https://picsum.photos/seed/fashion10/800/1200" },
  { id: 11, name: "RAFAELA KNIT SWEATER", price: "$277.00", image: "https://picsum.photos/seed/fashion11/800/1200" },
  { id: 12, name: "JW ANDERSON JUMPER", price: "$750.00", image: "https://picsum.photos/seed/fashion12/800/1200" },
  { id: 13, name: "SHAY TRENCH COAT", price: "$345.00", image: "https://picsum.photos/seed/fashion13/800/1200", isNew: true },
  { id: 14, name: "TORIA COTTON SHIRT", price: "$145.00", image: "https://picsum.photos/seed/fashion14/800/1200" },
  { id: 15, name: "MADISON MINI VELVET DRESS", price: "$245.00", image: "https://picsum.photos/seed/fashion15/800/1200", isNew: true },
  { id: 16, name: "LUNA SILK SLIP DRESS", price: "$195.00", image: "https://picsum.photos/seed/fashion16/800/1200" },
];

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { theme } = useTheme();

  return (
    <div className={`${styles.wrapperShop} ${isDarkMode ? styles.dark : styles.light}`}>
      <section className={styles.heroTitle}>
        <h2>All Clothing</h2>
      </section>

      {/* Filters */}
      <section className={styles.filters}>
        <div className={styles.filterLinks}>
          <a href="#" className={styles.active}>All</a>
          <span className={styles.divider}>|</span>
          <a href="#">Outerwear</a>
          <span className={styles.divider}>|</span>
          <a href="#">Knitwear</a>
          <span className={styles.divider}>|</span>
          <a href="#">Tops</a>
          <span className={styles.divider}>|</span>
          <a href="#">Bottoms</a>
          <span className={styles.divider}>|</span>
          <a href="#">Dresses</a>
          <span className={styles.divider}>|</span>
          <a href="#">Jumpsuits</a>
          <span className={styles.divider}>|</span>
          <a href="#">Loungewear</a>
        </div>
        <button className={styles.filterBtn}>
          Filter & Sort <Plus size={14} />
        </button>
      </section>

      {/* Product Grid */}
      <main className={styles.productGrid}>
        {PRODUCTS.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.imageContainer}>
              <img 
                src={product.image} 
                alt={product.name}
                className={styles.productImage}
                referrerPolicy="no-referrer"
              />
              {product.isNew && (
                <div className={styles.badge}>
                  New in
                </div>
              )}
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>
                {product.name}
              </h3>
              <span className={styles.productPrice}>
                {product.price}
              </span>
            </div>
          </div>
        ))}
      </main>

      {/* Footer Pagination */}
      <footer className={styles.footer}>
        <button className={styles.viewMoreBtn}>
          View More Items
        </button>
        
        <div className={styles.pagination}>
          <button className={styles.iconBtn} disabled>
            <ChevronLeft size={16} />
          </button>
          <div className={styles.pageNumbers}>
            <span className={styles.active}>1</span>
            <span>2</span>
            <span>3</span>
            <span>...</span>
            <span>7</span>
          </div>
          <button className={styles.iconBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}