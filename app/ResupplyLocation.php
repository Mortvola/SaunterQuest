<?php

namespace App;


class ResupplyLocation
{
    public static function get ($userHikeId)
    {
        $output = \DB::select (\DB::raw (
            "select shippingLocationId, lat, lng, sl.name, inCareOf, address1, address2, city, state, zip
			from shippingLocation sl
			join userHike uh ON (uh.userHikeId = sl.userHikeId OR uh.hikeId = sl.hikeId) and uh.userHikeId =  :userHikeId"),
            array ("userHikeId" => $userHikeId));
            
        return json_encode($output);
    }
}
