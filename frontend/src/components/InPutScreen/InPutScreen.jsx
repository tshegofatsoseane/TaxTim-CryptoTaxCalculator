import { useState } from "react";
import { parseExcelText } from "../../utils/excelParser.jsx";// ✅ fixed path
import styles from "./InputScreen.module.css";

export default function InputScreen({ onCalculate }) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!rawText || rawText.trim().length < 10) {
      setError("Please paste valid Excel data (minimum 10 characters).");
      return;
    }

    const parsed = parseExcelText(rawText);
    if (!parsed.length) {
      setError("Please paste valid Excel data.");
      return;
    }

    setLoading(true);

    try {

      const response = await fetch("/api/crypto-tax/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ transactions: rawText }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        const msg =
          payload?.errors?.transactions?.[0] ||
          payload?.error ||
          payload?.message ||
          `API error: ${response.status}`;
        throw new Error(msg);
      }

      // ✅ pass full payload so App can use payload.data + payload.metadata
      onCalculate?.(parsed, payload);
    } catch (err) {
      console.error("Error calculating taxes:", err);
      setError(err?.message || "Failed to calculate taxes. Please try again.");
    } finally {
      setLoading(false);
    }
    console.log("API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

  };

  return (
    <div className={styles.content}>
      <div className={styles.pasteSection}>
        <h1 className={styles.mainTitle}>Paste your transaction data here.</h1>
        <p className={styles.subtitle}>
          Copy and paste your cryptocurrency transactions list from Excel to
          calculate your capital gains tax in seconds.
        </p>

        <div className={styles.inputWrapper}>
          <div className={styles.inputArea}>
            <textarea
              className={styles.excelTextarea}
              placeholder="Paste your transactions list from Excel here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={loading}
            />

            <div className={styles.columnHeaders}>
              <span>Date</span>
              <span>Type</span>
              <span>Sell Coin</span>
              <span>Sell Amount</span>
              <span>Buy Coin</span>
              <span>Buy Amount</span>
              <span>Buy Price/Coin</span>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.submitButtonWrapper}>
          <button
            className={styles.submitTransactionsBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit Transactions"}
          </button>
        </div>
      </div>

      <div className={styles.rightVisual}>
        <img
          src={`${import.meta.env.BASE_URL}clipboard-image.png`}
          alt="Paste transactions"
          className={styles.clipboardIllustration}
        />
      </div>
    </div>
  );
}
