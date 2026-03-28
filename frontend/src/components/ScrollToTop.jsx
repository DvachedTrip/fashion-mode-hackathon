import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Эта строка отключает запоминание позиции скролла браузером (Chrome/Safari)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Мгновенный скролл в начало
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}