<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\PointOfInterestConstraint;

class PointOfInterest extends Model
{
    protected $table = 'point_of_interest';
    public $timestamps = false;

    protected $fillable = [
        "name",
        "description",
        "lat",
        "lng",
        "user_hike_id"];

    protected $hidden = [PointOfInterest::CREATED_AT, PointOfInterest::UPDATED_AT, "user_hike_id"];

    public function constraints ()
    {
        return $this->hasMany('\App\PointOfInterestConstraint', 'point_of_interest_id');
    }

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'user_hike_id');
    }
}
