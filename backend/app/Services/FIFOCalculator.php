<?php

namespace App\Services;

use App\Models\Transaction;
use App\DataTransferObjects\CoinBalance;
use App\DataTransferObjects\CoinLot;
use App\DataTransferObjects\CapitalGainEvent;
use DateTime;
/**
 * Main FIFO Calculator for crypto tax calculations
 * Processes transactions and calculates capital gains using First-In-First-Out method
 */
class FIFOCalculator
{
    /** @var array<string, CoinBalance> Map of coin symbol to balance */
    private array $coinBalances = [];

    /** @var CapitalGainEvent[] Array of all capital gain events */
    private array $capitalGainEvents = [];

    /**
     * Process an array of transactions and calculate all gains
     * 
     * @param Transaction[] $transactions
     * @return array Results containing balances, gains, and tax summaries
     */
    public function calculate(array $transactions): array
    {
        // Reset state
        $this->coinBalances = [];
        $this->capitalGainEvents = [];

        // Process each transaction in chronological order
        foreach ($transactions as $transaction) {
            $this->processTransaction($transaction);
        }

        // Generate reports
        return [
            'balances' => $this->getCurrentBalances(),
            'capitalGainEvents' => $this->getCapitalGainEvents(),
            'taxYearSummaries' => $this->getTaxYearSummaries($transactions),
            'baseCostsByTaxYear' => $this->getBaseCostsByTaxYear($transactions)
        ];
    }

    /**
     * Process a single transaction
     */
    private function processTransaction(Transaction $transaction): void
    {
        if ($transaction->isBuy()) {
            $this->processBuy($transaction);
        } elseif ($transaction->isSell()) {
            $this->processSell($transaction);
        } elseif ($transaction->isTrade()) {
            $this->processTrade($transaction);
        }
    }

    /**
     * Process BUY transaction: User buys crypto with ZAR
     * Example: Buy 0.1 BTC for R10,000 (price per coin: R100,000)
     */
    private function processBuy(Transaction $transaction): void
    {
        $coinBalance = $this->getOrCreateBalance($transaction->buyCoin);

        // Create a new lot for this purchase
        $lot = new CoinLot(
            $transaction->buyAmount,
            $transaction->buyPricePerCoin,
            $transaction->date,
            $transaction->buyCoin
        );

        $coinBalance->addLot($lot);
    }

    /**
     * Process SELL transaction: User sells crypto for ZAR
     * This creates a capital gain event
     */
    private function processSell(Transaction $transaction): void
    {
        
        $coinBalance = $this->getOrCreateBalance($transaction->sellCoin);

        // Remove the sold amount using FIFO
        $removedLots = $coinBalance->removeFIFO($transaction->sellAmount);

        // Calculate cost basis (what we originally paid for this crypto)
        $costBasis = array_reduce($removedLots, function($sum, $lot) {
            return $sum + $lot->getCostBasis();
        }, 0.0);

        // For SELL transactions, proceeds are simply the ZAR amount received (buyAmount)
        // NOT buyAmount × buyPricePerCoin (that would give billions!)
        $proceeds = $transaction->buyAmount;

        // Record the capital gain event
        $gainEvent = new CapitalGainEvent(
            $transaction->date,
            $transaction->sellCoin,
            $transaction->sellAmount,
            $costBasis,
            $proceeds,
            'SELL',
            $removedLots
        );

        $this->capitalGainEvents[] = $gainEvent;
    }

    /**
     * Process TRADE transaction: User trades one crypto for another
     * This creates a capital gain on the sold crypto AND adds a new lot for the bought crypto
     * 
     * Example: Trade 0.133 BTC to buy 10 ETH (current BTC price: R150,000)
     */
    private function processTrade(Transaction $transaction): void
    {
        $sellBalance = $this->getOrCreateBalance($transaction->sellCoin);

        // Remove the sold amount using FIFO
        $removedLots = $sellBalance->removeFIFO($transaction->sellAmount);

        // Calculate cost basis of what we sold
        $costBasis = array_reduce($removedLots, function($sum, $lot) {
            return $sum + $lot->getCostBasis();
        }, 0.0);

        // Proceeds are the value of the crypto we received
        $proceeds = $transaction->getTotalValue();

        // Record capital gain event on the SOLD coin
        $gainEvent = new CapitalGainEvent(
            $transaction->date,
            $transaction->sellCoin,
            $transaction->sellAmount,
            $costBasis,
            $proceeds,
            'TRADE',
            $removedLots
        );

        $this->capitalGainEvents[] = $gainEvent;

        // Now add the BOUGHT crypto as a new lot
        // The cost basis of this new crypto is the value of what we traded for it
        $buyBalance = $this->getOrCreateBalance($transaction->buyCoin);
        
        $newLot = new CoinLot(
            $transaction->buyAmount,
            $transaction->buyPricePerCoin,
            $transaction->date,
            $transaction->buyCoin
        );

        $buyBalance->addLot($newLot);
    }

