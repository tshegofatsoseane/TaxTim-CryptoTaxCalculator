<?php

use App\Services\TransactionParser;
use App\Services\FIFOCalculator;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/test-parser', function () {
    $parser = new TransactionParser();
    
    $input = "Date	Type	SellCoin	SellAmount	BuyCoin	BuyAmount	BuyPricePerCoin
2024-11-01 10:00:00	BUY	ZAR	8000	BTC	0.1	80000
2024-11-02 10:00:00	BUY	ZAR	18000	BTC	0.2	90000
2025-05-03 10:00:00	BUY	ZAR	30000	BTC	0.3	100000
2025-05-05 10:00:00	TRADE	BTC	0.133333333	ETH	10	2000";

    try {
        $transactions = $parser->parse($input);
        
        // Log to Laravel's log file
        Log::info('Parsed Transactions:', ['transactions' => $transactions]);
        
        // Also return as JSON to see in browser
        return response()->json([
            'success' => true,
            'count' => count($transactions),
            'transactions' => $transactions
        ]);
        
    } catch (Exception $e) {
        Log::error('Parser Error:', ['error' => $e->getMessage()]);
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
});

Route::get('/test-fifo', function () {
    
    
    $excelData = "Date	Type	SellCoin	SellAmount	BuyCoin	BuyAmount	BuyPricePerCoin
2024-11-01 10:00:00	BUY	ZAR	8000	BTC	0.1	80000
2024-11-02 10:00:00	BUY	ZAR	18000	BTC	0.2	90000
2025-05-03 10:00:00	BUY	ZAR	30000	BTC	0.3	100000
2025-05-05 10:00:00	TRADE	BTC	0.133333333	ETH	10	2000";

    try {
        // Step 1: Parse the transactions
        $parser = new TransactionParser();
        $transactions = $parser->parse($excelData);
        
        Log::info('=== PARSED TRANSACTIONS ===');
        Log::info('Total transactions: ' . count($transactions));
        foreach ($transactions as $i => $txn) {
            Log::info("Transaction " . ($i + 1) . ": {$txn->type} - {$txn->date->format('Y-m-d')} - {$txn->sellCoin} to {$txn->buyCoin}");
        }
        
        // Step 2: Run FIFO calculations
        $calculator = new FIFOCalculator();
        $results = $calculator->calculate($transactions);
        
        Log::info('=== FIFO CALCULATION RESULTS ===');
        Log::info('Current Balances:', $results['balances']);
        Log::info('Capital Gain Events:', $results['capitalGainEvents']);
        Log::info('Tax Year Summaries:', $results['taxYearSummaries']);
        Log::info('Base Costs by Tax Year:', $results['baseCostsByTaxYear']);
        
        // Return formatted response
        return response()->json([
            'success' => true,
            'message' => 'FIFO calculation completed successfully',
            'data' => [
                'transactionCount' => count($transactions),
                'currentBalances' => $results['balances'],
                'capitalGainEvents' => $results['capitalGainEvents'],
                'taxYearSummaries' => $results['taxYearSummaries'],
                'baseCostsByTaxYear' => $results['baseCostsByTaxYear']
            ],
            'summary' => [
                'totalCapitalGainEvents' => count($results['capitalGainEvents']),
                'coinsHeld' => array_keys($results['balances']),
                'taxYearsCovered' => array_map(function($summary) {
                    return $summary['taxYear'];
                }, $results['taxYearSummaries'])
            ]
        ], 200, [], JSON_PRETTY_PRINT);
        
    } catch (\Exception $e) {
        Log::error('=== ERROR ===');
        Log::error('Error message: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 400, [], JSON_PRETTY_PRINT);
    }
});

