<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class VisiblePostScope implements Scope
{
    /**
     * Automatically exclude hidden posts from all queries.
     * SoftDeletes already handles deleted_at filtering.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $table = $model->getTable();
        $builder->where($table . '.is_hidden', false)
                ->where($table . '.is_active', true);
    }
}
