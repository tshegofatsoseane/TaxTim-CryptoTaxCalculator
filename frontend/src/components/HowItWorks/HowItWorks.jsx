import React from 'react';
import styles from './HowItWorks.module.css';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      text: "Copy and paste your transactions list from Excel bellow"
    },
    {
      number: 2,
      text: "Click \"Calculate\" to see your results",
      highlight: true
    },
    {
      number: 3,
      text: "Get transparent breakdowns with FIFO method (lot-by-lot)"
    },
    {
      number: 4,
      text: "Review a summary of base costs and capital gains"
    }
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>How it works</h2>
      
      <div className={styles.grid}>
        {steps.map((step) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.badge}>
              {step.number}
            </div>
            <p className={styles.text}>
              {step.highlight ? (
                <>
                  Click <span className={styles.highlight}>"Calculate"</span> to see your results
                </>
              ) : (
                step.text
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
