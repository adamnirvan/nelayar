<?php

return [
    'zppi' => [
        'enabled' => env('ZPPI_SYNC_ENABLED', true),
        'time' => env('ZPPI_SYNC_TIME', '02:00'),
    ],

    'kkp' => [
        'enabled' => env('KKP_SCRAPE_ENABLED', true),
        'day' => env('KKP_SCRAPE_DAY', 1),
        'time' => env('KKP_SCRAPE_TIME', '03:00'),
    ],
];