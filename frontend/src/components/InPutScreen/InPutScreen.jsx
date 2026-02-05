import { useState } from "react";
import { parseExcelText } from "../utils/excelParser";

export default function InputScreen({ onCalculate }) {
  const [rawText, setRawText] = useState("");

  const handleCalculate = () => {
    const parsed = parseExcelText(rawText);
    if (!parsed.length) {
      alert("Please paste valid Excel data");
      return;
    }
    onCalculate(parsed);
  };

  return (
    <div className="card">
      <h2 className="section-title">How it works</h2>
      <div className="section-divider"></div>

      <div className="steps">
        <div><span className="step">1</span> Paste your Excel transactions</div>
        <div><span className="step">2</span> Click calculate</div>
        <div><span className="step">3</span> FIFO method applied</div>
        <div><span className="step">4</span> Review transactions & gains</div>
      </div>

      <textarea
        className="excel-input"
        placeholder="Paste your Excel data here..."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />

      <div className="center">
        <button className="calculate-btn" onClick={handleCalculate}>
          Calculate
        </button>
      </div>
    </div>
  );
}