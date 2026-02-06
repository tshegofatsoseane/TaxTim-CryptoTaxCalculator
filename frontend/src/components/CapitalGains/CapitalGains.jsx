// src/components/CapitalGains/CapitalGains.jsx
import { useMemo, useState } from "react";
import styles from "./CapitalGains.module.css";
import CompletionBanner from "../Completionbanner/CompletionBanner";

const fmtCurrency = (n) => {
  const val = Number(n || 0);
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R${formatted}` : `R${formatted}`;
};

const fmtNumber = (n, max = 8) => {
  const val = Number(n || 0);
  return val.toLocaleString("en-ZA", { maximumFractionDigits: max });
};

const taxYearRange = (taxYear) => {
  const startYear = Number(taxYear) - 1;
  const endYear = Number(taxYear);
  const isLeap =
    (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0;
  const endDay = isLeap ? 29 : 28;
  return `1 Mar ${startYear} – ${endDay} Feb ${endYear}`;
};

const humanType = (t) => {
  if (t === "SELL") return "Sold";
  if (t === "TRADE") return "Traded";
  if (t === "BUY") return "Bought";
  return t || "-";
};

const pillClass = (t) => {
  if (t === "SELL") return styles.pillSell;
  if (t === "TRADE") return styles.pillTrade;
  if (t === "BUY") return styles.pillBuy;
  return styles.pillDefault;
};

export default function CapitalGains({ apiData }) {
  const summaries = apiData?.taxYearSummaries ?? [];
  const events = apiData?.capitalGainEvents ?? [];

  const [selectedYear, setSelectedYear] = useState(null);
  const [coinFilter, setCoinFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [expandAll, setExpandAll] = useState(false);

  const years = useMemo(() => {
    const ys = summaries
      .map((s) => Number(s.taxYear))
      .filter(Boolean)
      .sort((a, b) => b - a);
    return ys;
  }, [summaries]);

  const coinsForYear = useMemo(() => {
    if (!selectedYear) return ["All"];
    const byCoins =
      summaries.find((s) => Number(s.taxYear) === Number(selectedYear))
        ?.byCoins ?? [];
    const coins = byCoins.map((c) => c.coin).filter(Boolean);
    return ["All", ...Array.from(new Set(coins))];
  }, [summaries, selectedYear]);

  const filteredEvents = useMemo(() => {
    if (!selectedYear) return [];
    let rows = events.filter((e) => Number(e.taxYear) === Number(selectedYear));

    if (coinFilter !== "All") {
      rows = rows.filter((e) => e.soldCoin === coinFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((e) => {
        return (
          String(e.date || "").toLowerCase().includes(q) ||
          String(e.transactionType || "").toLowerCase().includes(q) ||
          String(e.soldCoin || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [events, selectedYear, coinFilter, query]);

  const selectedSummary = useMemo(() => {
    if (!selectedYear) return null;
    return summaries.find((s) => Number(s.taxYear) === Number(selectedYear));
  }, [summaries, selectedYear]);

  const toggleRow = (key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setAllRowsExpanded = (on) => {
    setExpandAll(on);
    if (!on) {
      setExpandedRows(new Set());
      return;
    }
    const next = new Set(filteredEvents.map((_, idx) => `${selectedYear}-${idx}`));
    setExpandedRows(next);
  };

  // Empty state before calculation
  if (!apiData) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your capital gains & losses</h2>
          <p className={styles.sub}>
            Paste transactions and click <b>Submit Transactions</b> to see results.
          </p>
        </div>

        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div>
            <div className={styles.emptyTitle}>No results yet</div>
            <div className={styles.emptyText}>
              Once you submit your transactions, your SARS tax-year totals will appear here.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No gains events at all
  if (!years.length) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your capital gains & losses</h2>
          <p className={styles.sub}>No capital gain events found.</p>
        </div>
      </div>
    );
  }

  // ======================
  // VIEW 1: SUMMARY CARDS
  // ======================
  if (!selectedYear) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your capital gains & losses</h2>
          <p className={styles.sub}>
            These are the gains and losses you must declare to SARS, grouped by tax year.
          </p>
        </div>

        <div className={styles.grid}>
          {years.map((y) => {
            const s = summaries.find((x) => Number(x.taxYear) === Number(y));
            const net = s?.netGain ?? s?.totalGain ?? 0;
            const byCoins = Array.isArray(s?.byCoins) ? s.byCoins : [];

            return (
              <div key={y} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardYear}>{y} Tax Year</div>
                    <div className={styles.cardRange}>{taxYearRange(y)}</div>
                  </div>

                  <div
                    className={`${styles.bigNumber} ${
                      Number(net) >= 0 ? styles.pos : styles.neg
                    }`}
                    title="Net capital gain for the tax year"
                  >
                    {fmtCurrency(net)}
                  </div>
                </div>

                <div className={styles.coinLines}>
                  {byCoins.length ? (
                    <>
                      {byCoins.slice(0, 4).map((c) => (
                        <div key={c.coin} className={styles.coinLine}>
                          <span className={styles.coinSym}>{c.coin}</span>
                          <span
                            className={`${styles.coinVal} ${
                              Number(c.netGain ?? c.totalGain ?? 0) >= 0 ? styles.pos : styles.neg
                            }`}
                          >
                            {fmtCurrency(c.netGain ?? c.totalGain ?? 0)}
                          </span>
                        </div>
                      ))}

                      {byCoins.length > 4 && (
                        <div className={styles.moreCoins}>+{byCoins.length - 4} more</div>
                      )}
                    </>
                  ) : (
                    <div className={styles.muted} style={{ fontSize: 12 }}>
                      No coin breakdown available for this year.
                    </div>
                  )}
                </div>


                <button
                  className={styles.primaryBtn}
                  onClick={() => {
                    setSelectedYear(y);
                    setCoinFilter("All");
                    setQuery("");
                    setExpandedRows(new Set());
                    setExpandAll(false);
                  }}
                >
                  View transactions
                </button>
              </div>
            );
          })}
        </div>

        <CompletionBanner />


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
          <h2 className={styles.title}>Your capital gains & losses</h2>
          <p className={styles.sub}>
            Showing <b>{selectedYear} Tax Year</b> ({taxYearRange(selectedYear)})
          </p>
        </div>

        <button
          className={styles.ghostBtn}
          onClick={() => {
            setSelectedYear(null);
            setExpandedRows(new Set());
            setExpandAll(false);
          }}
        >
          ← Back to tax years
        </button>
      </div>

              {/* Year summary mini card */}
        {selectedSummary && (
          <div className={styles.statementCard}>


            <div className={styles.statementSection}>
              <div className={styles.statementSectionTitle}>Summary</div>

              <div className={styles.kvGrid}>
                <div className={styles.k}>Total capital gain / loss</div>
                <div
                  className={`${styles.v} ${
                    Number(selectedSummary.netGain ?? selectedSummary.totalGain ?? 0) >= 0
                      ? styles.pos
                      : styles.neg
                  }`}
                >
                  {fmtCurrency(selectedSummary.netGain ?? selectedSummary.totalGain ?? 0)}
                </div>
              </div>
            </div>

            <div className={styles.statementSection}>
              <div className={styles.statementSectionTitle}>Breakdown by coin</div>

              <div className={styles.kvGrid}>
                {(selectedSummary.byCoins ?? []).map((c) => {
                  const val = Number(c.netGain ?? c.totalGain ?? 0);
                  return (
                    <div key={c.coin} className={styles.kvRow}>
                      <div className={styles.k}>{c.coin}</div>
                      <div className={`${styles.v} ${val >= 0 ? styles.pos : styles.neg}`}>
                        {fmtCurrency(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.statementFooter}>
              Amounts shown in ZAR. Values are calculated using FIFO (oldest coins first).
            </div>
          </div>
        )}


      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Coin</label>
          <select
            className={styles.select}
            value={coinFilter}
            onChange={(e) => setCoinFilter(e.target.value)}
          >
            {coinsForYear.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup} style={{ flex: 1 }}>
          <label className={styles.filterLabel}>Search</label>
          <input
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Date, Sold coin, Type…"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Transparency</label>
          <button
            className={styles.secondaryBtn}
            onClick={() => setAllRowsExpanded(!expandAll)}
          >
            {expandAll ? "Collapse all math" : "Expand all math"}
          </button>
        </div>
      </div>

      {/* Events table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <div className={styles.tableTitle}>Transactions that created this gain</div>
          <div className={styles.tableMeta}>{filteredEvents.length} events</div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>Date</th>
                <th>What happened</th>
                <th>Coin</th>
                <th className={styles.num}>Amount</th>
                <th className={styles.num}>Cost basis</th>
                <th className={styles.num}>Proceeds</th>
                <th className={styles.num}>Gain / Loss</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map((e, idx) => {
                const key = `${selectedYear}-${idx}`;
                const open = expandedRows.has(key);
                const gain = Number(e.capitalGain ?? 0);

                return (
                  <>
                    <tr key={key} className={styles.row}>
                      <td className={styles.chevCell}>
                        <button
                          className={styles.chevBtn}
                          onClick={() => toggleRow(key)}
                          aria-label={open ? "Hide calculation" : "Show calculation"}
                        >
                          {open ? "▾" : "▸"}
                        </button>
                      </td>

                      <td className={styles.mono}>{e.date}</td>

                      <td>
                        <span className={`${styles.pill} ${pillClass(e.transactionType)}`}>
                          {humanType(e.transactionType)}
                        </span>
                      </td>

                      <td className={styles.coinStrong}>{e.soldCoin}</td>

                      <td className={styles.num}>{fmtNumber(e.soldAmount, 8)}</td>
                      <td className={styles.num}>{fmtCurrency(e.costBasis)}</td>
                      <td className={styles.num}>{fmtCurrency(e.proceeds)}</td>

                      <td
                        className={`${styles.num} ${
                          gain >= 0 ? styles.pos : styles.neg
                        }`}
                      >
                        {fmtCurrency(gain)}
                      </td>
                    </tr>

                    {open && (
                      <tr className={styles.expandRow}>
                        <td />
                        <td colSpan={7}>
                          <div className={styles.mathBox}>
                            <div className={styles.mathTitle}>
                              Calculation (FIFO – oldest coins used first)
                            </div>

                            <div className={styles.mathSummary}>
                              <div>
                                <span className={styles.mathLabel}>Sold:</span>{" "}
                                <b>{fmtNumber(e.soldAmount, 8)} {e.soldCoin}</b>
                              </div>
                              <div>
                                <span className={styles.mathLabel}>Cost basis:</span>{" "}
                                <b>{fmtCurrency(e.costBasis)}</b>
                              </div>
                              <div>
                                <span className={styles.mathLabel}>Proceeds:</span>{" "}
                                <b>{fmtCurrency(e.proceeds)}</b>
                              </div>
                              <div>
                                <span className={styles.mathLabel}>Gain / Loss:</span>{" "}
                                <b className={gain >= 0 ? styles.pos : styles.neg}>
                                  {fmtCurrency(gain)}
                                </b>
                              </div>
                            </div>

                            <div className={styles.lotsTitle}>Lots used</div>

                            <div className={styles.lotsWrap}>
                              <table className={styles.lotsTable}>
                                <thead>
                                  <tr>
                                    <th>Buy date</th>
                                    <th className={styles.num}>Amount used</th>
                                    <th className={styles.num}>Buy price</th>
                                    <th className={styles.num}>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(e.lotsUsed ?? []).map((lot, i) => (
                                    <tr key={i}>
                                      <td className={styles.mono}>
                                        {lot.priceDate?.date ?? "-"}
                                      </td>
                                      <td className={styles.num}>
                                        {fmtNumber(lot.amount, 8)}
                                      </td>
                                      <td className={styles.num}>
                                        {fmtCurrency(
                                          Number(lot.pricePerCoin || 0) *
                                            Number(lot.amount || 0)
                                            ? lot.pricePerCoin
                                            : lot.pricePerCoin
                                        )}
                                      </td>
                                      <td className={styles.num}>
                                        {fmtCurrency(lot.costBasis)}
                                      </td>
                                    </tr>
                                  ))}
                                  {(!(e.lotsUsed ?? []).length) && (
                                    <tr>
                                      <td colSpan={4} className={styles.muted}>
                                        No lot breakdown available for this event.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className={styles.helperText}>
                             
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {!filteredEvents.length && (
                <tr>
                  <td colSpan={8} className={styles.muted} style={{ padding: 16 }}>
                    No events match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Done bar */}

    </div>
  );
}
