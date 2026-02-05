import React from 'react';
import './BaseCostHoldings.css'; // We'll create this CSS file

const BaseCostHoldings = () => {
  // Data for the tables
  const tablesData = [
    {
      title: "Base costs as at 1 March 2023",
      columns: ["Coin", "Quantity Held", "Base Cost (ZAR)"],
      data: [
        { coin: "BTC", quantity: "0.431", baseCost: "R22,140" },
        { coin: "ETH", quantity: "0.489", baseCost: "R26,599" },
        { coin: "USDT", quantity: "700", baseCost: "R12,998" }
      ],
      total: "R61,737",
      note: null
    },
    {
      title: "Base costs as at 1 March 2024",
      columns: ["Coin", "Capital Gains", "Base Cost (ZAR)"],
      data: [
        { coin: "BTC", quantity: "0.062", baseCost: "R3,410" },
        { coin: "SOL", quantity: "93,661", baseCost: "R14,820" },
        { coin: "USDT", quantity: "699", baseCost: "R699" }
      ],
      total: "R18,929",
      note: null
    },
    {
      title: "Base costs as at 1 March 2023",
      columns: ["Coin", "Quantity Held", "Base Cost (ZAR)"],
      data: [
        { coin: "BTC", quantity: "0.062", baseCost: "R3,410" },
        { coin: "SOL", quantity: "93,661", baseCost: "R14,820" },
        { coin: "USDT", quantity: "699", baseCost: "R699" }
      ],
      total: "R61,737",
      note: null
    },
    {
      title: "2025 Tax Year",
      columns: ["Coin", "Quantity Held", "Base Cost (ZAR)"],
      data: [
        { coin: "BTC", quantity: "0.062", baseCost: "R3,410" },
        { coin: "SOL", quantity: "-640", baseCost: "-R640" },
        { coin: "USDT", quantity: "699", baseCost: "R699" }
      ],
      total: "R1,250",
      note: null
    }
  ];

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
        <button className="download-btn">
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