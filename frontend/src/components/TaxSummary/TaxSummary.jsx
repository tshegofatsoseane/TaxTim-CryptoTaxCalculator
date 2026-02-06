import { useMemo } from "react";
import styles from "./TaxSummary.module.css";

const money = (n) =>
  `R${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const taxRange = (taxYear) => {
  const startYear = taxYear - 1;
  const endYear = taxYear;
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const endDay = isLeap(endYear) ? 29 : 28;
  return `1 Mar ${startYear} - ${endDay} Feb ${endYear}`;
};

export default function TaxYearSummaryCards({ apiData }) {
  const summaries = apiData?.taxYearSummaries ?? [];

  const cards = useMemo(() => {
    return summaries
      .slice()
      .sort((a, b) => Number(b.taxYear) - Number(a.taxYear))
      .map((s) => ({
        year: s.taxYear,
        range: taxRange(Number(s.taxYear)),
        total: s.netGain ?? s.totalGain ?? 0,
        rows: (s.byCoins ?? []).slice().sort((a, b) => a.coin.localeCompare(b.coin)),
      }));
  }, [summaries]);

  if (!apiData) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyCard}>
          <h3>Tax year summary</h3>
          <p>Paste transactions and click Submit to generate a summary.</p>
        </div>
      </div>
    );
  }

  if (!cards.length) return null;

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.year} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.yearTitle}>{c.year} Tax Year</div>
              <div className={styles.range}>({c.range})</div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th className={styles.right}>Capital Gains</th>
                    <th className={styles.right}>Capital Losses</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.coin}>
                      <td className={styles.coin}>{r.coin}</td>
                      <td className={styles.right}>{money(r.totalGain)}</td>
                      <td className={styles.right}>{money(r.totalLoss)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className={styles.totalLabel} colSpan={2}>
                      Total Capital Gain:
                    </td>
                    <td className={`${styles.right} ${styles.totalValue}`}>
                      {money(c.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
