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

            return view('hike', ['hikeId' => $hikeId]);
        }
        else
        {
            $hikes = Auth::user()->hikes()->get ();

            return $hikes;
        }
    }

    public function getDetails ($hikeId)
    {
        $hike = Auth::user()->hikes()->find($hikeId);

        if (!isset($hike))
        {
            return abort(404);
        }

        return [
            "duration" => $hike->getDuration (),
            "distance" => $hike->getDistance ()
        ];
    }

    public function post (Request $request)
    {
        $name = $request->input ('name');
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

            $hike->save ();
        }

		//todo: return an error if name property nor hike exists.
    }

    public function delete ($hikeId)
    {
        Hike::where('id', $hikeId)->delete ();
    }
}
