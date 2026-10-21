<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('ocean:sync-forecast')
    ->dailyAt(config('schedule.zppi.time'))
    ->when(config('schedule.zppi.enabled'));

Schedule::command('nelayar:scrape-kkp')
    ->weeklyOn(
        config('schedule.kkp.day'),
        config('schedule.kkp.time')
    )
    ->when(config('schedule.kkp.enabled'));