# Crypto Tax Calculator API — Frontend Integration Guide

**Service name:** TaxTim Crypto Tax Calculator (Laravel)  
**Base URL (Production):** `https://taxtim-cryptotaxcalculator.onrender.com`  
**Base URL (Local Docker):** `http://localhost:8000`

All endpoints below are prefixed with `/api/crypto-tax`.

---

## Overview

This API accepts **raw pasted transaction text** and returns:

- Parsed transactions (formatted for display)
- Current balances by coin
- FIFO capital gain events
- Tax year summaries
- Base cost summaries per tax year

The API is stateless: **every request must include the `transactions` string**.

---

## Common Headers

For all requests:

- `Content-Type: application/json`
- `Accept: application/json`

Example:

```http
Content-Type: application/json
Accept: application/json
```

---

## Authentication

No authentication is currently required.

---

## Error Handling (General)

### Validation errors (HTTP 422)

When required fields are missing/invalid:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "transactions": ["The transactions field is required."]
  }
}
```

### Processing errors (HTTP 400)

When parsing/calculation fails:

```json
{
  "success": false,
  "message": "Failed to calculate crypto taxes",
  "error": "Human readable error message"
}
```

### Not found (HTTP 404)

For missing tax year summary:

```json
{
  "success": false,
  "message": "No data found for tax year 2025",
  "availableTaxYears": [2024, 2026]
}
```

---

## Data Model Notes (Frontend)

### `transactions` request field (string)

All POST endpoints expect:

- `transactions` — **string** (min length: 10)
  - raw “pasted transaction data”
  - example: `"buy 1 BTC @ 20000 on 2025-01-01"`

### `transactions` response field (array)

When returned (e.g., `/calculate`), `transactions` are formatted for UI display:

```json
{
  "index": 1,
  "date": "2025-01-01 00:00:00",
  "type": "BUY",
  "sellCoin": "ZAR",
  "sellAmount": 20000,
  "buyCoin": "BTC",
  "buyAmount": 1,
  "buyPricePerCoin": 20000,
  "totalValue": 20000
}
```

> Note: `type` values observed: `BUY`, `SELL`, `TRADE`.

---

# Endpoints

## 1) Health Check

### **GET** `/api/crypto-tax/health`

Use to verify API uptime and discover supported endpoints.

#### Request

No body required.

#### Response (200)

```json
{
  "success": true,
  "message": "Crypto Tax Calculator API is running",
  "version": "1.0.0",
  "endpoints": {
    "POST /api/crypto-tax/calculate": "Calculate full tax report",
    "POST /api/crypto-tax/balances": "Get current balances only",
    "POST /api/crypto-tax/tax-year": "Get specific tax year summary",
    "POST /api/crypto-tax/validate": "Validate transactions without calculating",
    "GET /api/crypto-tax/health": "Health check"
  }
}
```

---

## 2) Calculate Full Tax Report

### **POST** `/api/crypto-tax/calculate`

Parses transactions + runs FIFO calculations and returns everything needed for the dashboard.

#### Request Body

```json
{
  "transactions": "buy 1 BTC @ 20000 on 2025-01-01\n..."
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Tax calculations completed successfully",
  "data": {
    "transactions": [],
    "currentBalances": {},
    "capitalGainEvents": [],
    "taxYearSummaries": [],
    "baseCostsByTaxYear": []
  },
  "metadata": {
    "transactionCount": 12,
    "capitalGainEventCount": 4,
    "coinsTracked": ["BTC", "ETH"],
    "taxYearsCovered": [2025, 2026]
  }
}
```

#### Notes for frontend

- `data.transactions`: transaction list/table
- `data.currentBalances`: balances display
- `data.capitalGainEvents`: capital gains table
- `data.taxYearSummaries`: summary cards per year
- `data.baseCostsByTaxYear`: base cost table per year
- `metadata`: UI labels/filters

---

## 3) Get Current Balances Only

### **POST** `/api/crypto-tax/balances`

Returns balances only.

#### Request Body

```json
{
  "transactions": "buy 1 BTC @ 20000 on 2025-01-01\n..."
}
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "balances": {
      "BTC": 2.5,
      "ETH": 10
    }
  }
}
```

---

## 4) Get Specific Tax Year Summary

### **POST** `/api/crypto-tax/tax-year`

Returns summary + base costs + events for a **single tax year**.

#### Request Body

```json
{
  "transactions": "buy 1 BTC @ 20000 on 2025-01-01\n...",
  "taxYear": 2025
}
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "taxYear": 2025,
    "summary": {},
    "baseCosts": {},
    "events": [],
    "eventCount": 3
  }
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "No data found for tax year 2025",
  "availableTaxYears": [2024, 2026]
}
```

---

## 5) Validate Transactions (No Calculations Returned)

### **POST** `/api/crypto-tax/validate`

Validates transaction text formatting and basic parseability.

#### Request Body

```json
{
  "transactions": "buy 1 BTC @ 20000 on 2025-01-01\n..."
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Transactions are valid",
  "data": {
    "transactionCount": 12,
    "dateRange": {
      "earliest": "2025-01-01 00:00:00",
      "latest": "2025-12-31 00:00:00"
    },
    "transactionTypes": {
      "BUY": 5,
      "SELL": 7,
      "TRADE": 0
    },
    "coinsInvolved": ["BTC", "ETH"]
  }
}
```

---

# Frontend Integration Examples

## Example (fetch) — Health

```js
const res = await fetch(
  "https://taxtim-cryptotaxcalculator.onrender.com/api/crypto-tax/health",
);
const data = await res.json();
```

## Example (fetch) — Calculate

```js
const res = await fetch(
  "https://taxtim-cryptotaxcalculator.onrender.com/api/crypto-tax/calculate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ transactions: pastedText }),
  },
);
const data = await res.json();
```

## Example (fetch) — Tax year summary

```js
const res = await fetch(
  "https://taxtim-cryptotaxcalculator.onrender.com/api/crypto-tax/tax-year",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ transactions: pastedText, taxYear: 2025 }),
  },
);
const data = await res.json();
```

---

# CORS

The API currently returns permissive CORS headers (allow all origins). If you lock it down later, the frontend must be added to the allowlist.

---

# Quick Checklist for Frontend Team

- Always POST a JSON body containing `{ "transactions": "<string>" }`
- Handle 422 validation errors (show helpful message)
- Use `/calculate` for full dashboard data
- Use `/balances` for a lightweight balances-only view
- Use `/tax-year` for filtering by year
- Use `/validate` prior to calculation if you want early feedback
- Use `/health` for uptime checks

---

**Document version:** 1.0.0  
**Last updated:** 2026-02-04
