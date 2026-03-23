<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    protected $fillable = ['user_id', 'activity_id'];

    public $incrementing = false;
    public $timestamps = false;

    protected $casts = ['created_at' => 'datetime'];
}
