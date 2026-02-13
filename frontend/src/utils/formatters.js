/**
 * Format number as ZAR currency
 * @param {number|string} n
 * @returns {string}
 */
export const fmtCurrency = (n) => {
  const val = Number(n || 0);
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R${formatted}` : `R${formatted}`;
};

/**
 * Format number with max decimal places
 * @param {number|string} n
 * @param {number} maxDecimals
 * @returns {string}
 */
export const fmtNumber = (n, maxDecimals = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: maxDecimals });
