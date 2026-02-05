import { useState } from "react";
import "./App.css";
import Tabs from "./components/Tabs/Tabs";
import InputScreen from "./components/InputScreen/InputScreen";
import Header from "./components/Header/Header";
import HowItWorks from "./components/HowItWorks/HowItWorks";

function App() {
  const [apiData, setApiData] = useState(null);      // payload.data
  const [metadata, setMetadata] = useState(null);    // payload.metadata
  const [parsedText, setParsedText] = useState([]);  // parseExcelText output

  const handleCalculate = (parsed, payload) => {
    setParsedText(parsed);
    setApiData(payload?.data ?? null);
    setMetadata(payload?.metadata ?? null);
  };

  return (
    <>
     <Tabs apiData={apiData} metadata={metadata} parsedText={parsedText} />
     <InputScreen onCalculate={handleCalculate} />
      <Header />

      <HowItWorks />
    </>
  );
}

export default App;
