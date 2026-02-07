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
    return sorted.find((x) => Number(x.taxYear) === Number(selectedTaxYear)) ?? null;
  }, [sorted, selectedTaxYear]);

  const totalForSelected = useMemo(() => {
    const coins = selected?.coins ?? [];
    return coins.reduce((sum, c) => sum + Number(c.costBasis || 0), 0);
  }, [selected]);

  // EMPTY STATE (no apiData)
  if (!apiData) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            Submit transactions first. Then we’ll show your holdings at each{" "}
            <b>1 March</b> boundary (SARS tax year start).
          </p>
        </div>

        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div>
            <div className={styles.emptyTitle}>No results yet</div>
            <div className={styles.emptyText}>
              Go to <b>Transactions</b>, paste your list, and click{" "}
              <b>Submit Transactions</b>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY STATE (no boundaries)
  if (!sorted.length) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            We didn’t find any base cost boundaries in your results.
          </p>
        </div>

        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>!</div>
          <div>
            <div className={styles.emptyTitle}>Nothing to display</div>
            <div className={styles.emptyText}>
              This usually means the API returned no <code>baseCostsByTaxYear</code>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 1: SUMMARY CARDS
  if (!selectedTaxYear) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            For each <b>1 March</b> boundary, we show what you still owned and the
            original cost (base cost) using SARS FIFO.
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
                    <div className={styles.cardRange}>Tax year boundary: {b.taxYear}</div>
                  </div>

                  <div className={styles.bigNumber} title="Total base cost of coins held">
                    {fmtCurrency(total)}
                  </div>
                </div>

                    <div className={styles.preview}>
                    {coins.length ? (
                        <>
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
                        </>
                    ) : (
                        <div className={styles.previewEmpty}>No holdings on this date.</div>
                    )}
                    </div>


                <button
                  className={styles.primaryBtn}
                  type="button"
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

  // VIEW 2: DRILL DOWN TABLE
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Base cost of your crypto holdings</h2>
          <p className={styles.sub}>
            Showing holdings as at <b>{selected?.date}</b> (tax year boundary{" "}
            <b>{selectedTaxYear}</b>)
          </p>
        </div>

        <button className={styles.ghostBtn} type="button" onClick={() => setSelectedTaxYear(null)}>
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
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "33%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>Coin</th>
                <th className={styles.num}>Quantity held</th>
                <th className={styles.num}>Base cost (ZAR)</th>
              </tr>
            </thead>

            <tbody>
              {(selected?.coins ?? []).map((c) => (
                <tr key={c.coin} className={styles.row}>
                  <td className={styles.coinStrong}>{c.coin}</td>
                  <td className={`${styles.num} ${styles.monoNum}`}>
                    {fmtNumber(c.amount, 8)}
                  </td>
                  <td className={`${styles.num} ${styles.money}`}>
                    {fmtCurrency(c.costBasis)}
                  </td>
                </tr>
              ))}

              {!(selected?.coins ?? []).length && (
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
                <td className={`${styles.num} ${styles.footValue} ${styles.money}`}>
                  {fmtCurrency(totalForSelected)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.helperText}>
          This uses SARS FIFO: your “base cost” is the original purchase cost of the coins you
          still hold on this date.
        </div>
      </div>
    </div>
  );
}
