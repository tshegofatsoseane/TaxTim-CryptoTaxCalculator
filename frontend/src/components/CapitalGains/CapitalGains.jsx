// CapitalGains.jsx
import { useMemo, useState } from "react";
import styles from "./CapitalGains.module.css";
import CompletionBanner from "../Completionbanner/CompletionBanner";
import InfoModal from "../../components/InfoModal/InfoModal";

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

  // ✅ Help modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  // ✅ Capital gain to declare to SARS (all years)
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
      for (const e of events) {
        const y = Number(e.taxYear);
        if (!y) continue;
        const g = Number(e.capitalGain ?? 0);
        byYear.set(y, (byYear.get(y) ?? 0) + g);
      }
    }

    const yearList = Array.from(byYear.keys()).sort((a, b) => b - a);
    const total = yearList.reduce((acc, y) => acc + (byYear.get(y) ?? 0), 0);

    const selectedVal = selectedYear
      ? Number(byYear.get(Number(selectedYear)) ?? 0)
      : null;

    return { yearList, byYear, total, selectedVal };
  }, [summaries, events, selectedYear]);

  const selectedSummary = useMemo(() => {
    if (!selectedYear) return null;
    return summaries.find((s) => Number(s.taxYear) === Number(selectedYear));
  }, [summaries, selectedYear]);

  // ✅ Example calc: use first matching event from the current view if possible
  const exampleEvent = useMemo(() => {
    const pickFrom = selectedYear ? filteredEvents : events;
    const e = (pickFrom ?? []).find((x) => {
      const t = String(x.transactionType || "").toUpperCase();
      return (t === "SELL" || t === "TRADE") && x.proceeds != null && x.costBasis != null;
    });
    return e || null;
  }, [selectedYear, filteredEvents, events]);

  const HelpContent = (
    <div>
      <p className={styles.helpP}>
        SARS treats <b>selling</b> or <b>trading</b> crypto as a “disposal”.
        When you dispose of crypto, you must calculate a <b>capital gain or loss</b>.
      </p>

      <div className={styles.helpNote}>
        Simple rule: <b>Gain/Loss = Proceeds − Cost basis</b>
      </div>

      <p className={styles.helpP}>
        <b>Proceeds</b> = the value you received when you sold/traded. <br />
        <b>Cost basis</b> = what you originally paid for those coins. We calculate cost basis
        using <b>FIFO</b> (oldest coins first).
      </p>

      <div className={styles.helpExample}>
        <div className={styles.helpExampleTitle}>
          Example {exampleEvent ? "using your data" : ""}
        </div>

        {exampleEvent ? (
          <>
            <div className={styles.helpExampleText}>
              On <b>{exampleEvent.date}</b> you {String(exampleEvent.transactionType || "").toLowerCase()}{" "}
              <b>{fmtNumber(exampleEvent.soldAmount, 8)} {exampleEvent.soldCoin}</b>
            </div>

            <div className={styles.helpCalcRow}>
              <div className={styles.helpCalcBox}>
                <div className={styles.helpCalcLabel}>Proceeds</div>
                <div className={styles.helpCalcValue}>{fmtCurrency(exampleEvent.proceeds)}</div>
              </div>

              <div className={styles.helpCalcOp}>−</div>

              <div className={styles.helpCalcBox}>
                <div className={styles.helpCalcLabel}>Cost basis</div>
                <div className={styles.helpCalcValue}>{fmtCurrency(exampleEvent.costBasis)}</div>
              </div>

              <div className={styles.helpCalcOp}>=</div>

              <div className={styles.helpCalcBox}>
                <div className={styles.helpCalcLabel}>Gain / Loss</div>
                <div
                  className={`${styles.helpCalcValue} ${
                    Number(exampleEvent.capitalGain ?? 0) >= 0 ? styles.pos : styles.neg
                  }`}
                >
                  {fmtCurrency(exampleEvent.capitalGain)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.helpExampleText}>
              If you sell for <b>R12,000</b> and the coins originally cost you <b>R9,000</b>:
            </div>
            <div className={styles.helpCalcSimple}>
              R12,000 − R9,000 = <b>R3,000 gain</b>
            </div>
          </>
        )}
      </div>

      <div className={styles.helpFooterHint}>
        The number you declare to SARS is your <b>net capital gain/loss</b> per tax year
        (1 March → end Feb), and the app totals it for you.
      </div>
    </div>
  );

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
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Your capital gains & losses</h2>
            <p className={styles.sub}>
              Paste transactions and click <b>Submit Transactions</b> to see results.
            </p>
          </div>

          <button type="button" className={styles.helpBtn} onClick={() => setIsHelpOpen(true)}>
            What is this?
          </button>
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

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="How crypto capital gains work"
          primaryText="Got it"
          maxWidth={620}
        >
          {HelpContent}
        </InfoModal>
      </div>
    );
  }

  // No gains events at all
  if (!years.length) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Your capital gains & losses</h2>
            <p className={styles.sub}>No capital gain events found.</p>
          </div>

          <button type="button" className={styles.helpBtn} onClick={() => setIsHelpOpen(true)}>
            What is this?
          </button>
        </div>

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="How crypto capital gains work"
          primaryText="Got it"
          maxWidth={620}
        >
          {HelpContent}
        </InfoModal>
      </div>
    );
  }

  // ======================
  // VIEW 1: SUMMARY CARDS
  // ======================
  if (!selectedYear) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Your capital gains & losses</h2>
            <p className={styles.sub}>
              These are the gains and losses you must declare to SARS, grouped by tax year.
            </p>
          </div>

          <button type="button" className={styles.helpBtn} onClick={() => setIsHelpOpen(true)}>
            What is this?
          </button>
        </div>

        {/* ✅ Big “declare to SARS” card */}
        {!!declaration.yearList.length && (
          <div
            className={styles.sarsHero}
            role="note"
            aria-label="Capital gain to declare to SARS"
          >
            <div className={styles.sarsHeroTop}>
              <div>
                <div className={styles.sarsHeroTitle}>Capital gain to declare to SARS</div>
                <div className={styles.sarsHeroSub}>
                  This is the total capital gain/loss you enter on your <b>SARS return</b>.
                </div>
              </div>

              <div
                className={`${styles.sarsPillAmount} ${
                  declaration.total >= 0 ? styles.pos : styles.neg
                }`}
              >
                {fmtCurrency(declaration.total)}
              </div>
            </div>

            <div className={styles.sarsHeroMeta}>
              Amounts shown in ZAR. This is <b>not</b> your final tax payable.
            </div>
          </div>
        )}

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
                              Number(c.netGain ?? c.totalGain ?? 0) >= 0
                                ? styles.pos
                                : styles.neg
                            }`}
                          >
                            {fmtCurrency(c.netGain ?? c.totalGain ?? 0)}
                          </span>
                        </div>
                      ))}

                      {byCoins.length > 4 && (
                        <div className={styles.moreCoins}>
                          +{byCoins.length - 4} more
                        </div>
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

        <InfoModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="How crypto capital gains work"
          primaryText="Got it"
          maxWidth={620}
        >
          {HelpContent}
        </InfoModal>
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

        <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>

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

          <button type="button" className={styles.helpBtn} onClick={() => setIsHelpOpen(true)}>
            What is this?
          </button>

        </div>
      </div>

      {/* Year summary mini card */}
      {selectedSummary && (
        <div className={styles.statementCard}>
          <div className={styles.statementSection}>
            <div className={styles.statementSectionTitle}>Summary</div>

            <div className={styles.kvGrid}>
              <div className={styles.k}>This is what you declare to SARS</div>
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

                      <td className={`${styles.num} ${gain >= 0 ? styles.pos : styles.neg}`}>
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
                                <b>
                                  {fmtNumber(e.soldAmount, 8)} {e.soldCoin}
                                </b>
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
                                    <th className={styles.num}>Buy price/coin</th>
                                    <th className={styles.num}>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(e.lotsUsed ?? []).map((lot, i) => (
                                    <tr key={i}>
                                      <td className={styles.mono}>{lot.priceDate?.date ?? "-"}</td>
                                      <td className={styles.num}>{fmtNumber(lot.amount, 8)}</td>
                                      <td className={styles.num}>{fmtCurrency(lot.pricePerCoin)}</td>
                                      <td className={styles.num}>{fmtCurrency(lot.costBasis)}</td>
                                    </tr>
                                  ))}

                                  {!(e.lotsUsed ?? []).length && (
                                    <tr>
                                      <td colSpan={4} className={styles.muted} style={{ padding: 10 }}>
                                        No lot breakdown available for this event.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className={styles.helperText}>
                              Gain/Loss = Proceeds − Cost basis. Cost basis is FIFO (oldest lots first).
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

      <InfoModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="How crypto capital gains work"
        primaryText="Got it"
        maxWidth={620}
      >
        {HelpContent}
      </InfoModal>
    </div>
  );
}
