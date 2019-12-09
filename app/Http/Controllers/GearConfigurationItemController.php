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
            if (!isset($configItemRequest->quantity) ||
                $configItemRequest->quantity == "")
            {
                $configItemRequest->quantity = 1;
            }

            $gearItem = $this->updateOrInsertGearItem ($configItemRequest);

            $configItem = $config->gearConfigurationItems()->create ([
                "gear_item_id" => $gearItem->id,
                "quantity" => $configItemRequest->quantity,
                "worn" => $configItemRequest->worn
            ]);

            $configItem->save ();

            $configItem->gear_item = $gearItem;

            return $configItem;
        }
    }

    function put ($itemId, Request $request)
    {
        $configItemRequest = json_decode($request->getContent());

        $config = Auth::user()->gearConfigurations->find($configItemRequest->gear_configuration_id);

        if ($config)
        {
            if (!isset($configItemRequest->quantity) ||
                $configItemRequest->quantity == "")
            {
                $configItemRequest->quantity = 1;
            }

            $gearItem = $this->updateOrInsertGearItem ($configItemRequest);

            $configItem = $config->gearConfigurationItems()->find($itemId);

            if (isset($configItem) &&
                (((isset($configItem->gear_item_id) && !isset($gearItem->id)) ||
                 (!isset($configItem->gear_item_id) && isset($gearItem->id)) ||
                 (isset($configItem->gear_item_id) && isset($gearItem->id) && $configItem->gear_item_id != $gearItem->id)) ||
               $configItem->quantity != $configItemRequest->quantity ||
               $configItem->worn != $configItemRequest->worn))
            {
                $configItem->fill([
                    "gear_item_id" => isset($gearItem->id) ? $gearItem->id : null,
                    "quantity" => $configItemRequest->quantity,
                    "worn" => $configItemRequest->worn
                ]);

                $configItem->save ();
            }

            $configItem->gear_item = $gearItem;

            return $configItem;
        }
    }

    function delete ($itemId)
    {
        GearConfigurationItem::where('id', $itemId)->delete ();
    }

    private function updateOrInsertGearItem ($configItemRequest)
    {
        if (!isset($configItemRequest->weight) ||
            $configItemRequest->weight == "")
        {
            $configItemRequest->weight = 0;
        }

        if (isset($configItemRequest->gear_item_id))
        {
            $gearItem = Auth::user()->gearItems()->find ($configItemRequest->gear_item_id);

            if (isset($gearItem) &&
                ($gearItem->name != $configItemRequest->name ||
                    $gearItem->description != $configItemRequest->description ||
                    $gearItem->weight != $configItemRequest->weight ||
                    $gearItem->unit_of_measure != $configItemRequest->unit_of_measure ||
                    $gearItem->consumable != $configItemRequest->consumable ||
                    $gearItem->system != $configItemRequest->system))
            {
                $gearItem->fill ([
                    "name" => $configItemRequest->name,
                    "description" => $configItemRequest->description,
                    "weight" => $configItemRequest->weight,
                    "unit_of_measure" => $configItemRequest->unit_of_measure,
                    "system" => $configItemRequest->system,
                    "consumable" => $configItemRequest->consumable
                ]);

                $gearItem->save ();
            }

            return $gearItem;
        }

        if ((isset($configItemRequest->name) && $configItemRequest->name !== "") ||
            (isset($configItemRequest->description) && $configItemRequest->description !== ""))
        {
            $gearItem = Auth::user()->gearItems()->create ([
                "name" => $configItemRequest->name,
                "description" => $configItemRequest->description,
                "weight" => $configItemRequest->weight,
                "unit_of_measure" => $configItemRequest->unit_of_measure,
                "system" => $configItemRequest->system,
                "consumable" => $configItemRequest->consumable
            ]);

            $gearItem->save ();

            return $gearItem;
        }
    }
}
