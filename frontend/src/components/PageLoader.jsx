import React from 'react';
import { motion } from 'framer-motion';
import styles from '../assets/css/PageLoader.module.css';
const PageLoader = () => {
  return (
    <motion.div 
      className={styles.loaderWrapper}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.loader}></div>
    </motion.div>
  );
};
export default PageLoader;