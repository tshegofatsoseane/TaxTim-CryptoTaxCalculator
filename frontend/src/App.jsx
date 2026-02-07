import { useState } from "react";
import "./App.css";
import Tabs from "./components/Tabs/Tabs";
import Header from "./components/Header/Header";
import HowItWorks from "./components/HowItWorks/HowItWorks";

function App() {
  const [apiData, setApiData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [parsedText, setParsedText] = useState([]);
  const [rawText, setRawText] = useState("");

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
