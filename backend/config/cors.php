<?php

return [

  'paths' => ['api/*', 'sanctum/csrf-cookie'],

  'allowed_methods' => ['*'],

  'allowed_origins' => [
    'http://localhost:5173',
    'https://tax-tim-crypto-tax-calculator-jtod.vercel.app/',
  ],


  'allowed_origins_patterns' => [],

  'allowed_headers' => ['*'],

  'exposed_headers' => [],

  'max_age' => 0,

  'supports_credentials' => false,

];
