<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class HikerProfile extends Model
{
    protected $table = 'hiker_profile';
    public $timestamps = false;

    protected $hidden = [PointOfInterestConstraint::CREATED_AT, PointOfInterestConstraint::UPDATED_AT, "userId", "userHikeId"];

    protected $fillable = ["start_day", "end_day", "speed_factor", "start_time", "end_time", "break_duration", "user_hike_id"];

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'user_hike_id');
    }
}
