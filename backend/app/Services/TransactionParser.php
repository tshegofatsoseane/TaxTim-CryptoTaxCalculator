<?php

namespace App\Services;

use App\Models\Transaction;
use DateTime;
use Exception;

class TransactionParser
{
    /**
     * Parse tab-separated or CSV text input into Transaction objects
     * 
     * Expected format (tab or comma separated):
     * Date | Type | SellCoin | SellAmount | BuyCoin | BuyAmount | BuyPricePerCoin
     * 
     * @param string $input Raw text from Excel copy-paste
     * @return array Array of Transaction objects
     * @throws Exception if parsing fails
     */
    public function parse(string $input): array
    {
        $lines = $this->splitIntoLines($input);
        
        if (empty($lines)) {
            throw new Exception("No data provided");
        }

        // Skip header row (first line)
        $dataLines = array_slice($lines, 1);
        
        $transactions = [];
        $lineNumber = 2; // Start at 2 since line 1 is header

        foreach ($dataLines as $line) {
            // Skip empty lines
            if (trim($line) === '') {
                $lineNumber++;
                continue;
            }

            try {
                $transaction = $this->parseLine($line, $lineNumber);
                $transactions[] = $transaction;
            } catch (Exception $e) {
                throw new Exception("Error on line {$lineNumber}: " . $e->getMessage());
            }

            $lineNumber++;
        }

        // Sort transactions by date (critical for FIFO)
        usort($transactions, function($a, $b) {
            return $a->date <=> $b->date;
        });

        return $transactions;
    }

    /**
     * Split input into lines, handling different line endings
     */
    private function splitIntoLines(string $input): array
    {
        // Normalize line endings
        $input = str_replace(["\r\n", "\r"], "\n", $input);
        return explode("\n", trim($input));
    }

    /**
     * Parse a single line into a Transaction object
     */
    private function parseLine(string $line, int $lineNumber): Transaction
    {
        // Try tab-separated first (Excel default), then comma-separated
        $columns = str_getcsv($line, "\t");
        
        // If we only got one column, it might be comma-separated
        if (count($columns) === 1) {
            $columns = str_getcsv($line, ",");
        }

        if (count($columns) < 7) {
            throw new Exception("Expected 7 columns, got " . count($columns));
        }

        // Parse and clean each column
        $date = $this->parseDate(trim($columns[0]));
        $type = trim($columns[1]);
        $sellCoin = trim($columns[2]);
        $sellAmount = $this->parseAmount($columns[3]);
        $buyCoin = trim($columns[4]);
        $buyAmount = $this->parseAmount($columns[5]);
        $buyPricePerCoin = $this->parseAmount($columns[6]);

        // Validation
        $this->validateTransaction($type, $sellCoin, $buyCoin, $lineNumber);

        return new Transaction(
            $date,
            $type,
            $sellCoin,
            $sellAmount,
            $buyCoin,
            $buyAmount,
            $buyPricePerCoin
        );
    }

    /**
     * Parse date string into DateTime object
     */
    private function parseDate(string $dateString): DateTime
    {
        // Try common formats
        $formats = [
            'Y-m-d H:i:s',  // 2023-05-03 10:34:09
            'Y-m-d',         // 2023-05-03
            'd/m/Y H:i:s',   // 03/05/2023 10:34:09
            'd/m/Y',         // 03/05/2023
        ];

        foreach ($formats as $format) {
            $date = DateTime::createFromFormat($format, $dateString);
            if ($date !== false) {
                return $date;
            }
        }

        throw new Exception("Invalid date format: {$dateString}");
    }

    /**
     * Parse amount string into float, removing currency symbols and commas
     */
    private function parseAmount(string $amountString): float
    {
        // Remove common currency symbols, spaces, and commas
        $cleaned = preg_replace('/[R$€£,\s]/', '', trim($amountString));
        
        if (!is_numeric($cleaned)) {
            throw new Exception("Invalid amount: {$amountString}");
        }

        return (float) $cleaned;
    }

    /**
     * Validate transaction type and coin combinations
     */
    private function validateTransaction(
        string $type, 
        string $sellCoin, 
        string $buyCoin, 
        int $lineNumber
    ): void {
        $validTypes = ['BUY', 'SELL', 'TRADE'];
        
        if (!in_array(strtoupper($type), $validTypes)) {
            throw new Exception("Invalid transaction type: {$type}. Must be BUY, SELL, or TRADE");
        }

        if (empty($sellCoin) || empty($buyCoin)) {
            throw new Exception("SellCoin and BuyCoin cannot be empty");
        }

        // BUY must have ZAR as sellCoin
        if (strtoupper($type) === 'BUY' && strtoupper($sellCoin) !== 'ZAR') {
            throw new Exception("BUY transactions must sell ZAR");
        }

        // SELL must have ZAR as buyCoin
        if (strtoupper($type) === 'SELL' && strtoupper($buyCoin) !== 'ZAR') {
            throw new Exception("SELL transactions must buy ZAR");
        }

        // TRADE must not involve ZAR
        if (strtoupper($type) === 'TRADE') {
            if (strtoupper($sellCoin) === 'ZAR' || strtoupper($buyCoin) === 'ZAR') {
                throw new Exception("TRADE transactions cannot involve ZAR");
            }
        }
    }
}