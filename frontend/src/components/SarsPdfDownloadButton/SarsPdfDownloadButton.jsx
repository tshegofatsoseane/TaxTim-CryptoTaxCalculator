import React, { useState } from "react";
import styles from "./SarsPdfDownloadButton.module.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------- helpers ----------
const fmtCurrency = (n) => {
  const val = Number(n || 0);
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-R${formatted}` : `R${formatted}`;
};

const fmtNum = (n, max = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: max });

const safeFilename = (name) =>
  String(name || "sars_crypto_summary")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

// SARS tax year runs 1 Mar - end Feb
const taxYearRange = (taxYear) => {
  const y = Number(taxYear);
  if (!y) return "—";
  return `01 Mar ${y - 1} – 28/29 Feb ${y}`;
};

// pick a decent example event from apiData.capitalGainEvents
const pickExampleEvent = (gainEvents = []) => {
  const events = Array.isArray(gainEvents) ? gainEvents : [];
  return (
    events.find((e) => {
      const tt = String(e.transactionType || "").toUpperCase();
      return (tt === "SELL" || tt === "TRADE") && e.proceeds != null && e.costBasis != null;
    }) || null
  );
};

// basic header helper
const addHeader = (doc, title, subtitle) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(subtitle, 14, 22);
  doc.setTextColor(0, 0, 0);

  // divider
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 26, 196, 26);
};

const addSectionTitle = (doc, text, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(text, 14, y);
  return y + 6;
};

const addKeyValueRow = (doc, key, val, y) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(String(key), 14, y);

  doc.setFont("helvetica", "bold");
  doc.text(String(val), 196, y, { align: "right" });

  doc.setTextColor(0, 0, 0);
  return y + 6;
};

const ensureSpace = (doc, y, needed = 30) => {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 14) {
    doc.addPage();
    return 18;
  }
  return y;
};

export default function SarsPdfDownloadButton({
  apiData,
  metadata,
  filename,
  label = "Download SARS PDF",
  variant = "ghost",
}) {
  const [busy, setBusy] = useState(false);

  const onDownload = async () => {
    if (!apiData || busy) return;

    setBusy(true);
    try {
      const summaries = apiData?.taxYearSummaries ?? [];
      const gainEvents = apiData?.capitalGainEvents ?? [];

      // Build byYearRows from API summaries (preferred)
      const byYearRows = Array.isArray(summaries)
        ? summaries
            .map((s) => ({
              taxYear: Number(s.taxYear),
              amount: Number(s.netGain ?? s.totalGain ?? 0),
            }))
            .filter((r) => r.taxYear)
        : [];

      const total =
        byYearRows.length > 0
          ? byYearRows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
          : Number(apiData?.totalCapitalGain ?? 0); // fallback if your API has it

      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const generatedAt = new Date().toLocaleString("en-ZA");
      addHeader(
        doc,
        "Crypto Capital Gains Summary (SARS)",
        `Generated: ${generatedAt} • Currency: ZAR • Method: FIFO`
      );

      let y = 34;

      // ===== Summary =====
      y = addSectionTitle(doc, "1) SARS Declaration Summary", y);
      y = addKeyValueRow(doc, "Total capital gain/loss to declare", fmtCurrency(total), y);

      if (metadata?.transactionCount != null) {
        y = addKeyValueRow(doc, "Transactions included", String(metadata.transactionCount), y);
      }
      if (Array.isArray(metadata?.coinsTracked)) {
        y = addKeyValueRow(doc, "Coins tracked", String(metadata.coinsTracked.length), y);
      }

      y += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(
        "Note: This report helps you copy net capital gain/loss amounts into SARS.\nIt is not final tax payable (tax depends on your marginal rate and CGT rules).",
        14,
        y
      );
      doc.setTextColor(0, 0, 0);
      y += 14;

      // ===== Breakdown table =====
      y = ensureSpace(doc, y, 40);
      y = addSectionTitle(doc, "2) Breakdown by Tax Year", y);

      autoTable(doc, {
        startY: y,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
        headStyles: { fillColor: [13, 148, 136] },
        head: [["Tax year", "Period", "Net gain/loss"]],
        body: (byYearRows ?? [])
          .slice()
          .sort((a, b) => Number(a.taxYear) - Number(b.taxYear))
          .map((r) => [String(r.taxYear), taxYearRange(r.taxYear), fmtCurrency(r.amount)]),
        margin: { left: 14, right: 14 },
      });

      y = (doc.lastAutoTable?.finalY ?? y) + 8;

      // ===== Example calculation =====
      const example = pickExampleEvent(gainEvents);

      y = ensureSpace(doc, y, 55);
      y = addSectionTitle(doc, "3) Example Calculation (FIFO)", y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);

      if (example) {
        const tt = String(example.transactionType || "").toUpperCase();
        doc.text(`Example uses one of your ${tt} events (real values from your data):`, 14, y);
        doc.setTextColor(0, 0, 0);
        y += 8;

        autoTable(doc, {
          startY: y,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
          headStyles: { fillColor: [17, 24, 39] },
          head: [["Field", "Value"]],
          body: [
            ["Date", String(example.date ?? "-")],
            ["Coin disposed", String(example.soldCoin ?? "-")],
            [
              "Amount disposed",
              `${fmtNum(example.soldAmount ?? 0)} ${String(example.soldCoin ?? "")}`,
            ],
            ["Proceeds", fmtCurrency(example.proceeds)],
            ["Cost basis (FIFO)", fmtCurrency(example.costBasis)],
            ["Capital gain/loss", fmtCurrency(example.capitalGain)],
          ],
          margin: { left: 14, right: 14 },
        });

        y = (doc.lastAutoTable?.finalY ?? y) + 10;
      } else {
        doc.text(
          "No suitable SELL/TRADE event found with proceeds & cost basis to show a full example.",
          14,
          y
        );
        doc.setTextColor(0, 0, 0);
        y += 12;
      }

      // ===== Notes =====
      y = ensureSpace(doc, y, 45);
      y = addSectionTitle(doc, "4) SARS Notes (Important)", y);

      autoTable(doc, {
        startY: y,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
        headStyles: { fillColor: [13, 148, 136] },
        head: [["Topic", "Explanation"]],
        body: [
          [
            "FIFO method",
            "When you dispose of crypto (SELL/TRADE), cost basis is taken from your oldest buys first.",
          ],
          [
            "Tax years",
            "South African tax years run from 1 March to 28/29 February.",
          ],
          [
            "What to declare",
            "Declare your net capital gain/loss for each tax year and ensure totals match this report.",
          ],
          [
            "Verification",
            "Always verify transaction completeness and correct dates/amounts before filing.",
          ],
        ],
        margin: { left: 14, right: 14 },
      });

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Page ${i} of ${pageCount}`, 196, doc.internal.pageSize.getHeight() - 10, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);
      }

      doc.save(`${safeFilename(filename)}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert(err?.message || "PDF download failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[variant]} ${busy ? styles.busy : ""}`}
      onClick={onDownload}
      disabled={busy}
      aria-busy={busy}
      title={busy ? "Preparing your PDF..." : label}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 13L10 3M10 13L7 10M10 13L13 10M3 17H17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className={styles.label}>{busy ? "Preparing PDF…" : label}</span>
    </button>
  );
}
