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

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT, 'user_id'];

    protected $fillable = ['user_id', 'name'];

    function user ()
    {
        return $this->belongsTo('App\User', 'user_id');
    }

    public function trailConditions ()
    {
        return $this->hasMany('\App\TrailCondition', 'hike_id');
    }

    public function pointsOfInterest ()
    {
        return $this->belongsTo('App\PointOfInterest', 'hike_id');
    }

    public function hikerProfiles ()
    {
        return $this->belongsTo('App\HikerProfile', 'hike_id');
    }

    public function save (array $options = [])
    {
        parent::save ($options);

        // Create data directory and save an empty route file.
        mkdir(getHikeFolder ($this->id));
        touch(getHikeFolder ($this->id) . "route.json");
    }

    public function getDuration ()
    {
        $schedule = new Schedule($this->user_id, $this->id);

        return $schedule->getDuration ();
    }

    public function getDistance ()
    {
        $route = new Route($this->id);

        return $route->getDistance ();
    }
}
