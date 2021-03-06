<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;

require_once app_path('routeFile.php');
require_once app_path('utilities.php');

class Hike extends Model
{
    protected $table = 'hike';
    public $timestamps = false;

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT, 'user_id'];

    protected $fillable = ['user_id', 'name', 'gear_configuration_id'];

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

    public function routePoints ()
    {
        return $this->belongsTo('App\RoutePoints', 'hike_id');
    }

     public function save (array $options = [])
     {
         parent::save ($options);

         if (!file_exists(getHikeFolder ($this->id)))
         {
             // Create data directory and save an empty route file.
             mkdir(getHikeFolder ($this->id));
         }
     }

    public function getDuration ()
    {
        return (new Schedule($this->user_id, $this->id))->getDuration ();
    }

    public function getDistance ()
    {
        $response = Http::get(env('PATHFINDER_SERVER') . '/hike/' . $this->id . '/distance');

        return $response->json()["distance"];
    }
}
