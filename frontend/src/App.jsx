import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Tabs from "./components/Tabs/Tabs";
import Header from "./components/Header/Header";
import HowItWorks from "./components/HowItWorks/HowItWorks";
import WalkthroughModal from "./components/WalkthroughModal/WalkthroughModal";

function App() {
  const [apiData, setApiData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [parsedText, setParsedText] = useState([]);
  const [rawText, setRawText] = useState("");

  // Walkthrough modal state
  const [walkOpen, setWalkOpen] = useState(false);

  const handleCalculate = (parsed, payload, raw) => {
    setParsedText(parsed);
    setApiData(payload?.data ?? null);
    setMetadata(payload?.metadata ?? null);
    setRawText(raw ?? "");
  };

  const handleReset = () => {
    setApiData(null);
    setMetadata(null);
    setParsedText([]);
    setRawText("");
  };

  const walkthroughSteps = useMemo(
    () => [
      {
        title: "Paste your transactions",
        subtitle:
          "Copy & paste your crypto transactions from Excel. Your data stays in your browser.",
        bullets: [
          "Paste the rows into the input box",
          'Click "Calculate" to process them',
        ],
      },
      {
        title: "Get the SARS number",
        subtitle:
          "We calculate your SARS capital gain/loss using FIFO. This is the number you declare.",
        bullets: [
          "See your total SARS gain/loss",
          "Check the year-by-year totals to understand where it comes from",
        ],
      },
      {
        title: "Prove the FIFO math (Details)",
        subtitle:
          "Open “Details” on any transaction to see which FIFO lots were used and how the gain/loss was calculated.",
        bullets: ["Proceeds − Cost basis = Gain/Loss", "FIFO lots used (oldest first)"],
      },
      {
        title: "Review & export",
        subtitle:
          "Review base costs and capital gains/losses, then export a summary for your records.",
        bullets: ["Check the Base Costs tab", "Download your summary (CSV) if available"],
        note: "Tip: You can always replace transactions if you need to redo it.",
      },
    ],
    []
  );

  // Show walkthrough once (per browser) on initial load
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("taxtim_walkthrough_dismissed_v1");
      if (!dismissed) setWalkOpen(true);
    } catch {
      // If storage is blocked, still show once per session load
      setWalkOpen(true);
    }
  }, []);

  return (
    <>
      <Header />

      <Tabs
        apiData={apiData}
        metadata={metadata}
        parsedText={parsedText}
        rawText={rawText}
        onCalculate={handleCalculate}
        onReset={handleReset}
      />

      <HowItWorks />

      <WalkthroughModal
        isOpen={walkOpen}
        onClose={() => setWalkOpen(false)}
        steps={walkthroughSteps}
        storageKey="taxtim_walkthrough_dismissed_v1"
        rememberDismissal={true}
      />
    </>
  );
}

export default App;
