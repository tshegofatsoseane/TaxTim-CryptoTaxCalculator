import { useState } from "react";
import { parseExcelText } from "../utils/excelParser";
import styles from "./InputScreen.module.css";

export default function InputScreen({ onCalculate }) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    
    // Validate input
    if (!rawText || rawText.trim().length < 10) {
      alert("Please paste valid Excel data (minimum 10 characters)");
      return;
    }

    const parsed = parseExcelText(rawText);
    if (!parsed.length) {
      alert("Please paste valid Excel data");
      return;
    }

    setLoading(true);

    try {
      // Call the crypto tax calculation endpoint
      const response = await fetch("/crypto-tax/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: rawText,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      onCalculate(parsed, result);
      
    } catch (err) {
      console.error("Error calculating taxes:", err);
      setError("Failed to calculate taxes. Please try again.");
      alert("Failed to calculate taxes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.pasteSection}>
          <h1 className={styles.mainTitle}>Paste your transaction data here.</h1>
          <p className={styles.subtitle}>
            Copy and paste your cryptocurrency transactions list from Excel to
            calculate your capital gains tax in seconds.
          </p>

          <div className={styles.inputWrapper}>
            <div className={styles.inputArea}>
              <div className={styles.tablePlaceholder}>
                <img 
                  src="/clipboard-image.png" 
                  alt="Paste transactions" 
                  className={styles.clipboardIllustration}
                />
              </div>
              
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

        <div className={styles.howItWorksSection}>
          <h2 className={styles.howItWorksTitle}>How it works</h2>
          
          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>1</div>
              <p className={styles.stepText}>Copy and paste your transactions list from Excel above</p>
            </div>
            
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>2</div>
              <p className={styles.stepText}>Click "Calculate" to see your results</p>
            </div>
            
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>3</div>
              <p className={styles.stepText}>Get transparent breakdowns with FIFO method (lot-by-lot)</p>
            </div>
            
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>4</div>
              <p className={styles.stepText}>Review summaries of base costs and capital gains / losses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
