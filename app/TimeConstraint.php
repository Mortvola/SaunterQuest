<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimeConstraint extends Model
{
    protected $table = 'point_of_interest_constraint';
    public $timestamps = false;

    protected $fillable = ['type', 'time'];

    protected $hidden = [TimeConstraint::CREATED_AT, TimeConstraint::UPDATED_AT, "pointOfInterestId"];

    function pointOfInterest ()
    {
        return $this->belongsTo('App\RoutePoint', 'pointOfInterestId');
    }
}
