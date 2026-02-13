// utils/capitalGainsHelpers.js
import styles from "../components/CapitalGains/CapitalGains.module.css"; // adjust path if needed

/**
 * Convert tax year to human-readable range (1 Mar YYYY – 28/29 Feb YYYY)
 */
export const taxYearRange = (taxYear) => {
  const startYear = Number(taxYear) - 1;
  const endYear = Number(taxYear);
  const isLeap =
    (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0;
  const endDay = isLeap ? 29 : 28;
  return `1 Mar ${startYear} – ${endDay} Feb ${endYear}`;
};

/**
 * Convert transaction type to human-readable label
 */
export const humanType = (t) => {
  if (t === "SELL") return "Sold";
  if (t === "TRADE") return "Traded";
  if (t === "BUY") return "Bought";
  return t || "-";
};

/**
 * Map transaction type to pill CSS class
 */
export const pillClass = (t) => {
  if (t === "SELL") return styles.pillSell;
  if (t === "TRADE") return styles.pillTrade;
  if (t === "BUY") return styles.pillBuy;
  return styles.pillDefault;
};
