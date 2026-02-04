import React, { useState, useEffect } from 'react';
import styles from './CapitalGains.module.css';

const CapitalGains = () => {
  const [capitalGainEvents, setCapitalGainEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCapitalGains = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/capital-gains'); // endpoint URL
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCapitalGainEvents(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching capital gains:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCapitalGains();
  }, []);

  // Group events by tax year
  const getTaxYear = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    if (month <= 2) {
      return year;
    } else {
      return year + 1;
    }
  };

  // Get tax year date range
  const getTaxYearRange = (taxYear) => {
    const startYear = taxYear - 1;
    const endYear = taxYear;
    
    // Determine if end year is a leap year
    const isLeapYear = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };
    
    const endDay = isLeapYear(endYear) ? 29 : 28;
    
    return `1 March ${startYear} - ${endDay} February ${endYear}`;
  };

  // Group events by tax year
  const groupedByTaxYear = capitalGainEvents.reduce((acc, event) => {
    const taxYear = event.taxYear || getTaxYear(event.date);
    if (!acc[taxYear]) {
      acc[taxYear] = [];
    }
    acc[taxYear].push(event);
    return acc;
  }, {});

  // Sort tax years in descending order
  const sortedTaxYears = Object.keys(groupedByTaxYear).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your capital gains & losses</h1>
        <p className={styles.description}>Loading your capital gains data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your capital gains & losses</h1>
        <p className={styles.description} style={{ color: 'red' }}>
          Error loading data: {error}
        </p>
      </div>
    );
  }

  if (sortedTaxYears.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your capital gains & losses</h1>
        <p className={styles.description}>
          No capital gains or losses to display yet.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your capital gains & losses</h1>
      <p className={styles.description}>
        These are the gains and losses you must declare to SARS, grouped by tax year.
      </p>
      
      <div className={styles.taxYears}>
        {sortedTaxYears.map((taxYear) => (
          <div key={taxYear} className={styles.taxYearItem}>
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
              <strong>{taxYear} tax year: </strong>{getTaxYearRange(parseInt(taxYear))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CapitalGains;
