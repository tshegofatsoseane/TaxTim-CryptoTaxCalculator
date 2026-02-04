import React from 'react';
import styles from './TaxSummary.module.css';

const TaxSummary = ({ data }) => {
  // Demo data for testing
  const demoData = {
    taxYears: [
      {
        year: "2024",
        dateRange: "1 Mar 2023-29 Feb 2024",
        coins: [
          { coin: "BTC", capitalGains: "R4,180", capitalLosses: "R4,180" },
          { coin: "ETH", capitalGains: "-R320", capitalLosses: "-R320" },
          { coin: "USDT", capitalGains: "R6,064", capitalLosses: "R8,084" }
        ],
        totalCapitalGains: "R18,244"
      },
      {
        year: "2025",
        dateRange: "1 Mar 2024-28 Feb 2024",
        coins: [
          { coin: "BTC", capitalGains: "R1,880", capitalLosses: "R1,890" },
          { coin: "SOL", capitalGains: "-640", capitalLosses: "-R640" }
        ],
        totalCapitalGains: "R8,921"
      }
    ]
  };

  // Currently using to demo data from above
  const displayData = data || demoData;

  return (
    <div className={styles.container}>
      {displayData.taxYears.map((yearData, index) => (
        <div key={index} className={styles.taxYearSection}>
          <div className={styles.header}>
            <h2 className={styles.year}>{yearData.year} Tax Year</h2>
            <span className={styles.dateRange}>({yearData.dateRange})</span>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Coin</th>
                <th className={styles.tableHeader}>Capital Gains</th>
                <th className={styles.tableHeader}>Capital Losses</th>
              </tr>
            </thead>
            <tbody>
              {yearData.coins.map((coinData, coinIndex) => (
                <tr key={coinIndex} className={styles.tableRow}>
                  <td className={styles.tableCell}>{coinData.coin}</td>
                  <td className={styles.tableCell}>{coinData.capitalGains}</td>
                  <td className={styles.tableCell}>{coinData.capitalLosses}</td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td className={styles.tableCell}>Total Capital Gain:</td>
                <td className={styles.tableCell} colSpan="2">{yearData.totalCapitalGains}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TaxSummary;
