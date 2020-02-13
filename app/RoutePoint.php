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
        'timeConstraints',
        'name'
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
        return $this->hasMany('App\TimeConstraint', 'object_id');
    }

    public function loadTrail ($endFraction)
    {
        $trail = Map::getPath($this->next_line_id, $this->next_fraction, $endFraction);

        // Delete the first and last points on the trail as they
        // are represented by the anchors at each end.
        if (isset($trail) && count($trail) > 0)
        {
            array_splice($trail, 0, 1);
            array_splice($trail, count($trail) - 1, 1);
        }

        $this->endFraction = $endFraction;
        $this->trail =  $trail;
    }

    public function loadCampsites ()
    {
        if (isset($this->next_line_id) &&
            isset($this->next_fraction) &&
            isset($this->endFraction))
        {
            $startFraction = $this->next_fraction;
            $endFraction = $this->endFraction;

            if ($startFraction > $endFraction)
            {
                $startFraction = $this->endFraction;
                $endFraction = $this->next_fraction;
            }

            $campsites = \DB::select("select
                	ST_AsGeoJSON(ST_Transform(poi.way, 4326))::json->'coordinates' AS coordinates,
                	ST_LineLocatePoint(line.way, poi.way) AS offset,
                	ST_NPoints(ST_LineSubString(line.way, :startFraction, ST_LineLocatePoint(line.way, poi.way))) AS index,
                	ST_NPoints(ST_LineSubString(line.way, :startFraction, :endFraction)) AS length,
                	poi.way <-> line.way AS distance,
                    poi.*
                from planet_osm_line AS line
                inner join point_of_interest AS poi ON
                    poi.type = 'campsite' and
                	poi.way && ST_SetSRID(ST_Expand(Box2D(line.way), :maxDistance), ST_SRID(line.way)) = true and
                	poi.way <-> ST_LineSubString(line.way, :startFraction, :endFraction) < :maxDistance
                where line.line_id = :lineId",
                [
                    "lineId" => $this->next_line_id,
                    "startFraction" => $startFraction,
                    "endFraction" => $endFraction,
                    "maxDistance" => 152.4
                ]);

            foreach ($campsites as $campsite)
            {
                if ($this->next_fraction > $this->endFraction)
                {
                    $campsite->index = $campsite->length - $campsite->index;
                }

                if ($campsite->index == 0)
                {
                    $this->campsite = (object)["lat" => $campsite->coordinates];
                }
                else if ($campsite->index - 1 < count($this->trail))
                {
                    $this->trail[$campsite->index - 1]->campsite = (object)["lat" => $campsite->coordinates];
                }
            }

            $campsites = \DB::select ("select
                	ST_AsGeoJSON(ST_Transform(poi.way, 4326))::json->'coordinates' AS coordinates,
                	ST_LineLocatePoint(line.way, poi.way) AS offset,
                	ST_NPoints(ST_LineSubString(line.way, :startFraction, ST_LineLocatePoint(line.way, poi.way))) AS index,
                	ST_NPoints(ST_LineSubString(line.way, :startFraction, :endFraction)) AS length,
                	poi.way <-> line.way AS distance,
                	poi.*
                from planet_osm_line line
                inner join planet_osm_point poi on
                    poi.tourism = 'camp_site' and
                	poi.way && ST_SetSRID(ST_Expand(Box2D(line.way), :maxDistance), ST_SRID(line.way)) and
                	poi.way <-> ST_LineSubString(line.way, :startFraction, :endFraction) < :maxDistance
                where line_id = :lineId",
                [
                    "lineId" => $this->next_line_id,
                    "startFraction" => $startFraction,
                    "endFraction" => $endFraction,
                    "maxDistance" => 152.4
                ]);

            foreach ($campsites as $campsite)
            {
                if ($this->next_fraction > $this->endFraction)
                {
                    $campsite->index = $campsite->length - $campsite->index;
                }

                if ($campsite->index == 0)
                {
                    $this->campsite = (object)["lat" => $campsite->coordinates];
                }
                else if (isset($this->trail) && $campsite->index - 1 < count($this->trail) && count($this->trail) > 0)
                {
                    if (isset($this->trail[$campsite->index - 1]))
                    {
                        $this->trail[$campsite->index - 1]->campsite = (object)["lat" => $campsite->coordinates];
                    }
                }
            }
        }
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
