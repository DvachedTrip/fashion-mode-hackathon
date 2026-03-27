import styles from '../assets/css/Header.module.css';

export default function Header() {
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
                    [ <span className={styles["theme-active"]}>DARK</span> / LIGHT ]
                </div>
                <a href="/search">SEARCH</a>
                <a href="/account">ACCOUNT</a>
                <a href="/bag">BAG</a>
            </div>
        </header>
    );
}
