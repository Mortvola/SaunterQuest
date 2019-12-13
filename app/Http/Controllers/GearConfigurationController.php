<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\GearConfiguration;
use App\GearConfigurationItem;

class GearConfigurationController extends Controller
{
    function get ()
    {
        $configurations = Auth::user()->gearConfigurations;

        $configurations->load('gearConfigurationItems.gearItem');

        return $configurations;
    }

    function post (Request $request)
    {
        // Get the current list of configurations
        $configs = Auth::user()->gearConfigurations;

        $configCounter = $configs->count ();

        // Create a name and determine if it already exists.
        // If it does, try again with a new name.
        do
        {
            $configCounter++;

            $name = 'Gear Configuration ' . $configCounter;

            $sameName = $configs->where('name', $name);
        }
        while ($sameName->count () > 0);

        $gearConfig = Auth::user()->gearConfigurations()->create ([
            "name" => $name
        ]);

        $gearConfig->save ();

        return $gearConfig;
    }


    public function put ($gearConfigId, Request $request)
    {
        $configRequest = json_decode($request->getContent());

        $gearConfig = Auth::user()->gearConfigurations()->find($gearConfigId);

        $gearConfig->name = $configRequest->name;

        $gearConfig->save ();
    }

    function delete ($configId)
    {
        GearConfiguration::where('id', $configId)->delete ();
        GearConfigurationItem::where('gear_configuration_id', $configId)->delete ();
    }
}
