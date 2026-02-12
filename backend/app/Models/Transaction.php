<?php

namespace App\Models;

use DateTime;

class Transaction
{
    public DateTime $date;
    public string $type; // BUY, SELL, TRADE
    public string $sellCoin;
    public float $sellAmount;
    public string $buyCoin;
    public float $buyAmount;
    public float $buyPricePerCoin;

    public function __construct(
        DateTime $date,
        string $type,
        string $sellCoin,
        float $sellAmount,
        string $buyCoin,
        float $buyAmount,
        float $buyPricePerCoin
    ) {
        $this->date = $date;
        $this->type = strtoupper($type);
        $this->sellCoin = strtoupper($sellCoin);
        $this->sellAmount = $sellAmount;
        $this->buyCoin = strtoupper($buyCoin);
        $this->buyAmount = $buyAmount;
        $this->buyPricePerCoin = $buyPricePerCoin;
    }

    /**
     * Check if this is a BUY transaction (buying crypto with ZAR)
     */
    public function isBuy(): bool
    {
        return $this->type === 'BUY' && $this->sellCoin === 'ZAR';
    }

    /**
     * Check if this is a SELL transaction (selling crypto for ZAR)
     */
    public function isSell(): bool
    {
        return $this->type === 'SELL' && $this->buyCoin === 'ZAR';
    }

    /**
     * Check if this is a TRADE transaction (crypto to crypto)
     */
    public function isTrade(): bool
    {
        return $this->type === 'TRADE' 
            && $this->sellCoin !== 'ZAR' 
            && $this->buyCoin !== 'ZAR';
    }

    /**
     * Get the total value in ZAR for this transaction
     */
    public function getTotalValue(): float
    {
        if ($this->type === 'SELL') {
            return $this->buyAmount;
        }

        if ($this->type === 'BUY') {
            return $this->sellAmount;
        }
        
        return $this->buyAmount * $this->buyPricePerCoin;
    }
}