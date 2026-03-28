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
                        <a href="/">AVISHU</a>
                    </div>
            </div>


            <div className={styles["header-mid"]}>
            </div>

            <div className={styles["header-right"]}>
                <div className={styles["theme-toggle"]}>
                    [ 
                    <span 
                        onClick={(e) => toggleTheme(e, 'dark')}
                        className={theme === 'dark' ? styles["theme-active"] : styles["theme-inactive"]}
                        style={{ cursor: 'pointer' }}
                    >
                        DARK
                    </span> 
                    / 
                    <span 
                        onClick={(e) => toggleTheme(e, 'light')}
                        className={theme === 'light' ? styles["theme-active"] : styles["theme-inactive"]}
                        style={{ cursor: 'pointer' }}
                    >
                        LIGHT
                    </span> 
                    ]
                </div>
                <a onClick={(e) => { e.preventDefault(); toggleCart(); }} href="#">AI</a>

            </div>
        </header>
    );
}
