export function parseExcelText(text) {
  if (!text.trim()) return [];

  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        date: `${parts[0]} ${parts[1]}`,
        type: parts[2],
        sellCoin: parts[3],
        sellAmount: parts[4],
        buyCoin: parts[5],
        buyAmount: parts[6],
        price: parts.slice(7).join(" "),
      };
    });
}
