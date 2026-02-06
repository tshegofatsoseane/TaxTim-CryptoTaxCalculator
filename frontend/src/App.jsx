import { useState } from "react";
import "./App.css";
import Tabs from "./components/Tabs/Tabs";
import Header from "./components/Header/Header";
import HowItWorks from "./components/HowItWorks/HowItWorks";

function App() {
  const [apiData, setApiData] = useState(null);      // payload.data
  const [metadata, setMetadata] = useState(null);    // payload.metadata
  const [parsedText, setParsedText] = useState([]);  // parseExcelText output
  const [rawText, setRawText] = useState("");        // keep raw input text for re-runs

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
    </>
  );
}

export default App;
