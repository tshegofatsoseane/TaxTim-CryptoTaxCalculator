// Transactions.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import styles from "./Transactions.module.css"
import InputScreen from "../InputScreen/InputScreen"
import Tooltip from "../../components/Tooltip/Tooltip"
import SarsPdfDownloadButton from "../SarsPdfDownloadButton/SarsPdfDownloadButton"

// ---------- helpers ----------
const fmtCurrency = (n) => {
  const val = Number(n || 0)
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return val < 0 ? `-R${formatted}` : `R${formatted}`
}

const fmtNum = (n, max = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: max })

/* ---------- inline SVGs ---------- */
function GainSvg({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* up-right arrow + baseline */}
      <path
        d="M4 13.5L9 8.5L12 11.5L16 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 7.5H16V11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LossSvg({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* down-right arrow */}
      <path
        d="M4 6.5L9 11.5L12 8.5L16 12.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 12.5H16V9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SpinnerSvg({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3a9 9 0 1 0 9 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * ✅ Animated rolling currency
 * - 300ms delay (dramatic effect)
 * - “Calculating…” shimmer during delay
 * - during rolling: show small spinner
 * - when complete: show Gain/Loss SVG (based on final value)
 * - negative “loss wobble” when complete (if value < 0)
 * - success pulse when complete (if value >= 0)
 */
function AnimatedCurrency({
  value,
  duration = 1100,
  delayMs = 300,
  formatter,
}) {
  const [phase, setPhase] = useState("idle") // idle | shimmer | rolling
  const [displayValue, setDisplayValue] = useState(0)
  const [completed, setCompleted] = useState(false)

  const startRef = useRef(null)
  const frameRef = useRef(null)
  const delayRef = useRef(null)

  const target = useMemo(() => Number(value || 0), [value])

  useEffect(() => {
    // reset
    startRef.current = null
    cancelAnimationFrame(frameRef.current)
    clearTimeout(delayRef.current)

    setPhase("shimmer")
    setCompleted(false)
    setDisplayValue(0)

    delayRef.current = setTimeout(() => {
      setPhase("rolling")

      const animate = (ts) => {
        if (!startRef.current) startRef.current = ts
        const elapsed = ts - startRef.current

        const t = Math.min(elapsed / duration, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)

        setDisplayValue(target * eased)

        if (t < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setCompleted(true)
          setDisplayValue(target)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delayMs)

    return () => {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(delayRef.current)
    }
  }, [target, duration, delayMs])

  if (phase === "shimmer") {
    return (
      <div className={styles.calcWrap}>
        <span className={styles.calcShimmer}>Calculating…</span>
        {/* icon area (no dot/tick) */}
        <span className={styles.resultIconWrap} aria-hidden="true">
          <SpinnerSvg className={styles.resultSpin} />
        </span>
      </div>
    )
  }

  const isNegative = target < 0

  return (
    <div
      className={[
        styles.calcWrap,
        completed && !isNegative ? styles.successPulse : "",
        completed && isNegative ? styles.lossWobble : "",
      ].join(" ")}
    >
      <span>{formatter(displayValue)}</span>

      {/* ✅ icon: spinner while rolling, then gain/loss svg on complete */}
      <span className={styles.resultIconWrap} aria-hidden="true">
        {!completed ? (
          <SpinnerSvg className={styles.resultSpin} />
        ) : isNegative ? (
          <LossSvg className={styles.lossIcon} />
        ) : (
          <GainSvg className={styles.gainIcon} />
        )}
      </span>
    </div>
  )
}

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
)

export default function Transactions({
  apiData,
  metadata,
  rawText,
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
    )
  }

  const transactions = apiData?.transactions ?? []
  const gainEvents = apiData?.capitalGainEvents ?? []
  const summaries = apiData?.taxYearSummaries ?? []

  // Collapsible table state
  const [isTableOpen, setIsTableOpen] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState("All")
  const [coinFilter, setCoinFilter] = useState("All")
  const [query, setQuery] = useState("")

  // Expand state for individual rows
  const [expanded, setExpanded] = useState(() => new Set())

  const rowKeys = useMemo(() => {
    return transactions.map((t, idx) => `${t.index ?? idx}-${t.date}-${t.type}`)
  }, [transactions])

  const eventLookup = useMemo(() => {
    const m = new Map()
    for (const e of gainEvents) {
      const key = `${e.date}|${e.transactionType}|${e.soldCoin}|${Number(
        e.soldAmount,
      )}`
      m.set(key, e)
    }
    return m
  }, [gainEvents])

  // Capital gain to declare to SARS (by year + total)
  const declaration = useMemo(() => {
    const byYear = new Map()

    if (Array.isArray(summaries) && summaries.length) {
      for (const s of summaries) {
        const y = Number(s.taxYear)
        if (!y) continue
        const net = Number(s.netGain ?? s.totalGain ?? 0)
        byYear.set(y, net)
      }
    } else {
      // fallback: sum events
      for (const e of gainEvents) {
        const y = Number(e.taxYear)
        if (!y) continue
        const g = Number(e.capitalGain ?? 0)
        byYear.set(y, (byYear.get(y) ?? 0) + g)
      }
    }

    const years = Array.from(byYear.keys()).sort((a, b) => b - a)
    const total = years.reduce((acc, y) => acc + (byYear.get(y) ?? 0), 0)

    const byYearRows = years.map((y) => {
      const amount = Number(byYear.get(y) ?? 0)
      return { taxYear: y, amount }
    })

    return { years, byYear, total, byYearRows }
  }, [summaries, gainEvents])

  // equation display terms (oldest -> newest reads better)
  const sortedTerms = useMemo(() => {
    return (declaration.byYearRows ?? [])
      .slice()
      .sort((a, b) => Number(a.taxYear) - Number(b.taxYear))
  }, [declaration.byYearRows])

  // Stats for summary cards
  const stats = useMemo(() => {
    const totalGains = gainEvents.filter((e) => Number(e.capitalGain) > 0).length
    const totalLosses = gainEvents.filter((e) => Number(e.capitalGain) < 0).length
    const totalSells = gainEvents.filter(
      (e) => String(e.transactionType || "").toUpperCase() === "SELL",
    ).length
    const totalTrades = gainEvents.filter(
      (e) => String(e.transactionType || "").toUpperCase() === "TRADE",
    ).length

    const totalGainAmount = gainEvents
      .filter((e) => Number(e.capitalGain) > 0)
      .reduce((sum, e) => sum + Number(e.capitalGain), 0)

    const totalLossAmount = gainEvents
      .filter((e) => Number(e.capitalGain) < 0)
      .reduce((sum, e) => sum + Number(e.capitalGain), 0)

    return {
      totalGains,
      totalLosses,
      totalSells,
      totalTrades,
      totalGainAmount,
      totalLossAmount,
      totalDisposals: totalSells + totalTrades,
    }
  }, [gainEvents])

  // Grandma clarity: how many SELL/TRADE events contribute per year
  const yearInfo = useMemo(() => {
    const counts = new Map()
    const gains = new Map()
    const losses = new Map()

    for (const e of gainEvents) {
      const y = Number(e.taxYear)
      if (!y) continue

      const tt = String(e.transactionType || "").toUpperCase()
      const isDisposal = tt === "SELL" || tt === "TRADE"
      if (!isDisposal) continue

      counts.set(y, (counts.get(y) ?? 0) + 1)

      const gain = Number(e.capitalGain)
      if (gain > 0) gains.set(y, (gains.get(y) ?? 0) + 1)
      else if (gain < 0) losses.set(y, (losses.get(y) ?? 0) + 1)
    }

    return { counts, gains, losses }
  }, [gainEvents])

  const coins = useMemo(() => {
    const set = new Set()
    for (const t of transactions) {
      if (t.buyCoin && t.buyCoin !== "ZAR") set.add(t.buyCoin)
      if (t.sellCoin && t.sellCoin !== "ZAR") set.add(t.sellCoin)
    }
    return ["All", ...Array.from(set).sort()]
  }, [transactions])

  const filtered = useMemo(() => {
    let rows = [...transactions]

    if (typeFilter !== "All") rows = rows.filter((t) => t.type === typeFilter)

    if (coinFilter !== "All") {
      rows = rows.filter(
        (t) => t.buyCoin === coinFilter || t.sellCoin === coinFilter,
      )
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      rows = rows.filter((t) => {
        return (
          String(t.date || "").toLowerCase().includes(q) ||
          String(t.type || "").toLowerCase().includes(q) ||
          String(t.buyCoin || "").toLowerCase().includes(q) ||
          String(t.sellCoin || "").toLowerCase().includes(q)
        )
      })
    }

    return rows
  }, [transactions, typeFilter, coinFilter, query])

  const filtersActive =
    typeFilter !== "All" || coinFilter !== "All" || Boolean(query.trim())

  const clearFilters = () => {
    setTypeFilter("All")
    setCoinFilter("All")
    setQuery("")
  }

  const isExpanded = (key) => expanded.has(key)

  const toggleRow = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allExpanded = expanded.size > 0 && rowKeys.every((k) => expanded.has(k))

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIntro}>
          <h2 className={styles.title}>Tax Summary</h2>
          <p className={styles.sub}>
            Your capital gains/losses calculated using FIFO (First In, First Out)
            method
          </p>
          {metadata?.transactionCount != null && (
            <p className={styles.sub}>
              Calculated from <b>{metadata.transactionCount}</b> transactions
              across <b>{(metadata.coinsTracked ?? []).length}</b> coins
            </p>
          )}
        </div>

        <div className={styles.headerActions}>
          <SarsPdfDownloadButton
            apiData={apiData}
            metadata={metadata}
            filename={`sars_crypto_summary_${declaration?.years?.[0] ?? "results"}`}
            label="Download SARS PDF"
            variant="ghost"
          />

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

      {/* Main Tax Declaration Card */}
      <div
        className={styles.taxDeclarationCard}
        role="note"
        aria-label="Capital gain to declare to SARS"
      >
        <div className={styles.taxDeclHeader}>
          <div className={styles.taxDeclBadge}>SARS Declaration</div>
          <Tooltip
            placement="bottom"
            content={
              <div>
                <strong>What is this?</strong>
                This is your total capital gain/loss that you need to declare to SARS. It's
                calculated using FIFO (First In, First Out) — when you sell or trade, we
                assume you sold your oldest coins first.
              </div>
            }
          >
            <button type="button" className={styles.helpIconBtn} aria-label="What is this?">
              ?
            </button>
          </Tooltip>
        </div>

        <div className={styles.taxDeclAmount}>
          <div className={styles.taxDeclLabel}>
            Total Capital Gain/Loss (This is what you declare to SARS)
          </div>

          <div
            className={`${styles.taxDeclValue} ${
              declaration.total >= 0 ? styles.pos : styles.neg
            }`}
          >
            <AnimatedCurrency
              value={declaration.total}
              duration={1100}
              delayMs={300}
              formatter={(v) => fmtCurrency(v)}
            />
          </div>

          {declaration.total >= 0 ? (
            <div className={styles.taxDeclHint}>
              You made a capital gain. This will be taxed at your marginal rate.
            </div>
          ) : (
            <div className={styles.taxDeclHint}>
              You made a capital loss. This can offset other capital gains.
            </div>
          )}
        </div>

        {/* Year-by-year breakdown */}
        {sortedTerms.length > 0 && (
          <div className={styles.yearBreakdown}>
            <div className={styles.yearBreakdownHeader}>
              <div className={styles.yearBreakdownTitle}>Breakdown by Tax Year</div>
              <Tooltip
                placement="bottom"
                content={
                  <div>
                    <strong>Tax Years Explained</strong>
                    Each tax year (Mar 1 – Feb 28/29) shows your net capital gain/loss from
                    SELL and TRADE events. BUY transactions create lots used later.
                  </div>
                }
              >
                <button
                  type="button"
                  className={styles.helpIconBtnSmall}
                  aria-label="Understanding tax years"
                >
                  ?
                </button>
              </Tooltip>
            </div>

            <div className={styles.yearCards}>
              {sortedTerms.map((row) => {
                const disposals = yearInfo.counts.get(Number(row.taxYear)) ?? 0
                const gainCount = yearInfo.gains.get(Number(row.taxYear)) ?? 0
                const lossCount = yearInfo.losses.get(Number(row.taxYear)) ?? 0

                return (
                  <div key={row.taxYear} className={styles.yearCard}>
                    <div className={styles.yearCardHeader}>
                      <div className={styles.yearCardYear}>{row.taxYear}</div>
                      <div
                        className={`${styles.yearCardAmount} ${
                          row.amount >= 0 ? styles.pos : styles.neg
                        }`}
                      >
                        {fmtCurrency(row.amount)}
                      </div>
                    </div>
                    <div className={styles.yearCardStats}>
                      <div className={styles.yearCardStat}>
                        <span className={styles.yearCardStatLabel}>Total disposals</span>
                        <span className={styles.yearCardStatValue}>{disposals}</span>
                      </div>
                      {gainCount > 0 && (
                        <div className={styles.yearCardStat}>
                          <span className={`${styles.yearCardStatLabel} ${styles.pos}`}>
                            Gains
                          </span>
                          <span className={`${styles.yearCardStatValue} ${styles.pos}`}>
                            {gainCount}
                          </span>
                        </div>
                      )}
                      {lossCount > 0 && (
                        <div className={styles.yearCardStat}>
                          <span className={`${styles.yearCardStatLabel} ${styles.neg}`}>
                            Losses
                          </span>
                          <span className={`${styles.yearCardStatValue} ${styles.neg}`}>
                            {lossCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Disposals</div>
          <div className={styles.statValue}>{stats.totalDisposals}</div>
          <div className={styles.statHint}>
            {stats.totalSells} sells • {stats.totalTrades} trades
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Profitable Events</div>
          <div className={`${styles.statValue} ${styles.pos}`}>{stats.totalGains}</div>
          <div className={styles.statHint}>Total: {fmtCurrency(stats.totalGainAmount)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Loss Events</div>
          <div className={`${styles.statValue} ${styles.neg}`}>{stats.totalLosses}</div>
          <div className={styles.statHint}>Total: {fmtCurrency(stats.totalLossAmount)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tax Years</div>
          <div className={styles.statValue}>{declaration.years.length}</div>
          <div className={styles.statHint}>
            {declaration.years.length > 0
              ? `${declaration.years[declaration.years.length - 1]} - ${declaration.years[0]}`
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className={styles.notesCard}>
        <div className={styles.notesHeader}>
          <div className={styles.notesTitle}>Important Notes</div>
        </div>
        <ul className={styles.notesList}>
          <li>
            <strong>FIFO Method:</strong> We calculate your gains using First In, First Out.
            When you sell crypto, we assume you're selling the oldest coins first.
          </li>
          <li>
            <strong>Tax Years:</strong> South African tax years run from March 1 to February 28/29.
            Your transactions are grouped accordingly.
          </li>
          <li>
            <strong>Capital Gains Tax:</strong> If you have a net gain, it will be included in
            your taxable income and taxed at your marginal rate. Only 40% of the gain is taxable
            for individuals.
          </li>
          <li>
            <strong>Verify Your Data:</strong> Always review your transaction history below to
            ensure all data is accurate before filing.
          </li>
        </ul>
      </div>

      {/* Collapsible Transactions Table */}
      <div className={styles.txCard}>
        <div
          className={styles.txHeaderCollapsible}
          onClick={() => setIsTableOpen(!isTableOpen)}
        >
          <div className={styles.txHeaderLeft}>
            <div className={styles.collapseIcon}>{isTableOpen ? "▼" : "▶"}</div>
            <div>
              <div className={styles.txTitle}>Transaction History</div>
              <div className={styles.txMeta}>
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                {filtersActive && " (filtered)"}
              </div>
            </div>
          </div>

          <div className={styles.txHeaderRight} onClick={(e) => e.stopPropagation()}>
            {isTableOpen && filtersActive && (
              <button type="button" className={styles.clearLink} onClick={clearFilters}>
                Clear filters
              </button>
            )}

            {isTableOpen && (
              <button
                type="button"
                className={styles.smallBtn}
                onClick={
                  allExpanded
                    ? () => setExpanded(new Set())
                    : () => setExpanded(new Set(rowKeys))
                }
                title="Show FIFO calculation for all rows"
              >
                {allExpanded ? "Hide all details" : "Show all details"}
              </button>
            )}
          </div>
        </div>

        {isTableOpen && (
          <>
            {/* Filters row */}
            <div className={styles.txFilters}>
              <div className={styles.txFiltersTop}>
                <div className={styles.txFiltersLabel}>Filters</div>
              </div>

              <div className={styles.filters}>
                {/* Type segmented pills */}
                <div className={styles.typeSeg} role="group" aria-label="Filter by type">
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
                    placeholder="Search date, coin, type..."
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {/* Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 150 }}>Date</th>
                    <th style={{ width: 80 }}>Type</th>
                    <th style={{ width: 120 }}>Sold</th>
                    <th style={{ width: 120 }}>Bought</th>
                    <th style={{ width: 120 }}>Price/Coin</th>
                    <th style={{ width: 120 }}>Total Value</th>
                    <th style={{ width: 120 }} className={styles.gainAnchor}>
                      Gain/Loss
                    </th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((tx, i) => {
                    const key = rowKeys[transactions.indexOf(tx)]
                    const open = isExpanded(key)

                    const maybeKey = `${tx.date}|${tx.type}|${tx.sellCoin}|${Number(
                      tx.sellAmount ?? 0,
                    )}`
                    const event = eventLookup.get(maybeKey)
                    const hasEvent = Boolean(event)
                    const canExpand = tx.type === "SELL" || tx.type === "TRADE" || tx.type === "BUY"

                    return (
                      <React.Fragment key={key}>
                        <tr className={styles.row}>
                          <td className={styles.cellIndex}>{tx.index ?? i + 1}</td>

                          <td className={styles.cellDate}>
                            <div className={styles.mono}>{tx.date ?? "-"}</div>
                          </td>

                          <td className={styles.cellType}>
                            <TypePill type={tx.type} />
                          </td>

                          <td className={styles.cellSold}>
                            {tx.sellAmount && tx.sellCoin ? (
                              <>
                                <div className={styles.mono}>{fmtNum(tx.sellAmount)}</div>
                                <div className={styles.coin}>{tx.sellCoin}</div>
                              </>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                          </td>

                          <td className={styles.cellBought}>
                            {tx.buyAmount && tx.buyCoin ? (
                              <>
                                <div className={styles.mono}>{fmtNum(tx.buyAmount)}</div>
                                <div className={styles.coin}>{tx.buyCoin}</div>
                              </>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                          </td>

                          <td className={styles.cellPrice}>
                            <div className={styles.mono}>{fmtCurrency(tx.buyPricePerCoin)}</div>
                          </td>

                          <td className={styles.cellTotal}>
                            <div className={styles.mono}>{fmtCurrency(tx.totalValue)}</div>
                          </td>

                          <td className={styles.cellGain}>
                            {hasEvent && event.capitalGain != null ? (
                              <div
                                className={`${styles.mono} ${
                                  Number(event.capitalGain) >= 0 ? styles.pos : styles.neg
                                }`}
                              >
                                {fmtCurrency(event.capitalGain)}
                              </div>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                          </td>

                          <td className={styles.cellActions}>
                            {canExpand && (
                              <button
                                type="button"
                                className={styles.detailsBtn}
                                onClick={() => toggleRow(key)}
                              >
                                {open ? "Hide" : "Details"}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* ✅ keeping your expanded details logic exactly as-is */}
                        {open && canExpand && (
                          <tr className={styles.expandRow}>
                            <td colSpan={9}>
                              <div className={styles.mathBox}>
                                {tx.type === "BUY" ? (
                                  <div className={styles.lotCreateCard}>
                                    <div className={styles.lotCreateTitle}>FIFO lot created</div>
                                    <div className={styles.kvGrid}>
                                      <div className={styles.k}>Coin</div>
                                      <div className={styles.v}>{tx.buyCoin ?? "-"}</div>

                                      <div className={styles.k}>Amount</div>
                                      <div className={styles.v}>{fmtNum(tx.buyAmount ?? 0)}</div>

                                      <div className={styles.k}>Price/coin</div>
                                      <div className={styles.v}>
                                        {fmtCurrency(tx.buyPricePerCoin ?? 0)}
                                      </div>

                                      <div className={styles.k}>Total paid</div>
                                      <div className={styles.v}>
                                        {fmtCurrency(
                                          typeof tx.getTotalValue === "function"
                                            ? tx.getTotalValue()
                                            : (tx.totalValue ?? 0),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className={styles.mathHeader}>
                                      <div>
                                        <div className={styles.mathTitle}>
                                          FIFO calculation for this {tx.type.toLowerCase()}
                                        </div>
                                        <div className={styles.mathSub}>
                                          How we calculated your capital gain/loss
                                        </div>
                                      </div>

                                      {hasEvent && (
                                        <div
                                          className={`${styles.gainChip} ${
                                            Number(event.capitalGain) >= 0
                                              ? styles.gainChipPos
                                              : styles.gainChipNeg
                                          }`}
                                        >
                                          {Number(event.capitalGain) >= 0 ? "Gain" : "Loss"}:{" "}
                                          {fmtCurrency(event.capitalGain)}
                                        </div>
                                      )}
                                    </div>

                                    <div className={styles.infoBanner}>
                                      <div className={styles.infoDot} />
                                      <div>
                                        <div className={styles.infoTitle}>What is this?</div>
                                        <div className={styles.infoText}>
                                          When you {tx.type.toLowerCase()} crypto, we calculate your
                                          gain/loss by comparing what you received (proceeds) to what
                                          you originally paid (cost basis). The cost basis comes from
                                          your oldest purchases (FIFO).
                                        </div>
                                      </div>
                                    </div>

                                    <div className={styles.stepGrid}>
                                      <div className={`${styles.stepCard} ${styles.stepSold}`}>
                                        <div className={styles.stepTop}>
                                          <span className={styles.stepBadge}>1</span>
                                          <div className={styles.stepLabel}>Amount sold</div>
                                        </div>
                                        <div className={styles.stepValue}>
                                          <span className={styles.stepCoin}>
                                            {fmtNum(tx.sellAmount ?? 0)}
                                          </span>{" "}
                                          {tx.sellCoin}
                                        </div>
                                        <div className={styles.stepHint}>Crypto you disposed of</div>
                                      </div>

                                      <div className={`${styles.stepCard} ${styles.stepProceeds}`}>
                                        <div className={styles.stepTop}>
                                          <span className={styles.stepBadge}>2</span>
                                          <div className={styles.stepLabel}>Proceeds</div>
                                        </div>
                                        <div className={styles.stepValue}>
                                          {fmtCurrency(event?.proceeds ?? 0)}
                                        </div>
                                        <div className={styles.stepHint}>
                                          What you received (market value)
                                        </div>
                                      </div>

                                      <div className={`${styles.stepCard} ${styles.stepCost}`}>
                                        <div className={styles.stepTop}>
                                          <span className={styles.stepBadge}>3</span>
                                          <div className={styles.stepLabel}>Cost basis</div>
                                        </div>
                                        <div className={styles.stepValue}>
                                          {fmtCurrency(event?.costBasis ?? 0)}
                                        </div>
                                        <div className={styles.stepHint}>What you originally paid (FIFO)</div>
                                      </div>
                                    </div>

                                    {event ? (
                                      <>
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

                                          <div className={`${styles.eqBox} ${styles.eqResult}`}>
                                            <div className={styles.eqLabel}>Capital Gain/Loss</div>
                                            <div
                                              className={`${styles.eqValue} ${
                                                Number(event.capitalGain) >= 0 ? styles.pos : styles.neg
                                              }`}
                                            >
                                              {fmtCurrency(event.capitalGain)}
                                            </div>
                                          </div>
                                        </div>

                                        <div className={styles.lotsBlock}>
                                          <div className={styles.lotsHeader}>
                                            <div className={styles.lotsTitle}>FIFO lots used</div>
                                            <div className={styles.lotsMeta}>
                                              {(event.lotsUsed ?? []).length
                                                ? `${(event.lotsUsed ?? []).length} lot${
                                                    (event.lotsUsed ?? []).length !== 1 ? "s" : ""
                                                  }`
                                                : "No lots"}
                                            </div>
                                          </div>

                                          {(event.lotsUsed ?? []).length ? (
                                            <>
                                              <ol className={styles.lotTimeline}>
                                                {(event.lotsUsed ?? []).map((lot, idx) => (
                                                  <li key={idx} className={styles.lotItem}>
                                                    <div className={styles.lotDot} />
                                                    <div className={styles.lotCard}>
                                                      <div className={styles.lotTopRow}>
                                                        <div className={styles.lotDate}>
                                                          Bought on{" "}
                                                          <span className={styles.mono}>
                                                            {lot.priceDate?.date ?? "-"}
                                                          </span>
                                                        </div>
                                                        <div className={styles.lotCost}>
                                                          <b>{fmtCurrency(lot.costBasis)}</b>
                                                        </div>
                                                      </div>

                                                      <div className={styles.lotGrid}>
                                                        <div className={styles.lotKV}>
                                                          <div className={styles.lotK}>Amount used</div>
                                                          <div className={`${styles.lotV} ${styles.mono}`}>
                                                            {fmtNum(lot.amount, 8)}
                                                          </div>
                                                        </div>

                                                        <div className={styles.lotKV}>
                                                          <div className={styles.lotK}>Buy price/coin</div>
                                                          <div className={`${styles.lotV} ${styles.mono}`}>
                                                            {fmtCurrency(lot.pricePerCoin)}
                                                          </div>
                                                        </div>

                                                        <div className={styles.lotKV}>
                                                          <div className={styles.lotK}>Lot cost</div>
                                                          <div className={`${styles.lotV} ${styles.mono}`}>
                                                            {fmtCurrency(lot.costBasis)}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </li>
                                                ))}
                                              </ol>

                                              <div className={styles.helperText}>
                                                Tax year: <b>{event.taxYear}</b>
                                              </div>
                                            </>
                                          ) : (
                                            <div className={styles.emptyLots}>
                                              No FIFO lot breakdown available
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className={styles.warn}>
                                        We couldn't match this transaction to a capital gain event.
                                        This can happen if multiple transactions share the exact same
                                        timestamp and amount.
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
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
          </>
        )}
      </div>
    </div>
  )
}
