<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GearItemController extends Controller
{
    function post (Request $request)
    {
        $gear = json_decode($request->getContent());

        $gear = Auth::user()->gearItem()->create ([
            "name" => $gear->name,
            "description" => $gear->description,
            "weight" => $gear->weight,
            "unit_of_measure" => $gear->unit_of_measure
            ]);

        $gear->save ();

        return $gear;
    }
}
