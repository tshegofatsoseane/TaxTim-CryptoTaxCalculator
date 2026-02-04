<?php

namespace App\Http\Controllers;

use App\Services\TransactionParser;
use App\Services\FIFOCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * @group Crypto Tax API
 *
 * APIs for calculating crypto taxes, getting balances, validating transactions, and health check.
 */
class CryptoTaxController extends Controller
{
    private TransactionParser $parser;
    private FIFOCalculator $calculator;

    public function __construct(TransactionParser $parser, FIFOCalculator $calculator)
    {
        $this->parser = $parser;
        $this->calculator = $calculator;
    }

    /**
     * Calculate crypto taxes
     *
     * Calculate full tax report based on transaction history.
     *
     * @bodyParam transactions string required Pasted transaction data. Example: "buy 1 BTC @ 20000 on 2025-01-01"
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Tax calculations completed successfully",
     *   "data": {
     *     "transactions": [...],
     *     "currentBalances": {...},
     *     "capitalGainEvents": [...],
     *     "taxYearSummaries": [...],
     *     "baseCostsByTaxYear": [...]
     *   },
     *   "metadata": {
     *     "transactionCount": 12,
     *     "capitalGainEventCount": 4,
     *     "coinsTracked": ["BTC","ETH"],
     *     "taxYearsCovered": [2025,2026]
     *   }
     * }
     */
    public function calculate(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'transactions' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transactionsText = $request->input('transactions');

            // Parse transactions
            Log::info('Parsing transactions', ['length' => strlen($transactionsText)]);
            $transactions = $this->parser->parse($transactionsText);
            Log::info('Transactions parsed successfully', ['count' => count($transactions)]);

            // Calculate FIFO
            Log::info('Starting FIFO calculations');
            $results = $this->calculator->calculate($transactions);
            Log::info('FIFO calculations completed successfully');

            // Format response
            return response()->json([
                'success' => true,
                'message' => 'Tax calculations completed successfully',
                'data' => [
                    'transactions' => $this->formatTransactionsForDisplay($transactions),
                    'currentBalances' => $results['balances'],
                    'capitalGainEvents' => $results['capitalGainEvents'],
                    'taxYearSummaries' => $results['taxYearSummaries'],
                    'baseCostsByTaxYear' => $results['baseCostsByTaxYear']
                ],
                'metadata' => [
                    'transactionCount' => count($transactions),
                    'capitalGainEventCount' => count($results['capitalGainEvents']),
                    'coinsTracked' => array_keys($results['balances']),
                    'taxYearsCovered' => $this->extractTaxYears($results['taxYearSummaries'])
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Error calculating crypto taxes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate crypto taxes',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get current balances
     *
     * Returns only current balances without full tax calculations.
     *
     * @bodyParam transactions string required Pasted transaction data. Example: "buy 1 BTC @ 20000 on 2025-01-01"
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "balances": {"BTC": 2.5, "ETH": 10}
     *   }
     * }
     */
    public function getBalances(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'transactions' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transactionsText = $request->input('transactions');
            $transactions = $this->parser->parse($transactionsText);
            $results = $this->calculator->calculate($transactions);

            return response()->json([
                'success' => true,
                'data' => [
                    'balances' => $results['balances']
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Error getting balances', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get balances',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get tax year summary
     *
     * Returns capital gains, base costs, and events for a specific tax year.
     *
     * @bodyParam transactions string required Pasted transaction data.
     * @bodyParam taxYear integer required Tax year to summarize. Example: 2025
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "taxYear": 2025,
     *     "summary": {...},
     *     "baseCosts": {...},
     *     "events": [...],
     *     "eventCount": 3
     *   }
     * }
     */
    public function getTaxYearSummary(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'transactions' => 'required|string|min:10',
                'taxYear' => 'required|integer|min:2000|max:2100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transactionsText = $request->input('transactions');
            $requestedTaxYear = (int) $request->input('taxYear');

            $transactions = $this->parser->parse($transactionsText);
            $results = $this->calculator->calculate($transactions);

            // Find the requested tax year
            $taxYearSummary = collect($results['taxYearSummaries'])
                ->firstWhere('taxYear', $requestedTaxYear);

            if (!$taxYearSummary) {
                return response()->json([
                    'success' => false,
                    'message' => "No data found for tax year {$requestedTaxYear}",
                    'availableTaxYears' => $this->extractTaxYears($results['taxYearSummaries'])
                ], 404);
            }

            // Get base costs for this tax year
            $baseCosts = collect($results['baseCostsByTaxYear'])
                ->firstWhere('taxYear', $requestedTaxYear);

            // Get events for this tax year
            $events = collect($results['capitalGainEvents'])
                ->filter(function ($event) use ($requestedTaxYear) {
                    return $event['taxYear'] === $requestedTaxYear;
                })
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'data' => [
                    'taxYear' => $requestedTaxYear,
                    'summary' => $taxYearSummary,
                    'baseCosts' => $baseCosts,
                    'events' => $events,
                    'eventCount' => count($events)
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Error getting tax year summary', [
                'error' => $e->getMessage(),
                'taxYear' => $request->input('taxYear')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get tax year summary',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Validate transactions
     *
     * Checks transaction data for correctness without calculating taxes.
     *
     * @bodyParam transactions string required Pasted transaction data.
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Transactions are valid",
     *   "data": {
     *     "transactionCount": 12,
     *     "dateRange": {"earliest":"2025-01-01","latest":"2025-12-31"},
     *     "transactionTypes": {"BUY":5,"SELL":7,"TRADE":0},
     *     "coinsInvolved": ["BTC","ETH"]
     *   }
     * }
     */
    public function validateTransactions(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'transactions' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transactionsText = $request->input('transactions');
            $transactions = $this->parser->parse($transactionsText);

            return response()->json([
                'success' => true,
                'message' => 'Transactions are valid',
                'data' => [
                    'transactionCount' => count($transactions),
                    'dateRange' => [
                        'earliest' => $transactions[0]->date->format('Y-m-d H:i:s'),
                        'latest' => end($transactions)->date->format('Y-m-d H:i:s')
                    ],
                    'transactionTypes' => $this->getTransactionTypeCounts($transactions),
                    'coinsInvolved' => $this->getUniqueCoins($transactions)
                ]
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction validation failed',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Health check
     *
     * Check if the Crypto Tax API is running.
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Crypto Tax Calculator API is running",
     *   "version": "1.0.0",
     *   "endpoints": {
     *       "POST /api/crypto-tax/calculate": "Calculate full tax report",
     *       "POST /api/crypto-tax/balances": "Get current balances only",
     *       "POST /api/crypto-tax/tax-year": "Get specific tax year summary",
     *       "POST /api/crypto-tax/validate": "Validate transactions without calculating",
     *       "GET /api/crypto-tax/health": "Health check"
     *   }
     * }
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Crypto Tax Calculator API is running',
            'version' => '1.0.0',
            'endpoints' => [
                'POST /api/crypto-tax/calculate' => 'Calculate full tax report',
                'POST /api/crypto-tax/balances' => 'Get current balances only',
                'POST /api/crypto-tax/tax-year' => 'Get specific tax year summary',
                'POST /api/crypto-tax/validate' => 'Validate transactions without calculating',
                'GET /api/crypto-tax/health' => 'Health check'
            ]
        ], 200);
    }


    /**
     * Format transactions for display in frontend
     */
    private function formatTransactionsForDisplay(array $transactions): array
    {
        return array_map(function ($transaction, $index) {
            return [
                'index' => $index + 1,
                'date' => $transaction->date->format('Y-m-d H:i:s'),
                'type' => $transaction->type,
                'sellCoin' => $transaction->sellCoin,
                'sellAmount' => $transaction->sellAmount,
                'buyCoin' => $transaction->buyCoin,
                'buyAmount' => $transaction->buyAmount,
                'buyPricePerCoin' => $transaction->buyPricePerCoin,
                'totalValue' => $transaction->getTotalValue()
            ];
        }, $transactions, array_keys($transactions));
    }

    /**
     * Extract tax years from summaries
     */
    private function extractTaxYears(array $summaries): array
    {
        return array_map(function ($summary) {
            return $summary['taxYear'];
        }, $summaries);
    }

    /**
     * Get count of each transaction type
     */
    private function getTransactionTypeCounts(array $transactions): array
    {
        $counts = ['BUY' => 0, 'SELL' => 0, 'TRADE' => 0];

        foreach ($transactions as $transaction) {
            if (isset($counts[$transaction->type])) {
                $counts[$transaction->type]++;
            }
        }

        return $counts;
    }

    /**
     * Get unique coins involved in transactions
     */
    private function getUniqueCoins(array $transactions): array
    {
        $coins = [];

        foreach ($transactions as $transaction) {
            if ($transaction->sellCoin !== 'ZAR') {
                $coins[$transaction->sellCoin] = true;
            }
            if ($transaction->buyCoin !== 'ZAR') {
                $coins[$transaction->buyCoin] = true;
            }
        }

        return array_keys($coins);
    }
}