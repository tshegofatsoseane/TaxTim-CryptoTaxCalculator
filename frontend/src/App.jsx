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
    <div className="min-h-screen bg-[#f7f9fa] font-sans">

      {/* HEADER */}
      <header className="bg-[#d8f3ff] border-b border-[#c2e9fb] px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <img
            src="/Images/logo.PNG"
            alt="TaxTim"
            className="h-12"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-700">
              Crypto Calculator
            </h1>
            <p className="text-xs italic text-gray-500">
              Capital Gains Tax Made Simple
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">

        {/* INPUT SCREEN */}
        {activeTab === "input" && (
          <div className="bg-white rounded-xl shadow-sm border p-12">
            <h2 className="text-xl italic text-gray-600 mb-2">
              How it works
            </h2>

            {/* BORDER LINE AFTER HEADING */}
            <div className="h-[2px] bg-[#38bdf8] w-full mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-gray-500 mb-10">
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#008a69] text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Paste your Excel transactions
              </div>
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#008a69] text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Click calculate
              </div>
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#008a69] text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                FIFO method applied
              </div>
              <div className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#008a69] text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                Review transactions and calculations
              </div>
            </div>

            <textarea
              className="w-full h-64 p-6 bg-[#f8fafc] border rounded text-[13px] text-gray-600 mb-8 outline-none"
              placeholder="Paste your Excel data here..."
              value={excelData}
              onChange={(e) => setExcelData(e.target.value)}
            />

            <div className="flex justify-center">
              <button
                onClick={handleCalculate}
                className="bg-[#e65d47] text-white px-24 py-4 rounded font-bold uppercase shadow hover:scale-105 transition"
              >
                Calculate
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        {isCalculated && activeTab !== "input" && (
          <nav className="flex gap-10 border-b mb-10">
            {["transactions", "basecosts", "gains"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold uppercase ${
                  activeTab === tab
                    ? "border-b-4 border-[#008a69] text-gray-800"
                    : "text-gray-400"
                }`}
              >
                {tab === "transactions"
                  ? "Transactions"
                  : tab === "basecosts"
                  ? "Base Costs"
                  : "Capital Gains"}
              </button>
            ))}
          </nav>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-12">

            {/* TRANSACTIONS TABLE */}
            <div className="bg-white border rounded-xl shadow-sm p-8">
              <h3 className="text-lg font-bold text-gray-700 mb-6">
                Transactions
              </h3>

              <table className="w-full text-[12px] text-gray-600">
                <thead className="bg-[#f8fafc] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Sell Coin</th>
                    <th className="p-4">Sell Amount</th>
                    <th className="p-4">Buy Coin</th>
                    <th className="p-4">Buy Amount</th>
                    <th className="p-4">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b">
                      <td className="p-4 font-bold text-gray-700">
                        ● {tx.date}
                      </td>
                      <td className="p-4">{tx.type}</td>
                      <td className="p-4">{tx.sellCoin}</td>
                      <td className="p-4">{tx.sellAmount}</td>
                      <td className="p-4">{tx.buyCoin}</td>
                      <td className="p-4">{tx.buyAmount}</td>
                      <td className="p-4">{tx.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LOTS CONSUMED */}
            <div className="bg-white border rounded-xl shadow-sm p-8">
              <h3 className="text-lg font-bold text-gray-700 mb-6">
                Lots Consumed (FIFO)
              </h3>

              <table className="w-full text-[12px] text-gray-600">
                <thead className="bg-[#f8fafc] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Buy Date</th>
                    <th className="p-4">Units Used</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Proceeds</th>
                    <th className="p-4">Gain / Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {lotsConsumed.map(lot => (
                    <tr key={lot.id} className="border-b">
                      <td className="p-4">{lot.buyDate}</td>
                      <td className="p-4 font-bold">
                        {lot.units.toFixed(6)} BTC
                      </td>
                      <td className="p-4">R {lot.cost.toLocaleString()}</td>
                      <td className="p-4">R {lot.proceeds.toLocaleString()}</td>
                      <td className="p-4 font-bold text-[#008a69]">
                        R {lot.gain.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* SPACING BEFORE TOTALS */}
              <div className="h-6"></div>

              {/* TOTALS */}
              <div className="border-t pt-6 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <strong>Total Base Cost:</strong><br />
                  R {totalCost.toLocaleString()}
                </div>
                <div>
                  <strong>Total Proceeds:</strong><br />
                  R {totalProceeds.toLocaleString()}
                </div>
                <div className="text-[#008a69]">
                  <strong>Net Capital Gain:</strong><br />
                  R {totalGain.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "basecosts" && (
          <div className="text-gray-400 italic">
            Base Costs will be calculated per tax year.
          </div>
        )}

        {activeTab === "gains" && (
          <div className="text-gray-400 italic">
            Capital Gains per tax year will be shown here.
          </div>
        )}

      </main>
    </div>
  );
}



