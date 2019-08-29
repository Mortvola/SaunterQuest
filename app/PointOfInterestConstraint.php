<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PointOfInterestConstraint extends Model
{
    protected $table = 'pointOfInterestConstraint';
    public $timestamps = false;
    const CREATED_AT = 'creationDate';
    const UPDATED_AT = 'modificationDate';
    
    protected $fillable = ['type', 'time'];

    protected $hidden = [PointOfInterestConstraint::CREATED_AT, PointOfInterestConstraint::UPDATED_AT, "pointOfInterestId"];

    function pointOfInterest ()
    {
        return $this->belongsTo('App\PointOfInterest', 'pointOfInterestId');
    }
}
