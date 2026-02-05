// Transactions.jsx
import React, { useMemo, useState } from "react";
import styles from "./Transactions.module.css";

const fmtCurrency = (n) => {
  const val = Number(n || 0);
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R${formatted}` : `R${formatted}`;
};

const fmtNum = (n, max = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: max });

const TypePill = ({ type }) => (
  <span
    className={`${styles.pill} ${
      type === "BUY"
        ? styles.pillBuy
        : type === "SELL"
        ? styles.pillSell
        : type === "TRADE"
        ? styles.pillTrade
        : styles.pillDefault
    }`}
  >
    {type}
  </span>
);

export default function Transactions({ apiData }) {
  const transactions = apiData?.transactions ?? [];
  const gainEvents = apiData?.capitalGainEvents ?? [];

  // Filters
  const [typeFilter, setTypeFilter] = useState("All");
  const [coinFilter, setCoinFilter] = useState("All");
  const [query, setQuery] = useState("");

  // Expand state
  const [expanded, setExpanded] = useState(() => new Set());

  // Build stable row keys + list for Expand All
  const rowKeys = useMemo(() => {
    return transactions.map((t, idx) => `${t.index ?? idx}-${t.date}-${t.type}`);
  }, [transactions]);

  // Match a transaction to a gain event (SELL/TRADE) by (date, type, soldCoin, soldAmount)
  const eventLookup = useMemo(() => {
    const m = new Map();
    for (const e of gainEvents) {
      const key = `${e.date}|${e.transactionType}|${e.soldCoin}|${Number(e.soldAmount)}`;
      m.set(key, e);
    }
    return m;
  }, [gainEvents]);

  const coins = useMemo(() => {
    const set = new Set();
    for (const t of transactions) {
      if (t.buyCoin && t.buyCoin !== "ZAR") set.add(t.buyCoin);
      if (t.sellCoin && t.sellCoin !== "ZAR") set.add(t.sellCoin);
    }
    return ["All", ...Array.from(set).sort()];
  }, [transactions]);

  const filtered = useMemo(() => {
    let rows = [...transactions];

    if (typeFilter !== "All") rows = rows.filter((t) => t.type === typeFilter);

    if (coinFilter !== "All") {
      rows = rows.filter(
        (t) => t.buyCoin === coinFilter || t.sellCoin === coinFilter
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((t) => {
        return (
          String(t.date || "").toLowerCase().includes(q) ||
          String(t.type || "").toLowerCase().includes(q) ||
          String(t.buyCoin || "").toLowerCase().includes(q) ||
          String(t.sellCoin || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [transactions, typeFilter, coinFilter, query]);

  const isExpanded = (key) => expanded.has(key);

  const toggleRow = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(rowKeys));
  const collapseAll = () => setExpanded(new Set());

  const allExpanded =
    expanded.size > 0 && rowKeys.every((k) => expanded.has(k));

  if (!apiData) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Transactions</h2>
        <p className={styles.sub}>
          Paste your transactions and click <b>Submit Transactions</b> to see
          results.
        </p>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Transactions</h2>
        <p className={styles.sub}>No transactions returned by the API.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.help}>
            <h2 className={styles.title}>Your transactions</h2>

            <span
              className={styles.helpIcon}
              tabIndex={0}
              aria-label="What is FIFO?"
            >
              ?
              <span className={styles.tooltip}>
                <strong>What is FIFO?</strong>
                FIFO means “First In, First Out”. When you sell or trade crypto,
                SARS assumes you sold your <b>oldest</b> coins first.
                <br />
                <br />
                Example: If you bought BTC twice, the first purchase is used up
                first when you sell. That’s why we show the “lots used”
                breakdown — it explains exactly which buys were used to
                calculate your gain/loss.
              </span>
            </span>
          </div>

          <p className={styles.sub}>
            Expand a row to see the step-by-step maths SARS FIFO uses (where
            applicable).
          </p>
        </div>

        <button
          className={styles.expandAllBtn}
          onClick={allExpanded ? collapseAll : expandAll}
        >
          {allExpanded ? "Collapse all maths" : "Expand all maths"}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
            <option value="TRADE">TRADE</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Coin</label>
          <select
            className={styles.select}
            value={coinFilter}
            onChange={(e) => setCoinFilter(e.target.value)}
          >
            {coins.map((c) => (
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
            placeholder="Search date, BTC, ETH, BUY…"
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Transactions</div>
          <div className={styles.tableMeta}>{filtered.length} rows</div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>Date</th>
                <th>Type</th>
                <th>Sell</th>
                <th className={styles.num}>Sell amount</th>
                <th>Buy</th>
                <th className={styles.num}>Buy amount</th>
                <th className={styles.num}>Price/coin</th>
                <th className={styles.num}>Value</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t, idx) => {
                const key = `${t.index ?? idx}-${t.date}-${t.type}`;
                const open = isExpanded(key);

                const matchKey = `${t.date}|${t.type}|${t.sellCoin}|${Number(
                  t.sellAmount
                )}`;
                const event = eventLookup.get(matchKey);

                return (
                  <React.Fragment key={key}>
                    <tr className={styles.row}>
                      <td className={styles.chevCell}>
                        <button
                          className={styles.chevBtn}
                          onClick={() => toggleRow(key)}
                          aria-label={open ? "Hide maths" : "Show maths"}
                        >
                          {open ? "▾" : "▸"}
                        </button>
                      </td>

                      <td className={styles.mono}>{t.date}</td>
                      <td>
                        <TypePill type={t.type} />
                      </td>

                      <td className={styles.coinStrong}>{t.sellCoin}</td>
                      <td className={`${styles.num} ${styles.mono}`}>
                        {fmtNum(t.sellAmount, 8)}
                      </td>

                      <td className={styles.coinStrong}>{t.buyCoin}</td>
                      <td className={`${styles.num} ${styles.mono}`}>
                        {fmtNum(t.buyAmount, 8)}
                      </td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        {fmtCurrency(t.buyPricePerCoin)}
                      </td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        {fmtCurrency(t.totalValue)}
                      </td>
                    </tr>

                    {open && (
                      <tr className={styles.expandRow}>
                        <td />
                        <td colSpan={8}>
                          <div className={styles.mathBox}>
                            <div className={styles.mathTitle}>
                              Maths (step-by-step)
                            </div>

                            {/* BUY maths */}
                            {t.type === "BUY" && (
                              <>
                                <div className={styles.mathLine}>
                                  You bought{" "}
                                  <b>
                                    {fmtNum(t.buyAmount, 8)} {t.buyCoin}
                                  </b>{" "}
                                  using{" "}
                                  <b>
                                    {fmtCurrency(t.sellAmount)} {t.sellCoin}
                                  </b>
                                  .
                                </div>

                                <div className={styles.mathLine}>
                                  Price per coin:{" "}
                                  <b>{fmtCurrency(t.buyPricePerCoin)}</b>
                                </div>

                                <div className={styles.mathCalc}>
                                  Base cost lot created:
                                  <div className={styles.calcRow}>
                                    <span className={styles.calcLeft}>
                                      {fmtNum(t.buyAmount, 8)} ×{" "}
                                      {fmtCurrency(t.buyPricePerCoin)}
                                    </span>
                                    <span className={styles.calcRight}>
                                      = {fmtCurrency(t.totalValue)}
                                    </span>
                                  </div>
                                </div>

                                <div className={styles.hint}>
                                  (BUY transactions don’t create a capital gain
                                  event.)
                                </div>
                              </>
                            )}

                            {/* SELL/TRADE maths */}
                            {(t.type === "SELL" || t.type === "TRADE") && (
                              <>
                                <div className={styles.mathLine}>
                                  You disposed of{" "}
                                  <b>
                                    {fmtNum(t.sellAmount, 8)} {t.sellCoin}
                                  </b>{" "}
                                  and received{" "}
                                  <b>
                                    {fmtNum(t.buyAmount, 8)} {t.buyCoin}
                                  </b>
                                  .
                                </div>

                                <div className={styles.mathLine}>
                                  Proceeds (value received) ={" "}
                                  <b>
                                    {fmtCurrency(event?.proceeds ?? t.totalValue)}
                                  </b>
                                </div>

                                {event ? (
                                  <>
                                    <div className={styles.mathCalc}>
                                      FIFO lots used (oldest first):
                                      <div className={styles.lotsWrap}>
                                        <table className={styles.lotsTable}>
                                          <thead>
                                            <tr>
                                              <th>Lot buy date</th>
                                              <th className={styles.num}>
                                                Amount used
                                              </th>
                                              <th className={styles.num}>
                                                Buy price/coin
                                              </th>
                                              <th className={styles.num}>
                                                Cost
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(event.lotsUsed ?? []).map(
                                              (lot, i) => (
                                                <tr key={i}>
                                                  <td className={styles.mono}>
                                                    {lot.priceDate?.date ?? "-"}
                                                  </td>
                                                  <td
                                                    className={`${styles.num} ${styles.mono}`}
                                                  >
                                                    {fmtNum(lot.amount, 8)}
                                                  </td>
                                                  <td
                                                    className={`${styles.num} ${styles.mono}`}
                                                  >
                                                    {fmtCurrency(lot.pricePerCoin)}
                                                  </td>
                                                  <td
                                                    className={`${styles.num} ${styles.mono}`}
                                                  >
                                                    {fmtCurrency(lot.costBasis)}
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    <div className={styles.mathCalc}>
                                      Cost basis (sum of lot costs):
                                      <div className={styles.calcRow}>
                                        <span className={styles.calcLeft}>
                                          Total cost basis
                                        </span>
                                        <span className={styles.calcRight}>
                                          = {fmtCurrency(event.costBasis)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className={styles.mathCalc}>
                                      Capital gain / loss:
                                      <div className={styles.calcRow}>
                                        <span className={styles.calcLeft}>
                                          Proceeds − Cost basis
                                        </span>
                                        <span
                                          className={`${styles.calcRight} ${styles.finalResult} ${
                                            Number(event.capitalGain) >= 0
                                              ? styles.pos
                                              : styles.neg
                                          }`}
                                        >
                                          = {fmtCurrency(event.capitalGain)}
                                        </span>
                                      </div>
                                      <div className={styles.hint}>
                                        Tax year: <b>{event.taxYear}</b>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className={styles.warn}>
                                    We couldn’t match this row to a FIFO gain
                                    event (this can happen if multiple trades
                                    share the exact same timestamp/amount).
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={9} className={styles.noRows}>
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
