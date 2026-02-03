<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CryptoTaxController;

Route::prefix('crypto-tax')->group(function () {    
    Route::get('/health', [CryptoTaxController::class, 'health']);
    
    Route::post('/calculate', [CryptoTaxController::class, 'calculate']);
    
    Route::post('/balances', [CryptoTaxController::class, 'getBalances']);
    
    Route::post('/tax-year', [CryptoTaxController::class, 'getTaxYearSummary']);
    
    Route::post('/validate', [CryptoTaxController::class, 'validateTransactions']);
});