import React, { useState } from 'react';
import styles from './Tabs.module.css';

import Transactions from '../Transactions/Transactions';
import CapitalGains from '../CapitalGains/CapitalGains';
import TaxSummary from '../TaxSummary/TaxSummary';
import CompletionBanner from '../Completionbanner/CompletionBanner';

function Tabs() {
  const [activeTab, setActiveTab] = useState('transactions');

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'baseCosts', label: 'Base Costs' },
    { id: 'capitalGains', label: 'Capital Gains / Losses' }
  ];

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabButton} ${
              activeTab === tab.id ? styles.tabButtonActive : styles.tabButtonInactive
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className={styles.activeIndicator} />
            )}
          </button>
        ))}
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'transactions' && (
          <div><Transactions/></div>
        )}
        {activeTab === 'baseCosts' && (
          <div>Base Costs content goes here</div>
        )}
        {activeTab === 'capitalGains' && (
          <div>
           <CapitalGains />
           <TaxSummary />
           <CompletionBanner />
          </div>
        )}
      </div>
    </div>
  );
}

export default Tabs;
