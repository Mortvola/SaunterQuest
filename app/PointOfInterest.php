<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\PointOfInterestConstraint;

class PointOfInterest extends Model
{
    protected $table = 'pointOfInterest';
    public $timestamps = false;
    const CREATED_AT = 'creationDate';
    const UPDATED_AT = 'modificationDate';
    
    protected $fillable = [
        "name",
        "description",
        "lat",
        "lng",
        "userHikeId"];
    
    protected $hidden = [PointOfInterestConstraint::CREATED_AT, PointOfInterestConstraint::UPDATED_AT, "hikeId", "userHikeId"];
    
    public function constraints ()
    {
        return $this->hasMany('\App\PointOfInterestConstraint', 'pointOfInterestId');
    }

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'userHikeId');
    }
}
