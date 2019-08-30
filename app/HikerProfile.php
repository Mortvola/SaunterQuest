<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class HikerProfile extends Model
{
    protected $table = 'hikerProfile';
    public $timestamps = false;
    const CREATED_AT = 'creationDate';
    const UPDATED_AT = 'modificationDate';
    
    protected $hidden = [PointOfInterestConstraint::CREATED_AT, PointOfInterestConstraint::UPDATED_AT, "userId", "userHikeId"];
    
    protected $fillable = ["startDay", "endDay", "speedFactor", "startTime", "endTime", "breakDuration", "userHikeId"];

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'userHikeId');
    }
}
