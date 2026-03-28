import React, { useEffect, useRef, useState } from 'react';
import styles from '../assets/css/Footer.module.css';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false); // Новое состояние
  const footerRef = useRef(null);

  useEffect(() => {
    // 1. Ждем завершения глобальной анимации лоадера (1.2с + запас)
    const timer = setTimeout(() => {
      setCanAnimate(true);
    }, 1400); 

    // 2. Стандартный наблюдатель появления
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Анимация сработает только когда элемент в зоне видимости И лоадер исчез
  const showAnimation = isVisible && canAnimate;

  return (
    <footer 
      ref={footerRef} 
      className={`${styles["footer"]} ${showAnimation ? styles["visible"] : ""}`}
    >
      <div className={styles["footer-top"]}>
        <div className={styles["thanks-title"]}>
          {/* Добавим задержку появления для каждой строки отдельно в CSS для красоты */}
          <span className={styles["avishu-row"]}>AVISHU</span>
          <span className={styles["indent"]}>ДЛЯ ВАС</span>
        </div>
        
        <div className={styles["collab-info"]}>
          <div className={styles["collab-left"]}>
            Мы верим в силу общих идей,<br />
            смелых коллабораций и<br />
            творческих союзов
          </div>
          <div className={styles["collab-right"]}>
            — давайте создавать <br />
            будущее вместе.
          </div>
        </div>
      </div>
      <div className={styles["footer-bar"]}>
        © 2026 AVISHU MODE — ALL RIGHTS RESERVED
      </div>
    </footer>
  );
};

export default Footer;