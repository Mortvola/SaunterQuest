<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\GearConfigurationItem;

class GearConfigurationItemController extends Controller
{
    function post (Request $request)
    {
        $configItemRequest = json_decode($request->getContent());

        $config = Auth::user()->gearConfigurations->find($configItemRequest->gear_configuration_id);

        if ($config)
        {
            if (isset($configItemRequest->gear_item_id))
            {
                $gearItem = Auth::user()->gearItems()->find($configItemRequest->gear_item_id);

                //todo: update
            }
            else
            {
                $gearItem = Auth::user()->gearItems()->create ([
                    "name" => $configItemRequest->name,
                    "description" => $configItemRequest->description,
                    "weight" => $configItemRequest->weight,
                    "unit_of_measure" => $configItemRequest->unit_of_measure
                ]);

                $gearItem->save ();
            }

            $configItem = $config->gearConfigurationItems()->create ([
                "gear_item_id" => $gearItem->id,
                "system" => $configItemRequest->system,
                "quantity" => $configItemRequest->quantity,
                "location" => $configItemRequest->location
            ]);

            $configItem->save ();

            return $configItem;
        }
    }

    function put ($itemId, Request $request)
    {
        $configItemRequest = json_decode($request->getContent());

        $config = Auth::user()->gearConfigurations->find($configItemRequest->gear_configuration_id);

        if ($config)
        {
            if (isset($configItemRequest->gear_item_id))
            {
                $gearItem = Auth::user()->gearItems()->find ($configItemRequest->gear_item_id);

                if (isset($gearItem) &&
                    ($gearItem->name != $configItemRequest->name ||
                     $gearItem->description != $configItemRequest->description ||
                     $gearItem->weight != $configItemRequest->weight ||
                     $gearItem->unit_of_measure != $configItemRequest->unit_of_measure))
                {
                    $gearItem->fill ([
                        "name" => $configItemRequest->name,
                        "description" => $configItemRequest->description,
                        "weight" => $configItemRequest->weight,
                        "unit_of_measure" => $configItemRequest->unit_of_measure
                    ]);

                    $gearItem->save ();
                }
            }
            else
            {
                $gearItem = Auth::user()->gearItems()->create ([
                    "name" => $configItemRequest->name,
                    "description" => $configItemRequest->description,
                    "weight" => $configItemRequest->weight,
                    "unit_of_measure" => $configItemRequest->unit_of_measure
                ]);

                $gearItem->save ();
            }

            $configItem = $config->gearConfigurationItems()->find($itemId);

            if (isset($configItem) &&
              ($configItem->gear_item_id != $gearItem->id ||
               $configItem->system != $configItemRequest->system ||
               $configItem->quantity != $configItemRequest->quantity ||
               $configItem->location != $configItemRequest->location))
            {
                $configItem->fill([
                    "gear_item_id" => $gearItem->id,
                    "system" => $configItemRequest->system,
                    "quantity" => $configItemRequest->quantity,
                    "location" => $configItemRequest->location
                ]);

                $configItem->save ();
            }

            $configItem->name = $gearItem->name;
            $configItem->description = $gearItem->description;
            $configItem->weight = $gearItem->weight;
            $configItem->unit_of_measure = $gearItem->unit_of_measure;

            return $configItem;
        }
    }
}
