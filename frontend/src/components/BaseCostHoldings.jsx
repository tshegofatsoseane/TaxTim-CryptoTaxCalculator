import React, { useState, useEffect } from 'react';
import './BaseCostHoldings.css';
import Transactions from './Transactions/Transactions';

const BaseCostHoldings = ({ transactions }) => {
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBaseCosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/crypto-tax/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: transactions
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the API response into the format needed for the tables
        const transformedData = transformApiDataToTables(data);
        setTablesData(transformedData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching base costs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (transactions) {
      fetchBaseCosts();
    }
  }, [transactions]);

  // Transform API response to match table structure
  const transformApiDataToTables = (apiData) => {
    if (!apiData.baseCostsByYear) return [];
    
    return apiData.baseCostsByYear.map(yearData => ({
      title: yearData.title || `Base costs as at ${yearData.date}`,
      columns: ["Coin", "Quantity Held", "Base Cost (ZAR)"],
      data: yearData.holdings?.map(holding => ({
        coin: holding.coin,
        quantity: holding.quantity,
        baseCost: formatCurrency(holding.baseCost)
      })) || [],
      total: formatCurrency(yearData.totalBaseCost),
      note: yearData.note || null
    }));
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'R0';
    const formatted = Math.abs(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return amount < 0 ? `-R${formatted}` : `R${formatted}`;
  };

  const handleDownloadCSV = () => {
    // Generate CSV from tablesData
    let csvContent = '';
    
    tablesData.forEach(table => {
      csvContent += `${table.title}\n`;
      csvContent += `${table.columns.join(',')}\n`;
      
      table.data.forEach(row => {
        csvContent += `${row.coin},${row.quantity},${row.baseCost}\n`;
      });
      
      csvContent += `Total,${table.total}\n\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base-costs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="base-cost-container">
        <div className="loading-state">Loading base costs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="base-cost-container">
        <div className="error-state">
          <p>Error loading base costs: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!tablesData.length) {
    return (
      <div className="base-cost-container">
        <div className="empty-state">No base cost data available.</div>
      </div>
    );
  }

  return (
    <div className="base-cost-container">
      <header className="base-cost-header">
        <h1>Base cost of your crypto holdings</h1>
        <p className="description">
          These are the values of your crypto holdings at the start of each tax year, 
          calculated using SARS' FiFO method.
        </p>
        
        <div className="info-section">
          <h2>For each 1 March date, we show:</h2>
          <ul>
            <li>How much of each coin you still owned</li>
            <li>What it originally cost you (base cost).</li>
          </ul>
        </div>
      </header>

      <div className="tables-container">
        {tablesData.map((table, index) => (
          <div key={index} className="table-card">
            <h3 className="table-title">{table.title}</h3>
            <div className="table-wrapper">
              <table className="base-cost-table">
                <thead>
                  <tr>
                    {table.columns.map((column, colIndex) => (
                      <th key={colIndex}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="coin-cell">{row.coin}</td>
                      <td className="quantity-cell">{row.quantity}</td>
                      <td className="cost-cell">{row.baseCost}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2"><strong>Total base cost:</strong></td>
                    <td><strong>{table.total}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {table.note && <p className="table-note">{table.note}</p>}
          </div>
        ))}
      </div>

      <div className="download-section">
        <button className="download-btn" onClick={handleDownloadCSV}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Base Costs (CSV)
        </button>
      </div>
    </div>
  );
};

export default BaseCostHoldings;
