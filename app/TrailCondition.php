<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TrailCondition extends Model
{
    protected $table = 'trailCondition';
    public $timestamps = false;
    const CREATED_AT = 'creationDate';
    const UPDATED_AT = 'modificationDate';
    
    protected $hidden = [TrailCondition::CREATED_AT, TrailCondition::UPDATED_AT, "userHikeId"];
    
    function hike ()
    {
        return $this->belongsTo('App\Hike', 'userHikeId');
    }
}
