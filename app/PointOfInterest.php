<?php

namespace App;


class PointOfInterest
{
    public function __construct($initialValues)
    {
        $this->attributes = [];

        foreach ($initialValues as $key => $value)
        {
            $this->attributes[$key] = $value;
        }
    }

    public function __toString()
    {
        return json_encode($this->attributes);
    }

    const TABLE = 'point_of_interest';

    public static function all ()
    {
        $result = \DB::table(PointOfInterest::TABLE)->select(['id', 'type', \DB::raw('ST_AsGeoJSON(ST_Transform(way, 4326)) as way')])->get ();

        foreach ($result as $key => $value)
        {
            $point = json_decode($value->way);

            $result[$key]->lat = $point->coordinates[1];
            $result[$key]->lng = $point->coordinates[0];

            unset($result[$key]->way);
        }

        return $result;
    }

    public static function find ($id)
    {
        $result = \DB::table(PointOfInterest::TABLE)
            ->select(\DB::raw('ST_AsGeoJSON(ST_Transform(way, 4326)) as way'))
            ->find ($id);

        if (isset($result))
        {
            $result->id = $id;

            $point = json_decode($result->way);

            $result->lat = $point->coordinates[1];
            $result->lng = $point->coordinates[0];

            unset($result->way);

            return new PointOfInterest($result);
        }
    }

    public static function where ($column, $value)
    {
        return \DB::table(PointOfInterest::TABLE)->where ($column, $value);
    }

    public static function allWithin ($point, $distance)
    {
        $result = \DB::table(PointOfInterest::TABLE)
            ->select(\DB::raw('ST_AsGeoJSON(ST_Transform(way, 4326)) as way'))
            ->where(\DB::raw('way <-> ST_Transform(ST_SetSRID(ST_MakePoint(' . $point->lng . ',' . $point->lat . '), 4326), 3857)'), '<', $distance)
            ->get ();

        foreach ($result as $key => $value)
        {
            $point = json_decode($value->way);

            $result[$key]->lat = $point->coordinates[1];
            $result[$key]->lng = $point->coordinates[0];

            unset($result[$key]->way);
        }

        return $result;
    }

    public function save ()
    {
        $columns = [];
        foreach ($this->attributes as $key => $value)
        {
            if ($key != "lat" && $key != "lng")
            {
                $columns[$key] = $value;
            }
        }

        if (isset($this->attributes["lat"]) && isset($this->attributes["lng"]))
        {
            $columns["way"] = \DB::raw('ST_Transform(ST_SetSRID(ST_MakePoint(' . $this->attributes["lng"] . ',' . $this->attributes["lat"] . '), 4326), 3857)');
        }

        if (isset($this->attributes["id"]))
        {
            \DB::table(PointOfInterest::TABLE)->where('id', $this->attributes["id"])->update($columns);
        }
        else
        {
            $this->attributes["id"] = \DB::table(PointOfInterest::TABLE)->insertGetId($columns);
        }
    }
}
