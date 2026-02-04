<?php

namespace App\DataTransferObjects;

use DateTime;

class CapitalGainEvent
{
    public DateTime $date;
    public string $soldCoin;
    public float $soldAmount;
    public float $costBasis;
    public float $proceeds;
    public float $capitalGain;
    public string $transactionType;

    public array $lotsUsed;

    public function __construct(
        DateTime $date,
        string $soldCoin,
        float $soldAmount,
        float $costBasis,
        float $proceeds,
        string $transactionType,
        array $lotsUsed = []
    ) {
        $this->date = $date;
        $this->soldCoin = $soldCoin;
        $this->soldAmount = $soldAmount;
        $this->costBasis = $costBasis;
        $this->proceeds = $proceeds;
        $this->capitalGain = $proceeds - $costBasis;
        $this->transactionType = $transactionType;
        $this->lotsUsed = $lotsUsed;
    }

    public function isGain(): bool
    {
        return $this->capitalGain > 0;
    }

    public function isLoss(): bool
    {
        return $this->capitalGain < 0;
    }

    public function getTaxYear(): int
    {
        $month = (int) $this->date->format('n');
        $year = (int) $this->date->format('Y');

        if ($month <= 2) {
            return $year;
        } else {
            return $year + 1;
        }
    }

    public function toArray(): array
    {
        return [
            'date' => $this->date->format('Y-m-d H:i:s'),
            'soldCoin' => $this->soldCoin,
            'soldAmount' => $this->soldAmount,
            'costBasis' => $this->costBasis,
            'proceeds' => $this->proceeds,
            'capitalGain' => $this->capitalGain,
            'transactionType' => $this->transactionType,
            'taxYear' => $this->getTaxYear(),
            'lotsUsed' => array_map(function ($lot) {
                return $lot->toArray();
            }, $this->lotsUsed)
        ];
    }

    public function getDescription(): string
    {
        $type = $this->isGain() ? 'gain' : 'loss';
        $amount = number_format(abs($this->capitalGain), 2);

        return sprintf(
            "%s: Sold %.8f %s for R%s (Cost: R%s, %s: R%s)",
            $this->date->format('Y-m-d'),
            $this->soldAmount,
            $this->soldCoin,
            number_format($this->proceeds, 2),
            number_format($this->costBasis, 2),
            ucfirst($type),
            $amount
        );
    }
}