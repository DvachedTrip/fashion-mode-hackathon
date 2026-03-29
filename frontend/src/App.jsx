import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from "./assets/css/App.module.css"
import Header from "./pages/Header"
import Footer from "./pages/Footer"
import Shop from "./pages/Shop"
import Info from "./pages/Info"
import { CartProvider } from './components/CartContext';
import { ThemeProvider } from './components/ThemeContext';
import Sidebar from './pages/Sidebar';
import SmoothScroll from './components/SmoothScroll';
import PageLoader from './components/PageLoader'; 
import ScrollToTop from './components/ScrollToTop';
const homePageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6 } 
};
function App() {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  useEffect(() => {
    if (location.pathname === '/') {
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 1200); 
      return () => clearTimeout(timer);
    }
  }, [location.pathname]); 
  return (
    <ThemeProvider>
      <SmoothScroll>
        <CartProvider>
          <ScrollToTop />
          <div className={styles["all"]}>
            {}
            <AnimatePresence>
              {isPageLoading && <PageLoader />}
            </AnimatePresence>
            <Header />
            <Sidebar />
            <main>
              {}
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {}
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
                  {}
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