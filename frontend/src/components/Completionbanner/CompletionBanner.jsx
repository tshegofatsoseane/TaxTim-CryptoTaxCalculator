import React from 'react';
import styles from './CompletionBanner.module.css';

const CompletionBanner = () => {
  const handleBackClick = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>You're done!</h1>
      <p className={styles.subtitle}>
        These amounts can now be used in your tax return.
      </p>
      <div className={styles.buttonGroup}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <svg 
            className={styles.icon} 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12.5 15L7.5 10L12.5 5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          Back to Transactions
        </button>
        <button className={styles.downloadButton}>
          <svg 
            className={styles.icon} 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M10 13L10 3M10 13L7 10M10 13L13 10M3 17H17" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          Download Summary (CSV)
        </button>
      </div>
    </div>
  );
};

export default CompletionBanner;
