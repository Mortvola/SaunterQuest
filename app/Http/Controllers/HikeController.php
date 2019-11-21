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
        $userId = Auth::user()->id;

        if ($hikeId !== null)
        {
            $hike = Hike::where ('id', $hikeId)->get ();

            if (count($hike) == 0)
            {
                return abort(404);
            }

            return view('hike', ['hikeId' => $hikeId]);
        }
        else
        {
            return Auth::user()->hikes->get ();
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

        if (isset($update->name))
        {
            $hike = Hike::find($hikeId);

            if ($hike)
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
