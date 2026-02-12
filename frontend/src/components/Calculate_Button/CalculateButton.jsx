import React, { useState } from 'react';
import styles from './CalculateButton.module.css';

const CalculateButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://crypto-tax/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit',
          data: 'Transaction data here',
          timestamp: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Success: ' + (result.message || 'Data sent successfully!'));
      } else {
        setMessage('Error: ' + (result.error || 'Something went wrong'));
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.submitButton} 
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      
      {message && (
        <div className={message.startsWith('Success') ? styles.successMessage : styles.errorMessage}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CalculateButton;
