<?php

namespace App\DataTransferObjects;

use DateTime;
class CoinBalance 
{
    public string $coinSymbol;
    public array $lots = [];

    public function __construct(string $coinSymbol)
    {
        $this->coinSymbol = strtoupper($coinSymbol);
    }

    public function addLot(CoinLot $lot): void
    {
        if ($this->coinSymbol !== $this->coinSymbol) {
            throw new \Exception("Cannot add {$lot->coinSymbol} lot to {$this->coinSymbol} balance");
        }

        $this->lots[] = $lot;
    }

    public function removeFIFO(float $amountToRemove): array
    {
        $totalAvailable = $this->getTotalAmount();

        if ($amountToRemove > $totalAvailable) {
            throw new \Exception("Insufficient {$this->coinSymbol} balance. Trying to remove {$amountToRemove}, only {$totalAvailable} available");
        }

        $removedLots = [];
        $remainingToRemove = $amountToRemove;

        foreach ($this->lots as $index => $lot) {
            if ($remainingToRemove <= 0.00000001) {
                break;
            }

            if ($lot->amount <= $remainingToRemove) {
                $removedLots[] = clone $lot;
                $remainingToRemove -= $lot->amount;
                $lot->amount = 0;
            } else {
                $removedLot = $lot->removeAmount($remainingToRemove);
                $removedLots[] = $removedLot;
                $remainingToRemove = 0;
            }
        }

        $this->lots = array_values(array_filter($this->lots, function($lot) {
            return !$lot->isEmpty();
        }));

            return $removedLots;
        }

        public function getTotalAmount(): float
        {
            return array_reduce($this->lots, function($sum, $lot) {
                return $sum + $lot->amount;
            }, 0.0);
        }

        public function getTotalCostBasis(): float 
        {
            return array_reduce($this->lots, function($sum, $lot) {
                return $sum + $lot->getCostBasis();
            }, 0.0);
        }

        public function getLots(): array
        {
            return $this->lots;
        }

        public function isEmpty(): bool
        {
            return empty($this->lots) || $this->getTotalAmount() <= 0.00000001;
        }

        public function getBalanceAsOfDate(DateTime $date): array
        {
            $lotsAtDate = array_filter($this->lots, function($lot) use ($date) {
                return $lot->purchaseDate <= $date;
            });

            $totalAmount = array_reduce($lotsAtDate, function($sum, $lot) {
                return $sum + $lot->amount;
            }, 0.0);

            $totalCostBasis = array_reduce($lotsAtDate, function($sum, $lot) {
                return $sum + $lot->getCostBasis();
            }, 0.0);

            return [
                'amount' => $totalAmount,
                'costBasis' => $totalCostBasis,
                'lots' => array_map(function($lot) {
                    return $lot->toArray();
                }, array_values($lotsAtDate))
            ];
        }

        public function toArray(): array
        {
            return [
                'coinSymbol' => $this->coinSymbol,
                'totalAmount' => $this->getTotalAmount(),
                'totalCostBasis' => $this->getTotalCostBasis(),
                'lots' => array_map(function($lot) {
                    return $lot->toArray();
                }, $this->lots),
            ];
        }
}