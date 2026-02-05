import React, { useState, useEffect } from 'react';
import styles from './TaxSummary.module.css';

const TaxSummary = () => {
  const [taxYearData, setTaxYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaxYearSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/crypto-tax/tax-year', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to match our component structure
        const transformedData = transformApiData(data);
        setTaxYearData(transformedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching tax year summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxYearSummary();
  }, []);

  // format data in order to be displayed in table
  const transformApiData = (apiData) => {
    if (apiData.taxYears) {
      return apiData;
    }

    // Otherwise, transform the data
    const taxYearsMap = {};

    apiData.forEach(event => {
      const year = event.taxYear || getTaxYear(event.date);
      
      if (!taxYearsMap[year]) {
        taxYearsMap[year] = {
          year: year.toString(),
          dateRange: getTaxYearRange(year),
          coinMap: {},
          totalGains: 0,
          totalLosses: 0
        };
      }

      const coin = event.coin || event.symbol;
      if (!taxYearsMap[year].coinMap[coin]) {
        taxYearsMap[year].coinMap[coin] = {
          coin: coin,
          gains: 0,
          losses: 0
        };
      }

      // Accumulate gains and losses
      const amount = parseFloat(event.capitalGain || 0);
      if (amount > 0) {
        taxYearsMap[year].coinMap[coin].gains += amount;
        taxYearsMap[year].totalGains += amount;
      } else {
        taxYearsMap[year].coinMap[coin].losses += Math.abs(amount);
        taxYearsMap[year].totalLosses += Math.abs(amount);
      }
    });

    // Convert to array format
    const taxYears = Object.values(taxYearsMap).map(yearData => ({
      year: yearData.year,
      dateRange: yearData.dateRange,
      coins: Object.values(yearData.coinMap).map(coin => ({
        coin: coin.coin,
        capitalGains: formatCurrency(coin.gains),
        capitalLosses: formatCurrency(coin.losses)
      })),
      totalCapitalGains: formatCurrency(yearData.totalGains - yearData.totalLosses)
    }));

    // Sort by year descending
    taxYears.sort((a, b) => parseInt(b.year) - parseInt(a.year));

    return { taxYears };
  };

  // Calculate tax year from date (SA tax year: March-February)
  const getTaxYear = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return month <= 2 ? year : year + 1;
  };

  // Get tax year date range
  const getTaxYearRange = (taxYear) => {
    const startYear = taxYear - 1;
    const endYear = taxYear;
    
    const isLeapYear = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };
    
    const endDay = isLeapYear(endYear) ? 29 : 28;
    
    return `1 Mar ${startYear} - ${endDay} Feb ${endYear}`;
  };

  // Format currency with R prefix
  const formatCurrency = (amount) => {
    if (amount === 0) return 'R0';
    const formatted = Math.abs(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return amount < 0 ? `-R${formatted}` : `R${formatted}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading tax year summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Tax Summary</h2>
          <p style={{ color: 'red' }}>Error: {error}</p>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  if (!taxYearData || !taxYearData.taxYears || taxYearData.taxYears.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>No Tax Data Available</h2>
          <p>You don't have any capital gains or losses recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {taxYearData.taxYears.map((yearData) => (
        <div key={yearData.year} className={styles.taxYearSection}>
          <div className={styles.header}>
            <h2 className={styles.year}>{yearData.year} Tax Year</h2>
            <span className={styles.dateRange}>({yearData.dateRange})</span>
          </div>
          
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>
              Capital gains and losses for {yearData.year} tax year
            </caption>
            <thead>
              <tr>
                <th scope="col" className={styles.tableHeader}>Coin</th>
                <th scope="col" className={styles.tableHeader}>Capital Gains</th>
                <th scope="col" className={styles.tableHeader}>Capital Losses</th>
              </tr>
            </thead>
            <tbody>
              {yearData.coins.map((coinData) => (
                <tr key={coinData.coin} className={styles.tableRow}>
                  <td className={styles.tableCell}>{coinData.coin}</td>
                  <td className={styles.tableCell}>{coinData.capitalGains}</td>
                  <td className={styles.tableCell}>{coinData.capitalLosses}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <th scope="row" className={styles.tableCell}>Total Capital Gain:</th>
                <td className={styles.tableCell} colSpan="2">{yearData.totalCapitalGains}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TaxSummary;
