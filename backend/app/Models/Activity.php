<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Activity extends Model
{
    protected $fillable = [
        'user_id', 'name', 'address', 'lat', 'lng',
        'phone', 'notes', 'tags', 'last_viewed_at',
    ];

    protected $casts = [
        'lat'            => 'float',
        'lng'            => 'float',
        'tags'           => 'array',
        'last_viewed_at' => 'datetime',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= Str::uuid()->toString());
    }

    public function types()
    {
        return $this->belongsToMany(
            ActivityType::class,
            'activity_type_assignments',
            'activity_id',
            'activity_type_id'
        );
    }

    public function photos()
    {
        return $this->hasMany(ActivityPhoto::class)->orderBy('display_order');
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }
}
