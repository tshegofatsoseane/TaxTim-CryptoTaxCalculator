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
    
    // Sample data (tab-separated, same as Excel copy-paste)
    $input = "Date	Type	SellCoin	SellAmount	BuyCoin	BuyAmount	BuyPricePerCoin																			
2023-05-03 10:34:09	BUY	ZAR	10000	BTC	0.1000000	R 100,000.00																			
2023-05-10 07:09:02	BUY	ZAR	20000	BTC	0.1333333	R 150,000.00																			
2023-05-15 17:39:12	BUY	ZAR	20000	BTC	0.1111111	R 180,000.00																			
2023-05-15 17:45:36	BUY	ZAR	8000	ETH	0.5000000	R 16,000.00																			
2023-09-02 19:06:12	TRADE	BTC	0.1	USDT	1250.0000000	R 16.00																			
2023-09-02 19:08:34	TRADE	USDT	1200	XRP	640.0000000	R 30.00																			
2023-09-12 19:46:21	BUY	ZAR	15000	ETH	0.7500000	R 20,000.00																			
2024-03-11 05:12:12	SELL	BTC	0.1	ZAR	25000.0000000	R 250,000.00																			
2024-03-11 05:34:52	SELL	ETH	0.3	ZAR	9000.0000000	R 30,000.00																			
2024-04-02 19:06:19	TRADE	BTC	0.1	USDT	1666.6666666	R 18.00																			
2024-04-02 19:08:56	TRADE	USDT	1500	XRP	1080.0000000	R 25.00																			
2025-01-07 13:24:15	BUY	ZAR	20000	BTC	0.1666667	R 120,000.00																			
2025-01-07 14:56:10	BUY	ZAR	15000	ETH	0.8333333	R 18,000.00																			
2025-04-02 20:37:52	SELL	BTC	0.1	ZAR	40000.0000000	R 400,000.00																			
2025-04-02 20:42:08	SELL	ETH	0.3	ZAR	19500.0000000	R 65,000.00																			";

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
    
    // Sample data from the Excel sheet (tab-separated)
    $excelData = "Date	Type	SellCoin	SellAmount	BuyCoin	BuyAmount	BuyPricePerCoin
2023-05-03 10:34:09	BUY	ZAR	10000	BTC	0.1000000	100000
2023-05-10 07:09:02	BUY	ZAR	20000	BTC	0.1333333	150000
2023-05-15 17:39:12	BUY	ZAR	20000	BTC	0.1111111	180000
2023-05-15 17:45:36	BUY	ZAR	8000	ETH	0.5000000	16000
2023-09-02 19:06:12	TRADE	BTC	0.1	USDT	1250.0000000	16
2023-09-02 19:08:34	TRADE	USDT	1200	XRP	640.0000000	30
2023-09-12 19:46:21	BUY	ZAR	15000	ETH	0.7500000	20000
2024-03-11 05:12:12	SELL	BTC	0.1	ZAR	25000.0000000	250000
2024-03-11 05:34:52	SELL	ETH	0.3	ZAR	9000.0000000	30000
2024-04-02 19:06:19	TRADE	BTC	0.1	USDT	1666.6666666	18
2024-04-02 19:08:56	TRADE	USDT	1500	XRP	1080.0000000	25
2025-01-07 13:24:15	BUY	ZAR	20000	BTC	0.1666667	120000
2025-01-07 14:56:10	BUY	ZAR	15000	ETH	0.8333333	18000
2025-04-02 20:37:52	SELL	BTC	0.1	ZAR	40000.0000000	400000
2025-04-02 20:42:08	SELL	ETH	0.3	ZAR	19500.0000000	65000";

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

