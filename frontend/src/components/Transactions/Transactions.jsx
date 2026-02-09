// Transactions.jsx
import React, { useMemo, useState } from "react";
import styles from "./Transactions.module.css";
import InputScreen from "../InputScreen/InputScreen";

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
    {type === "All" ? "All" : type}
  </span>
);

export default function Transactions({
  apiData,
  metadata,
  rawText, // kept for compatibility
  onCalculate,
  onReset,
}) {
  // If no results yet, show the input screen inside this tab
  if (!apiData) {
    return (
      <div className={styles.page}>
        <InputScreen
          onCalculate={(parsed, payload, raw) =>
            onCalculate?.(parsed, payload, raw)
          }
        />
      </div>
    );
  }

  const transactions = apiData?.transactions ?? [];
  const gainEvents = apiData?.capitalGainEvents ?? [];
  const summaries = apiData?.taxYearSummaries ?? [];

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

  // Capital gain to declare to SARS (by year + total)
  const declaration = useMemo(() => {
    const byYear = new Map();

    if (Array.isArray(summaries) && summaries.length) {
      for (const s of summaries) {
        const y = Number(s.taxYear);
        if (!y) continue;
        const net = Number(s.netGain ?? s.totalGain ?? 0);
        byYear.set(y, net);
      }
    } else {
      // fallback: sum events
      for (const e of gainEvents) {
        const y = Number(e.taxYear);
        if (!y) continue;
        const g = Number(e.capitalGain ?? 0);
        byYear.set(y, (byYear.get(y) ?? 0) + g);
      }
    }

    const years = Array.from(byYear.keys()).sort((a, b) => b - a);
    const total = years.reduce((acc, y) => acc + (byYear.get(y) ?? 0), 0);

    // bar scaling (relative magnitude across years)
    const maxAbs = Math.max(
      1,
      ...years.map((y) => Math.abs(Number(byYear.get(y) ?? 0)))
    );

    const byYearRows = years.map((y) => {
      const amount = Number(byYear.get(y) ?? 0);
      const pct = (Math.abs(amount) / maxAbs) * 100;
      return { taxYear: y, amount, pct };
    });

    return { years, byYear, total, byYearRows };
  }, [summaries, gainEvents]);

  // equation display terms (oldest -> newest reads better)
  const sortedTerms = useMemo(() => {
    return (declaration.byYearRows ?? [])
      .slice()
      .sort((a, b) => Number(a.taxYear) - Number(b.taxYear));
  }, [declaration.byYearRows]);

  // Grandma clarity: how many SELL/TRADE events contribute per year
  const yearInfo = useMemo(() => {
    const counts = new Map();
    for (const e of gainEvents) {
      const y = Number(e.taxYear);
      if (!y) continue;

      const tt = String(e.transactionType || "").toUpperCase();
      const isDisposal = tt === "SELL" || tt === "TRADE";
      if (!isDisposal) continue;

      counts.set(y, (counts.get(y) ?? 0) + 1);
    }
    return counts;
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

  const filtersActive =
    typeFilter !== "All" || coinFilter !== "All" || Boolean(query.trim());

  const clearFilters = () => {
    setTypeFilter("All");
    setCoinFilter("All");
    setQuery("");
  };

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
      {/* Header */}
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
                That’s why we show the “lots used” breakdown.
              </span>
            </span>
          </div>

          <p className={styles.sub}>
            Open “Details” on a row to see how the calculation was done (when
            applicable).
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
            className={styles.ghostBtn}
            onClick={() => onReset?.()}
            title="Replace transactions"
            type="button"
          >
            Replace transactions
          </button>
        </div>
      </div>

      {/* SARS capital gain/loss (to declare) */}
      <div
        className={styles.sarsYearHero}
        role="note"
        aria-label="Capital gain to declare to SARS"
      >
        <div className={styles.sarsYearHeroTop}>
          <div className={styles.sarsYearTitle}>
            SARS capital gain/loss (to declare)
          </div>
        </div>

        <div
          className={`${styles.sarsYearBig} ${
            declaration.total >= 0 ? styles.pos : styles.neg
          }`}
        >
          {fmtCurrency(declaration.total)}
        </div>

        {/* Simple visual calculation */}
        {sortedTerms.length > 0 && (
          <div
            className={styles.declareEquation}
            aria-label="How the total is calculated"
          >
            <div className={styles.declareEquationLabelRow}>
              <div className={styles.declareEquationLabel}>
                How we got this total (what each year adds)
              </div>

              <span
                className={styles.helpIconInline}
                tabIndex={0}
                aria-label="What do these year totals mean?"
              >
                ?
                <span className={styles.tooltip}>
                  <strong>What do these mean?</strong>
                  Each year shows your net capital gain/loss from SELL and TRADE
                  events in that tax year. BUY transactions don’t create gains —
                  they only create cost lots used later.
                </span>
              </span>
            </div>

            <div className={styles.declareEquationRow}>
              {sortedTerms.map((row, i) => {
                const isLast = i === sortedTerms.length - 1;
                const disposals = yearInfo.get(Number(row.taxYear)) ?? 0;

                return (
                  <React.Fragment key={row.taxYear}>
                    <div className={styles.declareTerm}>
                      <div className={styles.declareTermTop}>
                        <span className={styles.declareTermYear}>
                          {row.taxYear}
                        </span>
                        <span
                          className={`${styles.declareTermVal} ${
                            row.amount >= 0 ? styles.pos : styles.neg
                          }`}
                          title={`${row.taxYear} net gain/loss`}
                        >
                          {fmtCurrency(row.amount)}
                        </span>
                      </div>

                      <div className={styles.declareTermSub}>
                        Net gain/loss for {row.taxYear} tax year
                        {disposals ? (
                          <span className={styles.declareTermMeta}>
                            {" "}
                            • {disposals} sales/trades
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {!isLast && <div className={styles.declareOp}>+</div>}
                    {isLast && <div className={styles.declareOp}>=</div>}
                  </React.Fragment>
                );
              })}

              <div className={styles.declareTotalPill}>
                <div className={styles.declareTotalLabel}>Total</div>
                <div
                  className={`${styles.declareTotalVal} ${
                    declaration.total >= 0 ? styles.pos : styles.neg
                  }`}
                >
                  {fmtCurrency(declaration.total)}
                </div>
              </div>
            </div>
          </div>
        )}

        <ul className={styles.sarsYearBullets}>
          <li>This is the total you’ll declare (summed across all tax years).</li>
          <li>
            Covers:{" "}
            {declaration.years?.length
              ? `${declaration.years[declaration.years.length - 1]}–${
                  declaration.years[0]
                } tax years`
              : "No tax years found"}
          </li>
        </ul>
      </div>

      {/* ✅ Combined Transactions card: header + filters + table */}
      <div className={styles.txCard}>
        {/* Card header */}
        <div className={styles.txHeader}>
          <div>
            <div className={styles.txTitle}>Transactions</div>
            <div className={styles.txMeta}>{filtered.length} rows</div>
          </div>

          <div className={styles.txHeaderRight}>
            {filtersActive && (
              <button
                type="button"
                className={styles.clearLink}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}

            <button
              type="button"
              className={styles.smallBtn}
              onClick={allExpanded ? collapseAll : expandAll}
              title="Show FIFO calculation for all rows"
            >
              {allExpanded ? "Hide calculations" : "Show calculations"}
            </button>
          </div>
        </div>

        {/* Filters row (inside the same card) */}
        <div className={styles.txFilters}>
          <div className={styles.txFiltersTop}>
            <div className={styles.txFiltersLabel}>Filters</div>
          </div>

          <div className={styles.filters}>
            {/* Type segmented pills */}
            <div
              className={styles.typeSeg}
              role="group"
              aria-label="Filter by type"
            >
              {["All", "BUY", "SELL", "TRADE"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.segBtn} ${
                    typeFilter === t ? styles.segActive : ""
                  }`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "All" ? "All" : t}
                </button>
              ))}
            </div>

            {/* Coin */}
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

            {/* Search */}
            <div className={styles.filterGroup} style={{ flex: 1 }}>
              <label className={styles.filterLabel}>Search</label>
              <input
                className={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search date, coin, type (e.g. BTC, SELL…)"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>Details</th>
                <th>Date</th>
                <th>Type</th>
                <th>Sell</th>

                <th className={styles.thNum}>
                  <span className={styles.thInnerRight}>Sell amount</span>
                </th>

                <th>Buy</th>

                <th className={styles.thNum}>
                  <span className={styles.thInnerRight}>Buy amount</span>
                </th>

                <th className={styles.thNum}>
                  <span className={styles.thInnerRight}>Price/coin</span>
                </th>

                <th className={styles.thNum}>
                  <span className={styles.thInnerRight}>Value</span>
                </th>

                <th className={styles.thNum}>
                  <span className={styles.thInnerRight}>Gain/Loss</span>
                </th>
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

                const gainVal = Number(event?.capitalGain ?? 0);
                const isDisposal = t.type === "SELL" || t.type === "TRADE";

                return (
                  <React.Fragment key={key}>
                    <tr className={styles.row}>
                      <td className={styles.chevCell}>
                        <button
                          className={styles.detailsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(key);
                          }}
                          aria-label={open ? "Hide details" : "Show details"}
                          title="See FIFO lots used"
                          type="button"
                        >
                          Details{" "}
                          <span aria-hidden="true">{open ? "▾" : "▸"}</span>
                        </button>
                      </td>

                      <td className={styles.mono}>{t.date}</td>

                      <td>
                        <TypePill type={t.type} />
                      </td>

                      <td className={styles.coinStrong}>{t.sellCoin}</td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        <span className={styles.tdInnerRight}>
                          {fmtNum(t.sellAmount, 8)}
                        </span>
                      </td>

                      <td className={styles.coinStrong}>{t.buyCoin}</td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        <span className={styles.tdInnerRight}>
                          {fmtNum(t.buyAmount, 8)}
                        </span>
                      </td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        <span className={styles.tdInnerRight}>
                          {fmtCurrency(t.buyPricePerCoin)}
                        </span>
                      </td>

                      <td className={`${styles.num} ${styles.mono}`}>
                        <span className={styles.tdInnerRight}>
                          {fmtCurrency(t.totalValue)}
                        </span>
                      </td>

                      <td
                        className={`${styles.num} ${styles.mono} ${styles.gainAnchor}`}
                      >
                        <span className={styles.tdInnerRight}>
                          {isDisposal ? (
                            <span
                              className={gainVal >= 0 ? styles.pos : styles.neg}
                            >
                              {fmtCurrency(gainVal)}
                            </span>
                          ) : (
                            <span className={styles.muted}>—</span>
                          )}
                        </span>
                      </td>
                    </tr>

                    {open && (
                      <tr className={styles.expandRow}>
                        <td />
                        <td colSpan={9}>
                          <div className={styles.mathBox}>
                            {/* Header */}
                            <div className={styles.mathHeader}>
                              <div>
                                <div className={styles.mathTitle}>
                                  {t.type === "BUY"
                                    ? "Buy breakdown"
                                    : "How we calculated this"}
                                </div>
                                <div className={styles.mathSub}>
                                  {t.type === "BUY"
                                    ? "Creates a cost lot (no capital gain event)."
                                    : "Oldest coins are used first (FIFO)."}
                                </div>
                              </div>

                              {t.type === "BUY" ? (
                                <div
                                  className={`${styles.tagChip} ${styles.tagChipInfo}`}
                                >
                                  No gain event
                                </div>
                              ) : (
                                <div
                                  className={`${styles.gainChip} ${
                                    gainVal >= 0
                                      ? styles.gainChipPos
                                      : styles.gainChipNeg
                                  }`}
                                  title="Gain/loss for this disposal"
                                >
                                  {gainVal >= 0 ? "Gain" : "Loss"}{" "}
                                  <b>{fmtCurrency(gainVal)}</b>
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
                                      It creates a FIFO lot that may be used
                                      later when you SELL/TRADE.
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.stepGrid}>
                                  <div
                                    className={`${styles.stepCard} ${styles.stepBuy}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>1</span>
                                      <div className={styles.stepLabel}>Bought</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtNum(t.buyAmount, 8)}{" "}
                                      <span className={styles.stepCoin}>
                                        {t.buyCoin}
                                      </span>
                                    </div>
                                    <div className={styles.stepHint}>
                                      Lot quantity.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepPaid}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>2</span>
                                      <div className={styles.stepLabel}>Base cost</div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(t.totalValue)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      Total lot cost.
                                    </div>
                                  </div>

                                  <div
                                    className={`${styles.stepCard} ${styles.stepPrice}`}
                                  >
                                    <div className={styles.stepTop}>
                                      <span className={styles.stepBadge}>3</span>
                                      <div className={styles.stepLabel}>
                                        Price/coin
                                      </div>
                                    </div>
                                    <div className={styles.stepValue}>
                                      {fmtCurrency(t.buyPricePerCoin)}
                                    </div>
                                    <div className={styles.stepHint}>
                                      Used for cost.
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.lotCreateCard}>
                                  <div className={styles.lotCreateTitle}>
                                    Cost lot created
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

                                    <div className={styles.k}>Price/coin</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {fmtCurrency(t.buyPricePerCoin)}
                                    </div>

                                    <div className={styles.k}>Base cost</div>
                                    <div className={`${styles.v} ${styles.mono}`}>
                                      {fmtCurrency(t.totalValue)}
                                    </div>
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
                                      Quantity disposed.
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
                                      Value received.
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
                                      FIFO lot costs (what you paid).
                                    </div>
                                  </div>
                                </div>

                                {event ? (
                                  <>
                                    <div className={styles.equationRow}>
                                      <div className={styles.eqBox}>
                                        <div className={styles.eqLabel}>
                                          Proceeds
                                        </div>
                                        <div className={styles.eqValue}>
                                          {fmtCurrency(event.proceeds)}
                                        </div>
                                      </div>

                                      <div className={styles.eqOp}>−</div>

                                      <div className={styles.eqBox}>
                                        <div className={styles.eqLabel}>
                                          Cost basis
                                        </div>
                                        <div className={styles.eqValue}>
                                          {fmtCurrency(event.costBasis)}
                                        </div>
                                      </div>

                                      <div className={styles.eqOp}>=</div>

                                      <div
                                        className={`${styles.eqBox} ${styles.eqResult}`}
                                      >
                                        <div className={styles.eqLabel}>
                                          Gain / Loss
                                        </div>
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

                                    <div className={styles.lotsBlock}>
                                      <div className={styles.lotsHeader}>
                                        <div className={styles.lotsTitle}>
                                          FIFO lots used
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
                                            {(event.lotsUsed ?? []).map(
                                              (lot, i) => (
                                                <li
                                                  key={i}
                                                  className={styles.lotItem}
                                                >
                                                  <div className={styles.lotDot} />
                                                  <div className={styles.lotCard}>
                                                    <div
                                                      className={styles.lotTopRow}
                                                    >
                                                      <div className={styles.lotDate}>
                                                        Buy date{" "}
                                                        <span className={styles.mono}>
                                                          {lot.priceDate?.date ??
                                                            "-"}
                                                        </span>
                                                      </div>
                                                      <div className={styles.lotCost}>
                                                        <b>
                                                          {fmtCurrency(
                                                            lot.costBasis
                                                          )}
                                                        </b>
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
                                                          Buy price/coin
                                                        </div>
                                                        <div
                                                          className={`${styles.lotV} ${styles.mono}`}
                                                        >
                                                          {fmtCurrency(
                                                            lot.pricePerCoin
                                                          )}
                                                        </div>
                                                      </div>

                                                      <div className={styles.lotKV}>
                                                        <div className={styles.lotK}>
                                                          Lot cost
                                                        </div>
                                                        <div
                                                          className={`${styles.lotV} ${styles.mono}`}
                                                        >
                                                          {fmtCurrency(
                                                            lot.costBasis
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </li>
                                              )
                                            )}
                                          </ol>

                                          <div className={styles.helperText}>
                                            Tax year: <b>{event.taxYear}</b>
                                          </div>
                                        </>
                                      ) : (
                                        <div className={styles.emptyLots}>
                                          No FIFO lot breakdown for this row.
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className={styles.warn}>
                                    We couldn’t match this row to a FIFO gain
                                    event (can happen if rows share the exact
                                    same timestamp/amount).
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
                  <td colSpan={10} className={styles.noRows}>
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
