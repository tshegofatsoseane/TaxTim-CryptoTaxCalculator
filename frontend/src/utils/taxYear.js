export const taxYearRange = (taxYear) => {
  const startYear = Number(taxYear) - 1;
  const endYear = Number(taxYear);

  const isLeap =
    (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0;

  const endDay = isLeap ? 29 : 28;

  return `1 Mar ${startYear} – ${endDay} Feb ${endYear}`;
};
