<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClinicStatsResource extends JsonResource
{
    /**
     * Wrap the resource in a consistent envelope.
     * The $resource here is the raw array from ClinicAnalyticsService.
     */
    public function toArray(Request $request): array
    {
        return [
            'period'       => $this->resource['period'],
            'appointments' => [
                'total'             => $this->resource['appointments']['total'],
                'completed'         => $this->resource['appointments']['completed'],
                'confirmed'         => $this->resource['appointments']['confirmed'],
                'pending'           => $this->resource['appointments']['pending'],
                'cancelled'         => $this->resource['appointments']['cancelled'],
                'cancellation_rate' => $this->resource['appointments']['cancellation_rate'] . '%',
            ],
            'new_patients' => $this->resource['new_patients'],
            'engagement'   => [
                'total_posts'    => $this->resource['engagement']['total_posts'],
                'total_likes'    => $this->resource['engagement']['total_likes'],
                'total_comments' => $this->resource['engagement']['total_comments'],
            ],
        ];
    }
}
