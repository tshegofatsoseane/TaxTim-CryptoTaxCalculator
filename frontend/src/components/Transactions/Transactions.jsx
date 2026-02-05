import { useState, useEffect } from 'react';

export default function Transactions({ transactions }) {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaxData = async () => {
      if (!transactions.length) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://api.anthropic.com/crypto-tax/balances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: JSON.stringify(transactions)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTaxData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching tax data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxData();
  }, [transactions]);

  if (!transactions.length) return null;

  if (loading) {
    return <div className="card">Loading tax calculations...</div>;
  }

  if (error) {
    return <div className="card error">Error loading data: {error}</div>;
  }

  if (!taxData) {
    return null;
  }

  return (
    <>
      {/* CURRENT BALANCES */}
      {taxData.balances && (
        <div className="card">
          <h2 className="section-title">Current Balances</h2>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(taxData.balances).map(([coin, balance]) => (
                <tr key={coin}>
                  <td>{coin}</td>
                  <td>{balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTIONS */}
      <div className="card">
        <h2 className="section-title">Transactions</h2>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Sell Coin</th>
              <th>Sell Amount</th>
              <th>Buy Coin</th>
              <th>Buy Amount</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i}>
                <td>{tx.date}</td>
                <td>{tx.type}</td>
                <td>{tx.sellCoin}</td>
                <td>{tx.sellAmount}</td>
                <td>{tx.buyCoin}</td>
                <td>{tx.buyAmount}</td>
                <td>{tx.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIFO LOTS */}
      {taxData.fifoLots && taxData.fifoLots.length > 0 && (
        <div className="card">
          <h2 className="section-title">FIFO Lots Breakdown</h2>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Buy Date</th>
                <th>Units Used</th>
                <th>Cost</th>
                <th>Proceeds</th>
                <th>Gain / Loss</th>
              </tr>
            </thead>
            <tbody>
              {taxData.fifoLots.map((lot, i) => (
                <tr key={i}>
                  <td>{lot.buyDate}</td>
                  <td>{lot.units}</td>
                  <td>{lot.cost}</td>
                  <td>{lot.proceeds}</td>
                  <td className={lot.gain >= 0 ? 'gain' : 'loss'}>{lot.gain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUMMARY */}
      {taxData.summary && (
        <div className="card">
          <h2 className="section-title">Summary</h2>
          <div className="summary-grid">
            <div>
              <strong>Total Proceeds</strong>
              <p>R {taxData.summary.totalProceeds?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <strong>Total Cost</strong>
              <p>R {taxData.summary.totalCost?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <strong>Total Capital Gain</strong>
              <p className={taxData.summary.totalGain >= 0 ? 'gain' : 'loss'}>
                R {taxData.summary.totalGain?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
