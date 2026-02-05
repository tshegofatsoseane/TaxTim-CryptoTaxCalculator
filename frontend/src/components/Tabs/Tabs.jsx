import { useState } from "react";
import styles from "./Tabs.module.css";

import Transactions from "../Transactions/Transactions";
import BaseCosts from "../BaseCosts/BaseCosts";
import CapitalGains from "../CapitalGains/CapitalGains";
import TaxSummary from "../TaxSummary/TaxSummary";
import CompletionBanner from "../Completionbanner/CompletionBanner";

function Tabs({ apiData, metadata, parsedText }) {
  const [activeTab, setActiveTab] = useState("transactions");

  const tabs = [
    { id: "transactions", label: "Transactions" },
    { id: "baseCosts", label: "Base Costs" },
    { id: "capitalGains", label: "Capital Gains / Losses" },
  ];

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabButton} ${
              activeTab === tab.id
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className={styles.activeIndicator} />
            )}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "transactions" && (
          <Transactions apiData={apiData} />
        )}

      {activeTab === "baseCosts" && <BaseCosts apiData={apiData} />}

      {activeTab === "capitalGains" && (
        <>
          <CapitalGains apiData={apiData} />
     
        </>
      )}

      </div>
    </div>
  );
}

export default Tabs;
