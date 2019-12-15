<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Hike;

class HikeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function get ($hikeId)
    {
        if ($hikeId !== null)
        {
            $hike = Auth::user()->hikes()->find($hikeId);

            if (!isset($hike))
            {
                return abort(404);
            }

            $gearConfigId = $hike->gear_configuration_id;

            if (!isset($gearConfigId))
            {
                $gearConfigId = -1;
            }
            return view('hike', ['hikeId' => $hikeId, 'gearConfigId' => $gearConfigId]);
        }
        else
        {
            return Auth::user()->hikes;
        }
    }

    public function post (Request $request)
    {
        $name = $request->input ()[0];
        $userId = Auth::user()->id;

        $hike = new Hike ([
                "user_id" => $userId,
                "name" => $name]);

        $hike->save ();

        return $hike;
    }

    public function put ($hikeId, $request)
    {
        $update = json_decode($request->getContent());

        $hike = Auth::user()->hikes()->find($hikeId);

        if ($hike)
        {
            if (isset($update->name))
            {
                $hike->name = $update->name;
            }

            if (isset($update->gearConfigId))
            {
                $hike->gear_configuration_id = $update->gearConfigId;
            }

            $hike->save ();
        }

		//todo: return an error if name property nor hike exists.
    }

    public function delete ($hikeId)
    {
        Hike::where('id', $hikeId)->delete ();
    }
}
