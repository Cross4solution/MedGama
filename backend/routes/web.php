<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check for Railway / load balancers — NO DB dependency
Route::get('/health', function () {
    return response('ok', 200)->header('Content-Type', 'text/plain');
});
