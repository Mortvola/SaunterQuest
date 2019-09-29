<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TrailCondition extends Model
{
    protected $table = 'trail_condition';
    public $timestamps = false;

    protected $hidden = [TrailCondition::CREATED_AT, TrailCondition::UPDATED_AT, "user_hike_id"];

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'user_hike_id');
    }
}
