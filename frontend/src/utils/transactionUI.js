export const humanType = (t) => {
  const type = String(t || "").toUpperCase();
  if (type === "SELL") return "Sold";
  if (type === "TRADE") return "Traded";
  if (type === "BUY") return "Bought";
  return t || "-";
};

/**
 * Returns the CSS module class for the transaction "pill".
 * IMPORTANT: pass `styles` from the component so this util stays UI-framework-agnostic.
 */
export const pillClass = (t, styles) => {
  const type = String(t || "").toUpperCase();
  if (type === "SELL") return styles.pillSell;
  if (type === "TRADE") return styles.pillTrade;
  if (type === "BUY") return styles.pillBuy;
  return styles.pillDefault;
};
