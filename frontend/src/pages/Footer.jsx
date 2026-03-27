import React from 'react';
import styles from '../assets/css/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles["footer"]}>
      {/* Верхняя белая секция */}
      <div className={styles["footer-top"]}>
        <div className={styles["thanks-title"]}>
          THANKS A LOT <br />
          <span className={styles["indent"]}>FOR WATCHING.</span>
        </div>
        
        <div className={styles["collab-info"]}>
          <div className={styles["collab-left"]}>
            I'm open to collaborations<br />
            and creative<br />
            connections
          </div>
          <div className={styles["collab-right"]}>
            — let's create<br />
            something together.
          </div>
        </div>
      </div>

      {/* Средняя черная полоса с мелким текстом */}
      <div className={styles["footer-bar"]}>
        <p>All materials were used for non-commercial and education purposes only and belong to its' owners. If you have any questions please contact me directly.</p>
      </div>

      {/* Нижняя черная секция */}
      <div className={styles["footer-bottom"]}>
        <div className={styles["like-button"]}>
          <div className={styles["icon-blue"]}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
               <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
            </svg>
          </div>
        </div>
        <div className={styles["project-info"]}>
          <h3>RAUM | e-commerce website</h3>
          <div className={styles["stats"]}>
            <span>👍 672</span>
            <span>👁️ 6,7 тыс.</span>
            <span>💬 30</span>
          </div>
          <p className={styles["date"]}>Опубликовано: 1 июля 2025 г.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;