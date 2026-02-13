// utils/typePill.jsx
import React from "react";

/**
 * Factory that returns a TypePill component bound to your CSS module styles.
 */
export const makeTypePill = (styles) => {
  const TypePill = ({ type }) => {
    const t = String(type || "");
    const upper = t.toUpperCase();

    const pillStyle =
      upper === "BUY"
        ? styles.pillBuy
        : upper === "SELL"
          ? styles.pillSell
          : upper === "TRADE"
            ? styles.pillTrade
            : styles.pillDefault;

    return (
      <span className={`${styles.pill} ${pillStyle}`}>
        {t === "All" ? "All" : t}
      </span>
    );
  };

  return TypePill;
};
