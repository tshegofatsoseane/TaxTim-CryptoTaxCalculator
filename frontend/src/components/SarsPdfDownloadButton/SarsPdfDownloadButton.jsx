import React, { useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import styles from "./SarsPdfDownloadButton.module.css"

// --- formatting helpers ---
const fmtCurrency = (n) => {
  const val = Number(n || 0)
  const formatted = Math.abs(val).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return val < 0 ? `-R${formatted}` : `R${formatted}`
}

const fmtNum = (n, max = 8) =>
  Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: max })

const safeFilename = (name) =>
  String(name || "sars-summary")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()

// --- small helpers for tax year label ---
const taxYearRange = (taxYear) => {
  const endYear = Number(taxYear)
  const startYear = endYear - 1
  const isLeap =
    (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0
  const endDay = isLeap ? 29 : 28
  return `1 Mar ${startYear} – ${endDay} Feb ${endYear}`
}

function buildDeclaration(apiData) {
  const gainEvents = apiData?.capitalGainEvents ?? []
  const summaries = apiData?.taxYearSummaries ?? []

  const byYear = new Map()

  if (Array.isArray(summaries) && summaries.length) {
    for (const s of summaries) {
      const y = Number(s.taxYear)
      if (!y) continue
      const net = Number(s.netGain ?? s.totalGain ?? 0)
      byYear.set(y, net)
    }
  } else {
    for (const e of gainEvents) {
      const y = Number(e.taxYear)
      if (!y) continue
      const g = Number(e.capitalGain ?? 0)
      byYear.set(y, (byYear.get(y) ?? 0) + g)
    }
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a)
  const total = years.reduce((acc, y) => acc + Number(byYear.get(y) ?? 0), 0)

  const byYearRows = years.map((y) => ({
    taxYear: y,
    amount: Number(byYear.get(y) ?? 0),
  }))

  return { years, total, byYearRows, gainEvents, summaries }
}

function pickExampleEvent(gainEvents) {
  // pick first disposal event with proceeds/costBasis + gain values
  for (const e of gainEvents) {
    const tt = String(e.transactionType || "").toUpperCase()
    const isDisposal = tt === "SELL" || tt === "TRADE"
    if (!isDisposal) continue
    const proceeds = Number(e.proceeds ?? NaN)
    const costBasis = Number(e.costBasis ?? NaN)
    const gain = Number(e.capitalGain ?? NaN)
    if (Number.isFinite(proceeds) && Number.isFinite(costBasis) && Number.isFinite(gain)) {
      return e
    }
  }
  return null
}

function addHeader(doc, title, subtitle) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(title, 14, 16)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(subtitle, 14, 22)

  doc.setDrawColor(229, 231, 235)
  doc.line(14, 26, 196, 26)
}

function addSectionTitle(doc, text, y) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(text, 14, y)
  return y + 6
}

function addKeyValueRow(doc, k, v, y) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(String(k), 14, y)
  doc.setFont("helvetica", "bold")
  doc.text(String(v), 196, y, { align: "right" })
  return y + 6
}

function ensureSpace(doc, y, needed = 18) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed > pageHeight - 14) {
    doc.addPage()
    return 18
  }
  return y
}

