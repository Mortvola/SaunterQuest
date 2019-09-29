<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Route;


class RouteController extends Controller
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

    public function get ($id)
    {
        return Route::get ($id);
    }

    public function put (Request $request)
    {
        $routeUpdate = json_decode($request->getContent());

        $route = new Route($routeUpdate->userHikeId);

        switch ($routeUpdate->mode)
        {
            /*
            case "updated":

                // Update the point that was moved in the segments array.
                modifyPoint($segments, $routeUpdate);

                break;

            case "insert":

                array_splice($segments, $routeUpdate->index, 0, [ "0" => $routeUpdate->point]);

                modifyPoint($segments, $routeUpdate);

                break;

            case "delete":

                deletePoints($segments, $routeUpdate);

                break;

            case "addTrail":

                addTrail($segments, $routeUpdate);

                break;
*/
        }

        $route->save ();
    }

    public function setStartPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $route->setStart ($point);

        $route->save ();
    }

    public function setEndPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $route->setEnd ($point);

        $route->save ();
    }
}
