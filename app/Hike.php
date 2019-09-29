<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
require_once app_path('routeFile.php');

class Hike extends Model
{
    protected $table = 'hike';
    public $timestamps = false;
    const CREATED_AT = 'creationDate';
    const UPDATED_AT = 'modificationDate';

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT, 'userId'];

    protected $fillable = ['userId', 'name'];

    function user ()
    {
        return $this->belongsTo('App\User', 'userId');
    }

    public function trailConditions ()
    {
        return $this->hasMany('\App\TrailCondition', 'userHikeId');
    }

    public function pointsOfInterest ()
    {
        return $this->belongsTo('App\PointOfInterest', 'userHikeId');
    }

    public function hikerProfiles ()
    {
        return $this->belongsTo('App\HikerProfile', 'userHikeId');
    }

    public function save (array $options = [])
    {
        parent::save ($options);

        // Create data directory and save an empty route file.
        mkdir(getHikeFolder ($this->id));
        touch(getHikeFolder ($this->id) . "route.json");
    }
}