export default function SarsPdfDownloadButton({
  apiData,
  metadata,
  filename = "sars_crypto_summary",
  label = "Download SARS PDF",
  variant = "primary",
}) {
  const [busy, setBusy] = useState(false)

  const canDownload = Boolean(apiData)

  const declaration = useMemo(() => buildDeclaration(apiData), [apiData])

  const onDownload = async () => {
    if (!apiData) return
    setBusy(true)
    try {
      const { total, byYearRows, gainEvents } = declaration

      const doc = new jsPDF({ unit: "mm", format: "a4" })

      const generatedAt = new Date().toLocaleString("en-ZA")
      addHeader(
        doc,
        "Crypto Capital Gains Summary (SARS)",
        `Generated: ${generatedAt} • Currency: ZAR • Method: FIFO`,
      )

      let y = 34

      // ===== Summary =====
      y = addSectionTitle(doc, "1) SARS Declaration Summary", y)
      y = addKeyValueRow(doc, "Total capital gain/loss to declare", fmtCurrency(total), y)

      // Optional metadata
      if (metadata?.transactionCount != null) {
        y = addKeyValueRow(
          doc,
          "Transactions included",
          String(metadata.transactionCount),
          y,
        )
      }
      if (Array.isArray(metadata?.coinsTracked)) {
        y = addKeyValueRow(doc, "Coins tracked", String(metadata.coinsTracked.length), y)
      }

      y += 4
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(55, 65, 81)
      doc.text(
        "Note: This is not your final tax payable. SARS taxes capital gains according to your taxable income rules.\nThis report is intended to help you copy the correct net capital gain/loss amounts into your SARS return.",
        14,
        y,
      )
      doc.setTextColor(0, 0, 0)
      y += 14

      // ===== Breakdown table =====
      y = ensureSpace(doc, y, 40)
      y = addSectionTitle(doc, "2) Breakdown by Tax Year", y)

      autoTable(doc, {
        startY: y,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
        headStyles: { fillColor: [13, 148, 136] },
        head: [["Tax year", "Period", "Net gain/loss"]],
        body: (byYearRows ?? [])
          .slice()
          .sort((a, b) => Number(a.taxYear) - Number(b.taxYear))
          .map((r) => [
            String(r.taxYear),
            taxYearRange(r.taxYear),
            fmtCurrency(r.amount),
          ]),
        margin: { left: 14, right: 14 },
      })

      y = doc.lastAutoTable.finalY + 8

      // ===== Calculation example (using user's numbers) =====
      const example = pickExampleEvent(gainEvents)
      y = ensureSpace(doc, y, 55)
      y = addSectionTitle(doc, "3) Example Calculation (FIFO)", y)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(55, 65, 81)

      if (example) {
        const tt = String(example.transactionType || "").toUpperCase()
        doc.text(
          `Example uses one of your ${tt} events (real values from your data):`,
          14,
          y,
        )
        doc.setTextColor(0, 0, 0)
        y += 8

        autoTable(doc, {
          startY: y,
          styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
          headStyles: { fillColor: [17, 24, 39] },
          head: [["Field", "Value"]],
          body: [
            ["Date", String(example.date ?? "-")],
            ["Coin disposed", String(example.soldCoin ?? "-")],
            ["Amount disposed", `${fmtNum(example.soldAmount ?? 0)} ${String(example.soldCoin ?? "")}`],
            ["Proceeds", fmtCurrency(example.proceeds)],
            ["Cost basis (FIFO)", fmtCurrency(example.costBasis)],
            ["Capital gain/loss", fmtCurrency(example.capitalGain)],
          ],
          margin: { left: 14, right: 14 },
        })

        y = doc.lastAutoTable.finalY + 8
        y = ensureSpace(doc, y, 22)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("Equation:", 14, y)
        y += 6

        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(
          `Capital gain/loss = Proceeds − Cost basis = ${fmtCurrency(example.proceeds)} − ${fmtCurrency(
            example.costBasis,
          )} = ${fmtCurrency(example.capitalGain)}`,
          14,
          y,
        )
        y += 10
      } else {
        doc.text(
          "No suitable disposal event found to show a full proceeds/cost basis example.\n(We only show examples for SELL/TRADE events with proceeds and cost basis.)",
          14,
          y,
        )
        doc.setTextColor(0, 0, 0)
        y += 14
      }

      // ===== Notes =====
      y = ensureSpace(doc, y, 45)
      y = addSectionTitle(doc, "4) SARS Notes (Important)", y)

      autoTable(doc, {
        startY: y,
        styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2 },
        headStyles: { fillColor: [13, 148, 136] },
        head: [["Topic", "Explanation"]],
        body: [
          [
            "FIFO method",
            "When you dispose of crypto (SELL/TRADE), the cost basis is taken from your oldest buys first.",
          ],
          [
            "Tax years",
            "South African tax years run from 1 March to 28/29 February. Totals are grouped by tax year.",
          ],
          [
            "What to declare",
            "Declare your net capital gain/loss for each tax year, and ensure your total aligns with this report.",
          ],
          [
            "Verification",
            "Always verify your transaction history for completeness and correct dates/amounts before filing.",
          ],
        ],
        margin: { left: 14, right: 14 },
      })

      // Footer on each page
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text(
          `Page ${i} of ${pageCount}`,
          196,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" },
        )
        doc.setTextColor(0, 0, 0)
      }

      doc.save(`${safeFilename(filename)}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${variant === "primary" ? styles.primary : styles.ghost}`}
      onClick={onDownload}
      disabled={!canDownload || busy}
      title={!canDownload ? "Calculate results first" : "Download SARS summary PDF"}
    >
      {busy ? "Generating PDF…" : `⬇️ ${label}`}
    </button>
  )
}
