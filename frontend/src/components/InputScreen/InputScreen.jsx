import { useRef, useState } from "react";
import { parseExcelText } from "../../utils/excelParser.jsx";
import styles from "./InputScreen.module.css";
import Loader from "../Loader/Loader";
import InfoModal from "../InfoModal/InfoModal";

import uploadGuideImg from "../../assets/upload-illustration.png";

export default function InputScreen({ onCalculate }) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("upload"); // "upload" | "paste"
  const [fileName, setFileName] = useState("");

  const fileInputRef = useRef(null);

  // help modal
  const [helpOpen, setHelpOpen] = useState(false);

  // Sample data
  const sampleData =
    "Date\tType\tSell coin\tSell amount\tBuy coin\tBuy amount\tPrice/coin\n" +
    "2024-03-10\tBUY\tZAR\t15000\tBTC\t0.005\t3000000\n" +
    "2024-05-02\tBUY\tZAR\t8000\tETH\t0.09000000\t88888.8889\n" +
    "2024-08-18\tTRADE\tBTC\t0.00200000\tETH\t0.03000000\t15\n" +
    "2024-11-07\tSELL\tETH\t0.05000000\tZAR\t6000\t120000\n";

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setError("That file is too large. Please upload a file under 2MB.");
      e.target.value = "";
      return;
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowed = ["csv", "tsv", "txt"];
    if (!allowed.includes(ext)) {
      setError("Please upload a CSV / TSV / TXT file (Excel can export CSV).");
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      if (!text || text.trim().length < 10) {
        setError("That file looks empty. Please upload a valid export.");
        e.target.value = "";
        return;
      }

      // ✅ store EXACT raw text that the parser will read
      setRawText(text);
      setFileName(file.name);

      // ✅ keep upload mode, but now we will show the textarea because rawText exists
      setMode("upload");
    } catch {
      setError("Could not read that file. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!rawText || rawText.trim().length < 10) {
      setError("Please add your transactions first (upload a file or paste the data).");
      return;
    }

    const parsed = parseExcelText(rawText);
    if (!parsed.length) {
      setError("We couldn’t recognise that data. Try uploading a CSV from Excel.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      if (!baseUrl) {
        throw new Error("Missing VITE_API_BASE_URL. Please set it in Vercel env vars.");
      }

      const response = await fetch(`${baseUrl}/api/crypto-tax/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ transactions: rawText }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : await response.text().catch(() => "");

      if (!response.ok) {
        const msg =
          typeof payload === "object" && payload
            ? payload?.errors?.transactions?.[0] ||
              payload?.message ||
              payload?.error
            : typeof payload === "string" && payload
            ? payload
            : `API error: ${response.status}`;
        throw new Error(msg);
      }

      if (typeof payload === "object" && payload?.success === false) {
        throw new Error(payload?.message || "Calculation failed.");
      }

      onCalculate?.(parsed, payload, rawText);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to calculate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchToUpload = () => {
    setMode("upload");
  };

  const switchToPaste = () => {
    setMode("paste");
    setFileName("");
  };

  const trySampleData = () => {
    setError("");
    setMode("paste");
    setFileName("");
    setRawText(sampleData);
  };

  const clearAll = () => {
    setRawText("");
    setFileName("");
    setError("");
    setMode("upload");
  };

  return (
    <div className={styles.container}>
      {/* InfoModal: export CSV help */}
      <InfoModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="How to export CSV from Excel"
        primaryText="Got it"
        maxWidth={620}
        showMascot={false}
      >
        <p className={styles.helpP}>
          If your transactions are in Excel, you can export them as a <b>CSV</b>{" "}
          and upload it here.
        </p>

        <ol className={styles.helpList}>
          <li>Open your spreadsheet in <b>Excel</b>.</li>
          <li>Click <b>File</b> → <b>Save As</b>.</li>
          <li>Choose a location on your computer.</li>
          <li>
            Under <b>File Format</b> / <b>Save as type</b>, choose{" "}
            <b>CSV (Comma delimited)</b>.
          </li>
          <li>Click <b>Save</b>, then upload the CSV here.</li>
        </ol>

        <div className={styles.helpNote}>
          Tip: If your upload looks wrong, try <b>CSV UTF-8</b> when available.
        </div>
      </InfoModal>

      <div className={styles.content}>
        <div className={styles.pasteSection}>
          {/* Header (clean) */}
          <div className={styles.top}>
            <div className={styles.stepKicker}>Step 1</div>
            <h1 className={styles.mainTitle}>Add your transactions</h1>
            <p className={styles.subtitle}>
              Choose one option below. Upload is easiest. Paste is available too.
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={onFileChange}
            className={styles.fileInput}
          />

          {/* Choice cards (smaller) */}
          <div className={styles.choiceGrid}>
            {/* Upload card */}
            <button
              type="button"
              className={`${styles.choiceCard} ${mode === "upload" ? styles.choiceActive : ""}`}
              onClick={switchToUpload}
              disabled={loading}
            >
              {/* ✅ put button next to “Upload a file” */}
              <div className={styles.choiceTitleRow}>
                <div className={styles.choiceTitle}>Upload a file</div>

                <button
                  type="button"
                  className={styles.uploadBtnInlineGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickFile();
                  }}
                  disabled={loading}
                >
                  Choose file…
                </button>
              </div>

              <div className={styles.choiceTextRow}>
                <div className={styles.choiceText}>
                  Upload a <b>CSV</b> file from Excel.
                </div>
              </div>

              <div className={styles.choiceHint}>CSV / TSV / TXT</div>
            </button>

            {/* Paste card */}
            <button
              type="button"
              className={`${styles.choiceCard} ${mode === "paste" ? styles.choiceActive : ""}`}
              onClick={switchToPaste}
              disabled={loading}
            >
              <div className={styles.choiceTitle}>Paste from Excel</div>
              <div className={styles.choiceText}>
                Copy your rows in Excel, then paste them here.
              </div>
              <div className={styles.choiceHint}>Works with most spreadsheets</div>
            </button>
          </div>

          {/* Calm helper row (context-only) */}
          {mode === "upload" ? (
            <div className={styles.quietRow}>
              <button
                type="button"
                className={styles.quietLink}
                onClick={() => setHelpOpen(true)}
                disabled={loading}
              >
                How do I export CSV from Excel?
              </button>
            </div>
          ) : (
            <div className={styles.quietRow}>
              <span className={styles.quietText}>New here?</span>
              <button
                type="button"
                className={styles.quietLink}
                onClick={trySampleData}
                disabled={loading}
                title="Load an example so you can see how it works"
              >
                Try the sample data
              </button>
            </div>
          )}

          {/* Upload status */}
          {fileName && (
            <div className={styles.successMessage}>
              <span className={styles.successDot}>✓</span>
              Loaded: <b>{fileName}</b>
            </div>
          )}

          {/* MAIN AREA */}
          {mode === "upload" && !rawText.trim() ? (
            <div className={styles.uploadIllustrationCard} aria-hidden="true">
              <img
                src={uploadGuideImg}
                alt=""
                className={styles.uploadIllustration}
                draggable="false"
              />
            </div>
          ) : (
            <div className={styles.inputCard}>
              <div className={styles.inputCardTop}>
                <div className={styles.inputTitle}>
                  {fileName ? "Uploaded data" : "Paste area"}
                </div>
                <div className={styles.inputMeta}>
                  {rawText.trim().length ? `${rawText.trim().length} characters` : "Nothing added yet"}
                </div>
              </div>

              <textarea
                className={styles.excelTextarea}
                value={rawText}
                onChange={(e) => {
                  setMode("paste");
                  setFileName("");
                  setRawText(e.target.value);
                }}
                disabled={loading}
                spellCheck={false}
                placeholder="Paste your transactions here…"
              />

              <div className={styles.editHint}>
                You can edit this if something looks wrong.
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorMessage} role="alert">
              <div className={styles.errorDot}>!</div>
              <div>{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.submitTransactionsBtn}
              onClick={handleSubmit}
              disabled={loading}
            >
              Calculate
            </button>

            {loading && <Loader />}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={clearAll}
                disabled={loading}
              >
                Clear
              </button>
              <div className={styles.smallHint}>Your data stays in your browser.</div>
            </div>
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
    </div>
  );
}
