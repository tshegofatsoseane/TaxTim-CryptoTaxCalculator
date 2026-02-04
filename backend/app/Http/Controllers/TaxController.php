<?php

namespace App\Http\Controllers;

use App\Services\TransactionParser;
use App\Services\FIFOCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class TaxController extends Controller
{
    public function calculate(Request $request, TransactionParser $parser, FIFOCalculator $calculator): JsonResponse
    {
        $validated = $request->validate([
            'input' => ['required', 'string', 'min:3'],
        ]);

        try {
            $transactions = $parser->parse($validated['input']);
            $result = $calculator->calculate($transactions);

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
