import React, { useEffect, useRef, useState } from 'react';
import styles from '../assets/css/Footer.module.css';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
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

    return () => observer.disconnect();
  }, []);

  return (
    <footer 
      ref={footerRef} 
      className={`${styles["footer"]} ${isVisible ? styles["visible"] : ""}`}
    >
      <div className={styles["footer-top"]}>
        <div className={styles["thanks-title"]}>
          <span className={styles["avishu-row"]}>AVISHU</span>
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
      <div className={styles["footer-bar"]}>
        © 2026 AVISHU MODE — ALL RIGHTS RESERVED
      </div>
      
    </footer>
  );
};

export default Footer;



