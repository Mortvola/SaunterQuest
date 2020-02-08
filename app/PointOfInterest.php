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
        $result = \DB::table(PointOfInterest::TABLE)->select(['type', \DB::raw('ST_AsGeoJSON(ST_Transform(way, 4326)) as way')])->get ();

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

        if (isset($this->id))
        {
            \DB::table(PointOfInterest::TABLE)->where('id', $his->id)->update($columns);
        }
        else
        {
            $this->id = \DB::table(PointOfInterest::TABLE)->insertGetId($columns);
        }
    }
}
