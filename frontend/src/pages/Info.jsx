import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../assets/css/Info.module.css';

export default function Info() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/products/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        
        const getImageUrl = (url) => {
            if (!url) return '';
            return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
        };

        const mainImg = data.images?.find(img => img.is_main);
        if (mainImg) {
          setMainImage(getImageUrl(mainImg.image));
        } else if (data.images && data.images.length > 0) {
          setMainImage(getImageUrl(data.images[0].image));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load product details", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>Загрузка...</div>;
  }

  if (!product) {
    return <div className={styles.wrapper} style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>Не найдено.</div>;
  }

  return (
    <div className={styles.wrapper}>

      <nav className={styles.breadcrumb}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Каталог / </Link>
        {product.category && product.category.name}
      </nav>

      <div className={styles.container}>
        <div className={styles.leftCol}>
          <h1 className={styles.title}>{product.brand} {product.name}</h1>
          <p className={styles.price}>{parseFloat(product.price).toLocaleString('ru-RU')} ₸</p>

          <div className={styles.detailsSection}>
            <h3>ДЕТАЛИ</h3>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#b0b0b0', marginTop: '15px' }}>
              {product.description}
            </p>
          </div>

          <div className={styles.tabs}>
            <button className={styles.activeTab}>ДЕТАЛИ</button>
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА (СЛАЙДЕР) */}
        <div className={styles.midCol}>
          <div className={styles.mainImageWrapper}>
            <button className={styles.navBtn}>←</button>
            <img 
                src={mainImage || 'https://via.placeholder.com/600x800/f0f0f0/666666?text=No+Photo'} 
                alt={product.name} 
                style={{ objectFit: 'cover' }}
            />
            <button className={styles.navBtn}>→</button>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className={styles.rightCol}>
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

          <div className={styles.selectionArea}>
            <div className={styles.colorPicker}>
              <p>ЦВЕТА: <span>{product.color?.name || 'Standard'}</span></p>
              <div 
                  className={styles.colorBox} 
                  style={{ 
                      backgroundColor: product.color?.hex_code || '#000', 
                      border: '1px solid #555' 
                  }}
              ></div>
            </div>

            <div className={styles.sizeSelection}>
              <div className={styles.sizeHeader}>
                <p>ВЫБРАТЬ:</p>
              </div>
              <div className={styles.sizeGrid}>
                {product.sizes?.map(sizeObj => (
                  <button 
                    key={sizeObj.id}
                    className={selectedSize === sizeObj.size ? styles.selectedSize : ''}
                    onClick={() => setSelectedSize(sizeObj.size)}
                    disabled={!sizeObj.in_stock}
                    style={{ opacity: sizeObj.in_stock ? 1 : 0.3 }}
                  >
                    {sizeObj.size}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.addBagBtn} 
                disabled={!selectedSize}
                onClick={() => alert(`Added ${product.name} (Size: ${selectedSize}) to cart!`)}
              >
                ДОБАВИТЬ В КОРЗИНУ
              </button>
              <button className={styles.wishlistBtn}>ПРИМЕРИТЬ</button>
            </div>

            <div className={styles.extraLinks}>
              <a>@ 2026</a>
              <a>AVISHU MODE</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
