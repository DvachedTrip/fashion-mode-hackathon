import styles from '../assets/css/Header.module.css';
import { useCart } from '../components/CartContext';
import { useTheme } from "../components/ThemeContext"

export default function Header() {

    const { toggleCart } = useCart();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className={styles["header"]}>
            <div className={styles["header-left"]}>
                <div className={styles["logo"]}>
                    <span style={{fontWeight: 'bold', fontSize: '24px', color: '#fff'}}>RAUM</span>
                </div>
            </div>

            <div className={styles["header-mid"]}>
                <a href="/shop">SHOP</a>
                <a href="/collections">COLLECTIONS</a>
                <a href="/about">ABOUT</a>
            </div>

            <div className={styles["header-right"]}>
                <div className={styles["theme-toggle"]}>
                    [ 
                    <span 
                        onClick={() => toggleTheme('dark')}
                        className={theme === 'dark' ? styles["theme-active"] : styles["theme-inactive"]}
                        
                    >
                        DARK
                    </span> 
                    / 
                    <span 
                        onClick={() => toggleTheme('light')}
                        className={theme === 'light' ? styles["theme-active"] : styles["theme-inactive"]}
    
                    >
                        LIGHT
                    </span> 
                    ]
                </div>
                <a href="/search">SEARCH</a>
                <a href="/account">ACCOUNT</a>
                <a onClick={(e) => { e.preventDefault(); toggleCart(); }} href="#">BAG</a>
            </div>
        </header>
    );
}
