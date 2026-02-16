import React from "react";
import styles from "./CompletionBanner.module.css";
import SarsPdfDownloadButton from "../SarsPdfDownloadButton/SarsPdfDownloadButton";

const CompletionBanner = ({ apiData, metadata }) => {
  const handleBackClick = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>You're done!</h1>
      <p className={styles.subtitle}>These amounts can now be used in your tax return.</p>

      <div className={styles.buttonGroup}>
        <button className={styles.backButton} onClick={handleBackClick} type="button">
          <svg
            className={styles.icon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
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

        {/* ✅ replaced the old Download Summary button */}
        <SarsPdfDownloadButton
          apiData={apiData}
          metadata={metadata}
          filename="sars_crypto_summary_results"
          label="Download SARS PDF"
          variant="primary"
        />
      </div>
    </div>
  );
};

export default CompletionBanner;
