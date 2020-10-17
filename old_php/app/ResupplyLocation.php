<?php

namespace App;


class ResupplyLocation
{
    public static function get ($userHikeId)
    {
        $output = \DB::select (\DB::raw (
            "select sl.id, lat, lng, sl.name, in_care_of, address1, address2, city, state, zip
			from shipping_location sl
			join hike h ON h.id = sl.hike_id and h.id =  :userHikeId"),
            array ("userHikeId" => $userHikeId));

        return json_encode($output);
    }
}
