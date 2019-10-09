<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class HikerProfile extends Model
{
    protected $table = 'hiker_profile';
    public $timestamps = false;

    protected $hidden = [HikerProfile::CREATED_AT, HikerProfile::UPDATED_AT, "user_id", "hike_id"];

    protected $fillable = ["start_day", "end_day", "speed_factor", "start_time", "end_time", "break_duration", "hike_id"];

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'hike_id');
    }

    public function jsonSerialize ()
    {
        $array = [
            "id" => $this->id,
            "startDay" => $this->start_day,
            "endDay" => $this->end_day,
            "speedFactor" => $this->speed_factor,
            "startTime" => $this->start_time,
            "endTime" => $this->end_time,
            "breakDuration" => $this->break_duration
        ];

        return $array;
    }
}
