<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\TimeConstraint;

class PointOfInterest extends Model
{
    protected $table = 'point_of_interest';
    public $timestamps = false;

    protected $fillable = [
        "name",
        "description",
        "lat",
        "lng",
        "hike_id"];

    protected $hidden = [PointOfInterest::CREATED_AT, PointOfInterest::UPDATED_AT, "hike_id"];

    public function constraints ()
    {
        return $this->hasMany('\App\TimeConstraint', 'point_of_interest_id');
    }

    function hike ()
    {
        return $this->belongsTo('App\Hike', 'hike_id');
    }
}
