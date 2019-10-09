<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RoutePoint extends Model
{
    protected $table = 'route_point';
    public $timestamps = false;

    public $trail;
    public $dist;
    public $ele;

    protected $visible = [
        'id',
        'type',
        'lat',
        'lng',
        'ele',
        'dist',
        'trail',
        'timeConstraints'
    ];

    protected $appends = [
        'trail',
        'dist',
        'ele'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'lat' => 'double',
        'lng' => 'double',
        'prev_fraction' => 'double',
        'next_fraction' => 'double',
    ];

    public function getTrailAttribute ()
    {
        return $this->trail;
    }

    public function getDistAttribute ()
    {
        return $this->dist;
    }

    public function getEleAttribute ()
    {
        return $this->ele;
    }

    public function hike ()
    {
        return $this->belongsTo('App\Hike', 'hike_id');
    }

    public function timeConstraints ()
    {
        return $this->hasMany('App\TimeConstraint', 'point_of_interest_id');
    }

    public function __get ($name)
    {
        if ($name === 'point')
        {
            return (object)["lat" => parent::__get('lat'), "lng" => parent::__get('lng'), "ele" => parent::__get('ele')];
        }

        return parent::__get ($name);
    }
}
