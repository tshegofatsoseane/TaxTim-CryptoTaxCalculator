<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaxController;

Route::post('/tax/calculate', [TaxController::class, 'calculate']);
