// InputScreen.js
import { useState } from "react";
import { parseExcelText } from "../../utils/excelParser.jsx";
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

      onCalculate?.(parsed, payload, rawText);
    } catch (err) {
      console.error("Error calculating taxes:", err);
      setError(err?.message || "Failed to calculate taxes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Left */}
        <div className={styles.pasteSection}>
          <div className={styles.top}>
            <h1 className={styles.mainTitle}>Paste your transaction data</h1>
            <p className={styles.subtitle}>
              Copy & paste your crypto transactions from Excel. We’ll calculate your SARS FIFO
              gains and show the step-by-step maths.
            </p>
          </div>

          <div className={styles.inputCard}>


            <textarea
              className={styles.excelTextarea}
              placeholder={`Paste your transactions list here...`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={loading}
            />

            {/*  <div className={styles.helperRow}>
              <div className={styles.helperChip}>Date</div>
              <div className={styles.helperChip}>Type</div>
              <div className={styles.helperChip}>Sell coin</div>
              <div className={styles.helperChip}>Sell amount</div>
              <div className={styles.helperChip}>Buy coin</div>
              <div className={styles.helperChip}>Buy amount</div>
              <div className={styles.helperChip}>Price/coin</div>
            </div> */}
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              <div className={styles.errorDot}>!</div>
              <div>{error}</div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.submitTransactionsBtn}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinnerWrap}>
                  <span className={styles.spinner} />
                  Processing…
                </span>
              ) : (
                "Calculate"
              )}
            </button>

            <div className={styles.smallHint}>
              Your data stays in your browser.
            </div>
          </div>
        </div>

        {/* Right */}
        <div className={styles.rightVisual}>
          <img
            src={`${import.meta.env.BASE_URL}clipboard-image.png`}
            alt="Paste transactions"
            className={styles.clipboardIllustration}
          />
        </div>
      </div>
    </div>
  );
}
