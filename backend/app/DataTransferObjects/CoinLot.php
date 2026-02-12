<?php

namespace App\DataTransferObjects;

use DateTime;
/**
 * * Represents a single lot or batch of crypto purchased at a specific price and date
 * Used for FIFO tracking
 */
class CoinLot 
{
    public float $amount; // How much crypto in this lot (e.g., 0.1 BTC)
    public float $pricePerCoin; // Price per coin when purchased (e.g, R80.000)
    public DateTime $purchaseDate; // When this lot was acquired
    public string $coinSymbol; // Which coin (e.g., BTC)

    public function __construct(
        float $amount,
        float $pricePerCoin,
        DateTime $purchaseDate,
        string $coinSymbol
    ) {
        $this->amount = $amount;
        $this->pricePerCoin = $pricePerCoin;
        $this->purchaseDate = $purchaseDate;
        $this->coinSymbol = strtoupper($coinSymbol);
    }

    /**
     * 
     * Calculate the total cost basis for this lot
     * Example: 0.1 BTC @ R80,000/coin = R8,000
     * 
     */
    public function getCostBasis(): float
    {
        return $this->amount * $this->pricePerCoin;
    }

    /**
     * Remove a specific amount from this lot and return a new lot with that amount
     *  used when selling/trading part of a lot
     * @param float $amountToRemove
     * @return CoinLot New lot with the removed amount
     * @throws \Exception if trying to remove more than available
     */
    public function removeAmount(float $amountToRemove): CoinLot
    {
        if ($amountToRemove > $this->amount) {
            throw new \Exception("Cannot remove {$amountToRemove} from lot with only {$this->amount} available");
        }

        $removedLot = new CoinLot(
            $amountToRemove,
            $this->pricePerCoin,
            $this->purchaseDate,
            $this->coinSymbol
        );

        $this->amount -= $amountToRemove;

        return $removedLot;
    }

    /**
     * Check if this lot is empty 
     */
    public function isEmpty(): bool
    {
        return $this->amount <= 0.00000001; // Account for floating point precision
    }

    /**
     * Convert to array for JSON serialisation
     */
    public function toArray(): array
    {
        return [
            'amount' => $this->amount,
            'pricePerCoin' => $this->pricePerCoin,
            // BUG FIX: purchaseDate is a DateTime object and cannot be directly JSON-serialized.
            // Without this fix, json_encode throws a JsonException, causing a 500 error
            // on any endpoint that returns capitalGainEvents (which include lotsUsed).
            'priceDate' => $this->purchaseDate->format('Y-m-d H:i:s'),
            'coinSymbol' => $this->coinSymbol,
            'costBasis' => $this->getCostBasis()
        ];
    }
}