import React from 'react';
import styles from '../assets/css/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles["footer"]}>
      {/* Верхняя белая секция */}
      <div className={styles["footer-top"]}>
        <div className={styles["thanks-title"]}>
          AVISHU <br />
          <span className={styles["indent"]}>FOR YOU.</span>
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

  
    </footer>
  );
};

export default Footer;