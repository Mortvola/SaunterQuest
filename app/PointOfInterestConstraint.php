<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PointOfInterestConstraint extends Model
{
    protected $table = 'point_of_interest_constraint';
    public $timestamps = false;

    protected $fillable = ['type', 'time'];

    protected $hidden = [PointOfInterestConstraint::CREATED_AT, PointOfInterestConstraint::UPDATED_AT, "pointOfInterestId"];

    function pointOfInterest ()
    {
        return $this->belongsTo('App\PointOfInterest', 'pointOfInterestId');
    }
}
