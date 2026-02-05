export default function Transactions({ transactions }) {
  if (!transactions.length) return null;

  return (
    <>
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
            {fifoLots.map((lot, i) => (
              <tr key={i}>
                <td>{lot.buyDate}</td>
                <td>{lot.units}</td>
                <td>{lot.cost}</td>
                <td>{lot.proceeds}</td>
                <td className="gain">{lot.gain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="card">
        <h2 className="section-title">Summary</h2>

        <div className="summary-grid">
          <div>
            <strong>Total Proceeds</strong>
            <p>R 40,000</p>
          </div>
          <div>
            <strong>Total Cost</strong>
            <p>R 17,500</p>
          </div>
          <div>
            <strong>Total Capital Gain</strong>
            <p className="gain">R 22,500</p>
          </div>
        </div>
      </div>
    </>
  );
}
