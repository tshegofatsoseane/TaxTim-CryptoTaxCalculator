import React, { useState } from "react";

export default function App() {
  const [excelData, setExcelData] = useState("");
  const [activeTab, setActiveTab] = useState("input");
  const [isCalculated, setIsCalculated] = useState(false);

  // MOCK DATA – backend will replace this later
  const transactions = [
    {
      id: 1,
      date: "2023-05-03 10:34:09",
      type: "BUY",
      sellCoin: "ZAR",
      sellAmount: 10000,
      buyCoin: "BTC",
      buyAmount: 0.1,
      price: "R 100,000.00"
    },
    {
      id: 2,
      date: "2023-05-10 07:09:02",
      type: "BUY",
      sellCoin: "ZAR",
      sellAmount: 20000,
      buyCoin: "BTC",
      buyAmount: 0.1333333,
      price: "R 150,000.00"
    },
    {
      id: 3,
      date: "2023-09-02 19:06:12",
      type: "TRADE",
      sellCoin: "BTC",
      sellAmount: 0.1,
      buyCoin: "USDT",
      buyAmount: 1250,
      price: "R 16.00"
    },
    {
      id: 4,
      date: "2024-03-11 05:12:12",
      type: "SELL",
      sellCoin: "BTC",
      sellAmount: 0.1,
      buyCoin: "ZAR",
      buyAmount: 25000,
      price: "R 250,000.00"
    }
  ];

  const lotsConsumed = [
    {
      id: 1,
      buyDate: "03 May 2023",
      units: 0.1,
      cost: 10000,
      proceeds: 25000,
      gain: 15000
    },
    {
      id: 2,
      buyDate: "10 May 2023",
      units: 0.05,
      cost: 7500,
      proceeds: 15000,
      gain: 7500
    }
  ];

  // TOTALS (UI ONLY)
  const totalCost = lotsConsumed.reduce((sum, l) => sum + l.cost, 0);
  const totalProceeds = lotsConsumed.reduce((sum, l) => sum + l.proceeds, 0);
  const totalGain = lotsConsumed.reduce((sum, l) => sum + l.gain, 0);

  const handleCalculate = () => {
    if (!excelData.trim()) {
      alert("Please paste your Excel data first");
      return;
    }
    setIsCalculated(true);
    setActiveTab("transactions");
  };

  return (
    <div id="root">
      <h1>TaxTim Crypto Tax Calculator</h1>
      <p>Vite + React is working 🎉</p>
    </div>
  )
}

export default App
