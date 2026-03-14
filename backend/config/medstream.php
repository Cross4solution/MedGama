<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Auto-Hide Report Threshold
    |--------------------------------------------------------------------------
    |
    | When a post accumulates this many pending reports, it will be
    | automatically hidden from the public feed until an admin reviews it.
    |
    */
    'auto_hide_report_threshold' => (int) env('MEDSTREAM_AUTO_HIDE_THRESHOLD', 3),

];
