import React from 'react';
import styles from './CapitalGains.module.css';

const CapitalGains = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your capital gains & losses</h1>
      <p className={styles.description}>
        These are the gains and losses you must declare to SARS, grouped by tax year.
      </p>
      
      <div className={styles.taxYears}>
        <div className={styles.taxYearItem}>
          <div className={styles.checkmark}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#4A9B8E" />
              <path 
                d="M7 12L10.5 15.5L17 9" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.taxYearText}>
            <strong>2024 tax year:</strong>1 March 2023-29 February 2024 {/*Remove hard coding later*/}
          </span>
        </div>
        
        <div className={styles.taxYearItem}>
          <div className={styles.checkmark}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#4A9B8E" />
              <path 
                d="M7 12L10.5 15.5L17 9" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.taxYearText}>
            <strong>2025 tax year:</strong>1 March 2024-28 February 2025 {/*Remove hard coding later*/}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CapitalGains;
