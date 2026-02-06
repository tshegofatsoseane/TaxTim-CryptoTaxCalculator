// src/components/Transactions/Transactions.jsx
import React, { useMemo, useState } from "react";
import styles from "./Transactions.module.css";
import InputScreen from "../InPutScreen/InPutScreen";

// ---------- helpers ----------
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

export default function Transactions({
  apiData,
  metadata,
  rawText,
  onCalculate,
  onReset,
}) {
  // ✅ If no results yet, show the input screen *inside* this tab
  if (!apiData) {
    return (
      <div className={styles.page}>
        <InputScreen
          onCalculate={(parsed, payload, raw) => onCalculate?.(parsed, payload, raw)}
        />
      </div>
    );
  }

  const transactions = apiData?.transactions ?? [];
  const gainEvents = apiData?.capitalGainEvents ?? [];

  // Filters
  const [typeFilter, setTypeFilter] = useState("All");
  const [coinFilter, setCoinFilter] = useState("All");
  const [query, setQuery] = useState("");

  // Expand state
  const [expanded, setExpanded] = useState(() => new Set());

  const rowKeys = useMemo(() => {
    return transactions.map((t, idx) => `${t.index ?? idx}-${t.date}-${t.type}`);
  }, [transactions]);

  const eventLookup = useMemo(() => {
    const m = new Map();
    for (const e of gainEvents) {
      const key = `${e.date}|${e.transactionType}|${e.soldCoin}|${Number(
        e.soldAmount
      )}`;
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
  const allExpanded = expanded.size > 0 && rowKeys.every((k) => expanded.has(k));

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
            Expand a row to see the step-by-step SARS FIFO logic (where applicable).
          </p>

          {metadata?.transactionCount != null && (
            <p className={styles.sub}>
              Loaded <b>{metadata.transactionCount}</b> transactions across{" "}
              <b>{(metadata.coinsTracked ?? []).length}</b> coins.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={styles.expandAllBtn}
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? "Collapse all maths" : "Expand all maths"}
          </button>

          <button
            className={styles.expandAllBtn}
            style={{ background: "#111827" }}
            onClick={() => onReset?.()}
            title="Paste different transactions"
          >
            Paste new transactions
          </button>
        </div>
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
        <div className={styles.tableHeaderRow}>
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
                            {/* Header */}
                            <div className={styles.mathHeader}>
                              <div>
                                <div className={styles.mathTitle}>
                                  {t.type === "BUY"
                                    ? "Buy breakdown (creates a cost lot)"
                                    : "How SARS calculated this (FIFO)"}
                                </div>
                                <div className={styles.mathSub}>
                                  {t.type === "BUY"
                                    ? "BUY does not create a capital gain event. It creates a new lot that FIFO may use later."
                                    : "Oldest coins are used first. Here’s the exact breakdown for this disposal."}
                                </div>
                              </div>

                              {t.type === "BUY" ? (
                                <div
                                  className={`${styles.tagChip} ${styles.tagChipInfo}`}
                                >
                                  No CGT event
                                </div>
                              ) : (
                                <div
                                  className={`${styles.gainChip} ${
                                    Number(event?.capitalGain ?? 0) >= 0
                                      ? styles.gainChipPos
                                      : styles.gainChipNeg
                                  }`}
                                  title="Capital gain/loss for this event"
                                >
                                  {Number(event?.capitalGain ?? 0) >= 0
                                    ? "Gain"
                                    : "Loss"}
                                  : <b>{fmtCurrency(event?.capitalGain ?? 0)}</b>
                                </div>
                              )}
                            </div>

                            {/* BUY */}
                            {t.type === "BUY" && (
                              <>
                                <div className={styles.infoBanner}>
                                  <span
                                    className={styles.infoDot}
                                    aria-hidden="true"
                                  />
                                  <div>
                                    <div className={styles.infoTitle}>
                                      BUY does not create a capital gain event
                                    </div>
                                    <div className={styles.infoText}>
                                      SARS calculates capital gains when you{" "}
                                      <b>SELL</b> or <b>TRADE</b>. This BUY creates a{" "}
                                      <b>new cost lot</b> (base cost) that FIFO may use
                                      later.
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.stepGrid}>
                                  <div
                                    className={`${styles.stepCard} ${styles.stepBuy}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>1</span>
                                      <div className={styles.stepLabel}>You bought</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtNum(t.buyAmount, 8)}{" "}
                                      <span className={styles.stepCoin}>
                                        {t.buyCoin}
                                      </span>
                                    </div>
                                    <div className={styles.stepHint}>
                                      New FIFO lot is created at this quantity.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepPaid}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>2</span>
                                      <div className={styles.stepLabel}>You paid</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(t.totalValue)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      This becomes the lot’s total base cost.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepPrice}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>3</span>
                                      <div className={styles.stepLabel}>
                                        Price per coin
                                      </div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(t.buyPricePerCoin)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      Used to compute the base cost lot.
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.lotCreateCard}>
                                  <div className={styles.lotCreateTitle}>
                                    Cost lot created (base cost)
                                  </div>

                                  <div className={styles.kvGrid}>
                                    <div className={styles.k}>Buy date</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {t.date}
                                    </div>

                                    <div className={styles.k}>Quantity</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {fmtNum(t.buyAmount, 8)} {t.buyCoin}
                                    </div>

                                    <div className={styles.k}>Price per coin</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {fmtCurrency(t.buyPricePerCoin)}
                                    </div>

                                    <div className={styles.k}>Total base cost</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {fmtCurrency(t.totalValue)}
                                    </div>
                                  </div>

                                  <div className={styles.helperText}>
                                    Later, when you <b>SELL</b> or <b>TRADE</b>, FIFO
                                    will use your <b>oldest</b> lots first.
                                  </div>
                                </div>
                              </>
                            )}

                            {/* SELL / TRADE */}
                            {(t.type === "SELL" || t.type === "TRADE") && (
                              <>
                                <div className={styles.stepGrid}>
                                  <div
                                    className={`${styles.stepCard} ${styles.stepSold}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>1</span>
                                      <div className={styles.stepLabel}>Disposed</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtNum(t.sellAmount, 8)}{" "}
                                      <span className={styles.stepCoin}>
                                        {t.sellCoin}
                                      </span>
                                    </div>
                                    <div className={styles.stepHint}>
                                      What SARS treats as “sold/traded away”.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepProceeds}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>2</span>
                                      <div className={styles.stepLabel}>Proceeds</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(event?.proceeds ?? t.totalValue)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      Value received for the disposal.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepCost}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>3</span>
                                      <div className={styles.stepLabel}>Cost basis</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(event?.costBasis ?? 0)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      Sum of FIFO lot costs (oldest first).
                                    </div>
                                  </div>
                                </div>

                                {event && (
                                  <div className={styles.equationRow}>
                                    <div className={styles.eqBox}>
                                      <div className={styles.eqLabel}>Proceeds</div>
                                      <div className={styles.eqValue}>
                                        {fmtCurrency(event.proceeds)}
                                      </div>
                                    </div>

                                    <div className={styles.eqOp}>−</div>

                                    <div className={styles.eqBox}>
                                      <div className={styles.eqLabel}>Cost basis</div>
                                      <div className={styles.eqValue}>
                                        {fmtCurrency(event.costBasis)}
                                      </div>
                                    </div>

                                    <div className={styles.eqOp}>=</div>

                                    <div
                                      className={`${styles.eqBox} ${styles.eqResult}`}
                                    >
                                      <div className={styles.eqLabel}>Gain / Loss</div>
                                      <div
                                        className={`${styles.eqValue} ${
                                          Number(event.capitalGain) >= 0
                                            ? styles.pos
                                            : styles.neg
                                        }`}
                                      >
                                        {fmtCurrency(event.capitalGain)}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {event ? (
                                  <div className={styles.lotsBlock}>
                                    <div className={styles.lotsHeader}>
                                      <div className={styles.lotsTitle}>
                                        FIFO lots used (oldest first)
                                      </div>
                                      <div className={styles.lotsMeta}>
                                        {(event.lotsUsed ?? []).length
                                          ? `${(event.lotsUsed ?? []).length} lots`
                                          : "No lots provided"}
                                      </div>
                                    </div>

                                    {(event.lotsUsed ?? []).length ? (
                                      <>
                                        <ol className={styles.lotTimeline}>
                                          {(event.lotsUsed ?? []).map((lot, i) => (
                                            <li key={i} className={styles.lotItem}>
                                              <div className={styles.lotDot} />
                                              <div className={styles.lotCard}>
                                                <div className={styles.lotTopRow}>
                                                  <div className={styles.lotDate}>
                                                    Buy date:{" "}
                                                    <span className={styles.mono}>
                                                      {lot.priceDate?.date ?? "-"}
                                                    </span>
                                                  </div>
                                                  <div className={styles.lotCost}>
                                                    Cost:{" "}
                                                    <b>{fmtCurrency(lot.costBasis)}</b>
                                                  </div>
                                                </div>

                                                <div className={styles.lotGrid}>
                                                  <div className={styles.lotKV}>
                                                    <div className={styles.lotK}>
                                                      Amount used
                                                    </div>
                                                    <div
                                                      className={`${styles.lotV} ${styles.mono}`}
                                                    >
                                                      {fmtNum(lot.amount, 8)}
                                                    </div>
                                                  </div>

                                                  <div className={styles.lotKV}>
                                                    <div className={styles.lotK}>
                                                      Buy price / coin
                                                    </div>
                                                    <div
                                                      className={`${styles.lotV} ${styles.mono}`}
                                                    >
                                                      {fmtCurrency(lot.pricePerCoin)}
                                                    </div>
                                                  </div>

                                                  <div className={styles.lotKV}>
                                                    <div className={styles.lotK}>
                                                      Lot cost
                                                    </div>
                                                    <div
                                                      className={`${styles.lotV} ${styles.mono}`}
                                                    >
                                                      {fmtCurrency(lot.costBasis)}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </li>
                                          ))}
                                        </ol>

                                        <details className={styles.detailsWrap}>
                                          <summary className={styles.detailsSummary}>
                                            Show as table
                                          </summary>
                                          <div className={styles.lotsWrap}>
                                            <table className={styles.lotsTable}>
                                              <thead>
                                                <tr>
                                                  <th>Lot buy date</th>
                                                  <th className={styles.num}>Amount used</th>
                                                  <th className={styles.num}>Buy price/coin</th>
                                                  <th className={styles.num}>Cost</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {(event.lotsUsed ?? []).map((lot, i) => (
                                                  <tr key={i}>
                                                    <td className={styles.mono}>
                                                      {lot.priceDate?.date ?? "-"}
                                                    </td>
                                                    <td className={`${styles.num} ${styles.mono}`}>
                                                      {fmtNum(lot.amount, 8)}
                                                    </td>
                                                    <td className={`${styles.num} ${styles.mono}`}>
                                                      {fmtCurrency(lot.pricePerCoin)}
                                                    </td>
                                                    <td className={`${styles.num} ${styles.mono}`}>
                                                      {fmtCurrency(lot.costBasis)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </details>

                                        <div className={styles.helperText}>
                                          FIFO means your <b>oldest</b> buys are used first.{" "}
                                          Tax year: <b>{event.taxYear}</b>
                                        </div>
                                      </>
                                    ) : (
                                      <div className={styles.emptyLots}>
                                        We don’t have a FIFO lot breakdown for this row, but totals
                                        above are still shown.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className={styles.warn}>
                                    We couldn’t match this row to a FIFO gain event (this can happen if
                                    multiple trades share the exact same timestamp/amount).
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
