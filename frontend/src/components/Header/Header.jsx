import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <div className={styles.checkmark}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.title}>
            <span className={styles.taxText}>Tax</span>
            <span className={styles.timText}>Tim</span>
            <span className={styles.cryptoText}>Crypto Calculator</span>
          </h1>
        </div>
        <p className={styles.subtitle}>Capital Gains Tax Made Simple</p>
      </div>
    </header>
  );
};

export default Header;
