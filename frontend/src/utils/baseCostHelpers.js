/**
 * Sort base cost boundaries descending by taxYear
 * @param {Array} boundaries
 * @returns {Array}
 */
export const sortBoundaries = (boundaries = []) => {
  return [...boundaries].sort((a, b) => Number(b.taxYear) - Number(a.taxYear));
};

/**
 * Get selected boundary data by taxYear
 * @param {Array} sortedBoundaries
 * @param {string|number|null} selectedTaxYear
 * @returns {Object|null}
 */
export const getSelectedBoundary = (sortedBoundaries, selectedTaxYear) => {
  if (!selectedTaxYear) return null;
  return sortedBoundaries.find(
    (x) => Number(x.taxYear) === Number(selectedTaxYear)
  ) ?? null;
};

/**
 * Calculate total base cost for a boundary
 * @param {Object|null} boundary
 * @returns {number}
 */
export const getTotalForBoundary = (boundary) => {
  const coins = boundary?.coins ?? [];
  return coins.reduce((sum, c) => sum + Number(c.costBasis || 0), 0);
};

/**
 * Create example data for the help modal using first two coins
 * @param {Array} sortedBoundaries
 * @returns {Object|null}
 */
export const getExampleData = (sortedBoundaries) => {
  if (!sortedBoundaries.length) return null;

  const first = sortedBoundaries[0];
  const coins = (first.coins ?? []).slice(0, 2);
  if (!coins.length) return null;

  return {
    date: first.date,
    items: coins.map((c) => ({
      coin: c.coin,
      amount: c.amount,
      cost: c.costBasis,
    })),
    total: coins.reduce((sum, c) => sum + Number(c.costBasis || 0), 0),
  };
};
