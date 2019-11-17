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
        $route = new Route ($id);

        return $route->get ();
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

    private function prepareUpdates ($route, $updates)
    {
        $updates2 = [];
        foreach ($updates as $update)
        {
            if (count($update) >= 2)
            {
                if ($update [0] === -1)
                {
                    if ($update[1] == -1)
                    {
                        $routeUpdate = [(object)["id" => -1], (object)["id" => -1]];
                    }
                    else
                    {
                        $routeUpdate = $route->getAnchor($update[1]);
                        array_splice($routeUpdate, 0, 0, array((object)["id" => -1]));
                    }
                }
                elseif ($update [1] === -1)
                {
                    $routeUpdate = $route->getAnchor($update[0]);
                    $routeUpdate[0]["trail"] = null;
                    $routeUpdate[1] = (object)["id" => -1];
                }
                else
                {
                    $routeUpdate = $route->get ($update[0], $update[1])->toArray ();
                    $routeUpdate[count($routeUpdate) - 1]["trail"] = null;
                }
            }
            else
            {
                $routeUpdate = $route->getAnchor($update[0]);
                $routeUpdate[count($routeUpdate) - 1]["trail"] = null;
            }

            // Make sure the trail in the last element is null

            $updates2[] = $routeUpdate;
        }

        return $updates2;
    }

    public function addStartPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $updates = $route->addStartpoint ($point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function setStartPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $updates = $route->setStart ($point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function addEndPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $updates = $route->addEndpoint ($point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function setEndPoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId, true);

        $updates = $route->setEnd ($point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function addWaypoint ($hikeId, Request $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId, true);

        $updates = $route->addWaypoint ($point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function updateWaypointPosition ($hikeId, $waypointId, $request)
    {
        $point = json_decode($request->getContent());

        $route = new Route($hikeId);

        $updates = $route->updateWaypointPosition($waypointId, $point);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function updateWaypointDetails ($hikeId, $waypointId, $request)
    {
        $details = json_decode($request->getContent());

        $route = new Route($hikeId);

        $route->updateWaypointDetails($waypointId, $details);

        $route->save ();
    }

    public function deleteWaypoint ($hikeId, $waypointId)
    {
        $route = new Route($hikeId);

        $updates = $route->deleteWaypoint($waypointId);

        $route->save ();

        return $this->prepareUpdates($route, $updates);
    }

    public function updateWaypoints ($hikeId, Request $request)
    {
        $order = json_decode($request->getContent());

        $route = new Route($hikeId);

        $route->setWaypointOrder ($order);

        $route->save ();
    }
}
