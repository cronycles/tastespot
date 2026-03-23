<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Review extends Model
{
    protected $fillable = [
        'activity_id', 'user_id', 'activity_type_id',
        'score_location', 'score_food', 'score_service', 'score_price',
        'cost_per_person', 'liked', 'disliked', 'notes',
    ];

    protected $casts = [
        'score_location'  => 'float',
        'score_food'      => 'float',
        'score_service'   => 'float',
        'score_price'     => 'float',
        'cost_per_person' => 'float',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function activityType()
    {
        return $this->belongsTo(ActivityType::class);
    }
}
