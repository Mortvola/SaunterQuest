<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\GearItem;
use App\GearConfigurationItem;

class GearItemController extends Controller
{
    function get ()
    {
        return Auth::user()->gearItems;
    }

    function post (Request $request)
    {
        $gearItemRequest = json_decode($request->getContent());

        $gearItem = Auth::user()->gearItems()->create ([
            "name" => $gearItemRequest->name,
            "description" => $gearItemRequest->description,
            "weight" => $gearItemRequest->weight,
            "unit_of_measure" => $gearItemRequest->unit_of_measure,
            "system" => $gearItemRequest->system,
            "consumable" => $gearItemRequest->consumable
        ]);

        $gearItem->save ();

        return $gearItem;
    }

    function put ($itemId, Request $request)
    {
        $gearItemRequest = json_decode($request->getContent());

        $gearItem = Auth::user()->gearItems()->find($itemId);

        if ($gearItem)
        {
            $gearItem->fill ([
                "name" => $gearItemRequest->name,
                "description" => $gearItemRequest->description,
                "weight" => $gearItemRequest->weight,
                "unit_of_measure" => $gearItemRequest->unit_of_measure,
                "system" => $gearItemRequest->system,
                "consumable" => $gearItemRequest->consumable
            ]);

            $gearItem->save ();

            return $gearItem;
        }
    }

    function delete ($itemId)
    {
        GearItem::where('id', $itemId)->delete ();
        GearConfigurationItem::where('gear_item_id', $itemId)->delete ();
    }
}
