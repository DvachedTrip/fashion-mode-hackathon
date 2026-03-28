import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import styles from "./assets/css/App.module.css"

import Header from "./pages/Header"
import Footer from "./pages/Footer"
// Оставляем Shop как основной компонент для /
import Shop from "./pages/Shop"
import Info from "./pages/Info"

import { CartProvider } from './components/CartContext';
import { ThemeProvider } from './components/ThemeContext';
import Sidebar from './pages/Sidebar';
import SmoothScroll from './components/SmoothScroll';
import PageLoader from './components/PageLoader'; // Твой лоадер с градиентом "AVISHU"


// Варианты анимации только для главной страницы
const homePageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6 } // Чуть медленнее для эффекта "призрака"
};

function App() {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  // Логика: показываем лоадер только при первом посещении / или переходе на /
  useEffect(() => {
    // Проверяем, что мы именно на главной
    if (location.pathname === '/') {
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 1200); // 1.2 секунды, чтобы пользователь насладился анимацией

      return () => clearTimeout(timer);
    }
  }, [location.pathname]); // Срабатывает при смене пути

  return (
    <ThemeProvider>
      <SmoothScroll>
        <CartProvider>
          <div className={styles["all"]}>
            
            {/* Анимированный экран загрузки (только если isPageLoading === true) */}
            <AnimatePresence>
              {isPageLoading && <PageLoader />}
            </AnimatePresence>

            <Header />
            <Footer />
            <Sidebar />

            <main>
              {/* mode="wait" заставляет старую страницу исчезнуть до появления новой */}
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  
                  {/* ГЛАВНАЯ СТРАНИЦА (Shop) С АНИМАЦИЕЙ */}
                  <Route path="/" element={
                    <motion.div 
                      key="home"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={homePageVariants}
                    >
                      <Shop />
                    </motion.div>
                  } />

                  {/* СТРАНИЦА ТОВАРА (Info) БЕЗ АНИМАЦИИ ВЫХОДА */}
                  <Route path="/info/:id" element={
                    <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Info />
                    </motion.div>
                  } />
                </Routes>
              </AnimatePresence>
            </main>

            <Footer />
          </div>
        </CartProvider>
      </SmoothScroll>
    </ThemeProvider>
  )
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;