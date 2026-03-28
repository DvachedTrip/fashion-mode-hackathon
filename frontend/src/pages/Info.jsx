import React, { useState } from 'react';
import styles from '../assets/css/Info.module.css';

export default function Info() {
  const [selectedSize, setSelectedSize] = useState('M');

  const details = [
    "Black color", "Lightweight satin fabric", "Relaxed fit",
    "Notch lapels", "Padded shoulders", "Single welt breast pocket",
    "Button cuffs", "Front flap pockets", "Front button closure",
    "58% Viscose 42% Modal"
  ];

  return (
    <div className={styles.wrapper}>

      {/*ОБЯЗАТЕЛЬНО ПОМЕНЯТЬ*/}
      <nav className={styles.breadcrumb}>
        Catalog / Outerwear / Blazers
      </nav>

      <div className={styles.container}>
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className={styles.leftCol}>
          <h1 className={styles.title}>NAAZ BLAZER</h1>
          <p className={styles.price}>$319.00</p>

          <div className={styles.detailsSection}>
            <h3>DETAILS</h3>
            <ul>
              {details.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
            <a href="#" className={styles.sizeGuideLink}>Size guide</a>
          </div>

          <div className={styles.tabs}>
            <button className={styles.activeTab}>DETAILS</button>
            <button>SIZE & FIT</button>
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА (СЛАЙДЕР) */}
        <div className={styles.midCol}>
          <div className={styles.mainImageWrapper}>
            <button className={styles.navBtn}>←</button>
            <img src="/path-to-your-image.jpg" alt="Naaz Blazer" />
            <button className={styles.navBtn}>→</button>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className={styles.rightCol}>
          <div className={styles.thumbnails}>
            <img src="/thumb1.jpg" alt="" />
            <img src="/thumb2.jpg" alt="" />
            <img src="/thumb3.jpg" alt="" />
            <img src="/thumb4.jpg" alt="" />
          </div>

          <div className={styles.selectionArea}>
            <div className={styles.colorPicker}>
              <p>COLOR: <span>Black</span></p>
              <div className={styles.colorBox}></div>
            </div>

            <div className={styles.sizeSelection}>
              <div className={styles.sizeHeader}>
                <p>SELECT A SIZE:</p>
              </div>
              <div className={styles.sizeGrid}>
                {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size}
                    className={selectedSize === size ? styles.selectedSize : ''}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.addBagBtn}>ADD TO BAG</button>
              <button className={styles.wishlistBtn}>TRY ON</button>
            </div>

            <div className={styles.extraLinks}>
              <a>Check in-store availability</a>
              <a>@2026</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
