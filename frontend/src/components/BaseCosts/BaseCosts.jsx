// src/components/BaseCosts/BaseCosts.jsx
import { useMemo, useState } from "react";
import styles from "./BaseCosts.module.css";

const fmtCurrency = (n) => {
  const val = Number(n || 0);
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R${formatted}` : `R${formatted}`;
};

const fmtNumber = (n, max = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: max });

export default function BaseCosts({ apiData }) {
  const boundaries = apiData?.baseCostsByTaxYear ?? [];

  const [selectedTaxYear, setSelectedTaxYear] = useState(null);

  const sorted = useMemo(() => {
    return [...boundaries].sort((a, b) => Number(b.taxYear) - Number(a.taxYear));
  }, [boundaries]);

  const selected = useMemo(() => {
    if (!selectedTaxYear) return null;
    return sorted.find((x) => Number(x.taxYear) === Number(selectedTaxYear));
  }, [sorted, selectedTaxYear]);

  const totalForSelected = useMemo(() => {
    const coins = selected?.coins ?? [];
    return coins.reduce((sum, c) => sum + Number(c.costBasis || 0), 0);
  }, [selected]);

  if (!apiData) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            Submit transactions to see your holdings at each <b>1 March</b> boundary.
          </p>
        </div>

        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div>
            <div className={styles.emptyTitle}>No results yet</div>
            <div className={styles.emptyText}>
              Paste your transactions and click <b>Submit Transactions</b>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>No base cost boundaries found.</p>
        </div>
      </div>
    );
  }

  // ======================
  // VIEW 1: SUMMARY CARDS
  // ======================
  if (!selectedTaxYear) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            For each <b>1 March</b> date, we show how much of each coin you still owned
            and what it originally cost you (base cost).
          </p>
        </div>

        <div className={styles.grid}>
          {sorted.map((b) => {
            const coins = b.coins ?? [];
            const total = coins.reduce((sum, c) => sum + Number(c.costBasis || 0), 0);

            return (
              <div key={b.taxYear} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardYear}>Base costs as at {b.date}</div>
                    <div className={styles.cardRange}>
                      {b.taxYear} tax year boundary
                    </div>
                  </div>

                  <div className={styles.bigNumber}>{fmtCurrency(total)}</div>
                </div>

                <div className={styles.preview}>
                  {coins.slice(0, 4).map((c) => (
                    <div key={c.coin} className={styles.previewRow}>
                      <span className={styles.coinSym}>{c.coin}</span>
                      <span className={styles.previewVals}>
                        {fmtNumber(c.amount, 8)} • {fmtCurrency(c.costBasis)}
                      </span>
                    </div>
                  ))}
                  {coins.length > 4 && (
                    <div className={styles.moreCoins}>+{coins.length - 4} more</div>
                  )}
                </div>

                <button
                  className={styles.primaryBtn}
                  onClick={() => setSelectedTaxYear(b.taxYear)}
                >
                  View holdings
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================
  // VIEW 2: YEAR DRILL-DOWN
  // =========================
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            Showing holdings as at <b>{selected?.date}</b> (tax year {selectedTaxYear})
          </p>
        </div>

        <button className={styles.ghostBtn} onClick={() => setSelectedTaxYear(null)}>
          ← Back to dates
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <div className={styles.tableTitle}>Holdings & base cost (FIFO)</div>
          <div className={styles.tableMeta}>{(selected?.coins ?? []).length} coins</div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Coin</th>
                <th className={styles.num}>Quantity held</th>
                <th className={styles.num}>Base cost (ZAR)</th>
              </tr>
            </thead>
            <tbody>
              {(selected?.coins ?? []).map((c) => (
                <tr key={c.coin}>
                  <td className={styles.coinStrong}>{c.coin}</td>
                  <td className={styles.num}>{fmtNumber(c.amount, 8)}</td>
                  <td className={styles.num}>{fmtCurrency(c.costBasis)}</td>
                </tr>
              ))}
              {(!(selected?.coins ?? []).length) && (
                <tr>
                  <td colSpan={3} className={styles.muted} style={{ padding: 16 }}>
                    No holdings at this boundary.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className={styles.footLabel} colSpan={2}>
                  Total base cost:
                </td>
                <td className={styles.num + " " + styles.footValue}>
                  {fmtCurrency(totalForSelected)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.helperText}>
          This uses SARS FIFO: the base cost is the original purchase cost of the coins
          you still hold at this date.
        </div>
      </div>
    </div>
  );
}
