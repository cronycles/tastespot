<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ActivityPhoto extends Model
{
    protected $fillable = ['activity_id', 'storage_path', 'display_order'];

    // Solo created_at, nessuna updated_at
    const UPDATED_AT = null;

    protected $casts = [
        'display_order' => 'integer',
        'created_at'    => 'datetime',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }
}
