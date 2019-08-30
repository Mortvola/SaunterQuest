<?php

namespace App;


class ResupplyLocation
{
    public static function get ($userHikeId)
    {
        $output = \DB::select (\DB::raw (
            "select sl.id, lat, lng, sl.name, inCareOf, address1, address2, city, state, zip
			from shippingLocation sl
			join hike h ON h.id = sl.userHikeId and h.id =  :userHikeId"),
            array ("userHikeId" => $userHikeId));
            
        return json_encode($output);
    }
}
