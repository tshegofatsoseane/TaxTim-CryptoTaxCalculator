import { useMemo, useState } from "react";
import styles from "./BaseCosts.module.css";
import InfoModal from "../../components/InfoModal/InfoModal";

import { fmtCurrency, fmtNumber } from "../../utils/formatters";
import {
  sortBoundaries,
  getSelectedBoundary,
  getTotalForBoundary,
  getExampleData,
} from "../../utils/baseCostHelpers";

// ✅ add this (put image at: src/assets/noresults.png)
import noResultsImg from "../../assets/noresults.png";

export default function BaseCosts({ apiData }) {
  const boundaries = apiData?.baseCostsByTaxYear ?? [];
  const [selectedTaxYear, setSelectedTaxYear] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const sorted = useMemo(() => sortBoundaries(boundaries), [boundaries]);
  const selected = useMemo(
    () => getSelectedBoundary(sorted, selectedTaxYear),
    [sorted, selectedTaxYear]
  );
  const totalForSelected = useMemo(
    () => getTotalForBoundary(selected),
    [selected]
  );
  const exampleData = useMemo(() => getExampleData(sorted), [sorted]);

  const HelpContent = (
    <div>
      <p className={styles.helpP}>
        <b>Base cost</b> is simply: <b>how much you originally paid</b> for the crypto you
        still own on a specific date.
      </p>

      <p className={styles.helpP}>
        SARS tax years start on <b>1 March</b>. So we show your holdings as at each 1 March
        boundary.
      </p>

      <div className={styles.helpNote}>
        We use <b>FIFO</b> (First-In, First-Out). That means when you sell or trade, the
        system assumes you used your <b>oldest</b> coins first.
      </div>

      <div className={styles.helpExample}>
        <div className={styles.helpExampleTitle}>
          Example {exampleData ? "using your data" : "calculation"}
        </div>

        {exampleData ? (
          <>
            <div className={styles.helpExampleText}>
              On <b>{exampleData.date}</b>, you still held:
            </div>

            <ul className={styles.helpMiniList}>
              {exampleData.items.map((i) => (
                <li key={i.coin}>
                  {fmtNumber(i.amount, 8)} {i.coin} bought for <b>{fmtCurrency(i.cost)}</b>
                </li>
              ))}
            </ul>

            <div className={styles.helpCalc}>
              Total base cost = <b>{fmtCurrency(exampleData.total)}</b>
            </div>
          </>
        ) : (
          <>
            <div className={styles.helpExampleText}>
              You buy crypto for R10,000 and later R5,000. If you still hold both, your base
              cost is:
            </div>

            <div className={styles.helpCalc}>
              R10,000 + R5,000 = <b>R15,000</b>
            </div>
          </>
        )}
      </div>

      <div className={styles.helpFooterHint}>
        Tip: This screen is about what you still <b>own</b>. Your gains/losses come from what
        you <b>sold</b> or <b>traded</b>.
      </div>
    </div>
  );

  // --- EMPTY STATE (no apiData) ---
  if (!apiData) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.stepKicker}>Step 2</div>
            <h2 className={styles.title}>Base cost of your crypto holdings</h2>
            <p className={styles.sub}>
              Submit transactions first. Then we’ll show your holdings at each <b>1 March</b>{" "}
              boundary (SARS tax year start).
            </p>
          </div>

          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsHelpOpen(true)}
          >
            What is this?
          </button>
        </div>

        {/* ✅ Image + keep your tick icon + original text */}
        <div className={styles.emptyHero}>
          <img
            src={noResultsImg}
            alt="No results yet"
            className={styles.emptyHeroImg}
            loading="lazy"
          />

          <div className={styles.emptyCard}>
            {/* ✅ keep the tick icon */}
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

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="What does “base cost” mean?"
          primaryText="Got it"
        >
          {HelpContent}
        </InfoModal>
      </div>
    );
  }

  // --- EMPTY STATE (no boundaries) ---
  if (!sorted.length) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Base cost of your crypto holdings</h2>
            <p className={styles.sub}>
              We didn’t find any base cost boundaries in your results.
            </p>
          </div>

          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsHelpOpen(true)}
          >
            What is this?
          </button>
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

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="What does “base cost” mean?"
          primaryText="Got it"
        >
          {HelpContent}
        </InfoModal>
      </div>
    );
  }

  // --- VIEW 1: SUMMARY CARDS ---
  if (!selectedTaxYear) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Base cost of your crypto holdings</h2>
            <p className={styles.sub}>
              For each <b>1 March</b> boundary, we show what you still owned and the original
              cost (base cost) using SARS FIFO.
            </p>
          </div>

          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsHelpOpen(true)}
          >
            What is this?
          </button>
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

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="What does “base cost” mean?"
          primaryText="Got it"
        >
          {HelpContent}
        </InfoModal>
      </div>
    );
  }

  // --- VIEW 2: DRILL DOWN TABLE ---
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

        <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setIsHelpOpen(true)}
          >
            What is this?
          </button>

          <button
            className={styles.ghostBtn}
            type="button"
            onClick={() => setSelectedTaxYear(null)}
          >
            ← Back to dates
          </button>
        </div>
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

      <InfoModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="What does “base cost” mean?"
        primaryText="Got it"
      >
        {HelpContent}
      </InfoModal>
    </div>
  );
}
