import React from 'react';
import styles from './Loader.module.css';

const Loader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.loaderContent}>
        <div className={styles.loaderImage}>
          <div className={styles.loaderCoin}>
            <img src="https://www.dropbox.com/s/fzc3fidyxqbqhnj/loader-coin.png?raw=1" alt="coin" />
          </div>
          <div className={styles.loaderHand}>
            <img src="https://www.dropbox.com/s/y8uqvjn811z6npu/loader-hand.png?raw=1" alt="hand" />
          </div>
        </div>
        <p className={styles.loaderText}>Processing Your Transactions</p>
      </div>
    </div>
  );
};

export default Loader;