    /**
     * Get or create a coin balance
     */
    private function getOrCreateBalance(string $coinSymbol): CoinBalance
    {
        $coinSymbol = strtoupper($coinSymbol);

        if (!isset($this->coinBalances[$coinSymbol])) {
            $this->coinBalances[$coinSymbol] = new CoinBalance($coinSymbol);
        }

        return $this->coinBalances[$coinSymbol];
    }

    /**
     * Get current balances for all coins
     */
    private function getCurrentBalances(): array
    {
        $balances = [];
        
        foreach ($this->coinBalances as $coinSymbol => $balance) {
            if (!$balance->isEmpty()) {
                $balances[$coinSymbol] = $balance->toArray();
            }
        }

        return $balances;
    }

    /**
     * Get all capital gain events
     */
    private function getCapitalGainEvents(): array
    {
        return array_map(function($event) {
            return $event->toArray();
        }, $this->capitalGainEvents);
    }

    /**
     * Calculate tax year summaries (total gains/losses per tax year per coin)
     * 
     * @param Transaction[] $transactions
     */
    private function getTaxYearSummaries(array $transactions): array
    {
        // Group capital gains by tax year and coin
        $summaries = [];

        foreach ($this->capitalGainEvents as $event) {
            $taxYear = $event->getTaxYear();
            $coin = $event->soldCoin;

            if (!isset($summaries[$taxYear])) {
                $summaries[$taxYear] = [
                    'taxYear' => $taxYear,
                    'totalGain' => 0,
                    'totalLoss' => 0,
                    'netGain' => 0,
                    'byCoins' => []
                ];
            }

            if (!isset($summaries[$taxYear]['byCoins'][$coin])) {
                $summaries[$taxYear]['byCoins'][$coin] = [
                    'coin' => $coin,
                    'totalGain' => 0,
                    'totalLoss' => 0,
                    'netGain' => 0
                ];
            }

            // Add to totals
            if ($event->isGain()) {
                $summaries[$taxYear]['totalGain'] += $event->capitalGain;
                $summaries[$taxYear]['byCoins'][$coin]['totalGain'] += $event->capitalGain;
            } else {
                $summaries[$taxYear]['totalLoss'] += abs($event->capitalGain);
                $summaries[$taxYear]['byCoins'][$coin]['totalLoss'] += abs($event->capitalGain);
            }

            $summaries[$taxYear]['netGain'] += $event->capitalGain;
            $summaries[$taxYear]['byCoins'][$coin]['netGain'] += $event->capitalGain;
        }

        // Convert to array format
        return array_values(array_map(function($summary) {
            $summary['byCoins'] = array_values($summary['byCoins']);
            return $summary;
        }, $summaries));
    }

    /**
     * Calculate base costs as of March 1st for each tax year
     * This shows what the user's holdings were worth at the start of each tax year
     * 
     * @param Transaction[] $transactions
     */
    private function getBaseCostsByTaxYear(array $transactions): array
    {
        if (empty($transactions)) {
            return [];
        }

        // Find all tax years in the data
        $taxYears = [];
        foreach ($transactions as $transaction) {
            $year = (int) $transaction->date->format('Y');
            $month = (int) $transaction->date->format('n');
            
            // Determine tax year
            if ($month <= 2) {
                $taxYears[$year] = true;
            } else {
                $taxYears[$year + 1] = true;
            }
        }

        $baseCosts = [];

        foreach (array_keys($taxYears) as $taxYear) {
            // March 1st is the END of the tax year (last day is end of Feb)
            $march1 = new DateTime("{$taxYear}-03-01 00:00:00");

            $yearBaseCosts = [
                'taxYear' => $taxYear,
                'date' => $march1->format('Y-m-d'),
                'coins' => []
            ];

            foreach ($this->coinBalances as $coinSymbol => $balance) {
                $balanceAtDate = $balance->getBalanceAsOfDate($march1);
                
                if ($balanceAtDate['amount'] > 0) {
                    $yearBaseCosts['coins'][$coinSymbol] = [
                        'coin' => $coinSymbol,
                        'amount' => $balanceAtDate['amount'],
                        'costBasis' => $balanceAtDate['costBasis']
                    ];
                }
            }

            if (!empty($yearBaseCosts['coins'])) {
                $yearBaseCosts['coins'] = array_values($yearBaseCosts['coins']);
                $baseCosts[] = $yearBaseCosts;
            }
        }

        return $baseCosts;
    }
}