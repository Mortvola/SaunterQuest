<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Route;

require_once app_path('routeFile.php');
require_once app_path('routeFind.php');

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
    
    public function get (Request $request)
    {
        $userHikeId = $request->input('id');
        
        return Route::get ($userHikeId);
    }
    
    public function put (Request $request)
    {
        $routeUpdate = json_decode($request->getContent());
        
        $fileName = getRouteFileName($routeUpdate->userHikeId);
        
        if ($fileName) {
            // Read the data from the file.
            $segments = readAndSanitizeFile($fileName);
            
            if ($routeUpdate->mode == "update") {
                // Update the point that was moved in the segments array.
                modifyPoint($segments, $routeUpdate);
            } elseif ($routeUpdate->mode == "insert") {
                array_splice($segments, $routeUpdate->index, 0, [ "0" => $routeUpdate->point]);
                
                modifyPoint($segments, $routeUpdate);
            } elseif ($routeUpdate->mode == "delete") {
                deletePoints($segments, $routeUpdate);
            } elseif ($routeUpdate->mode == "addTrail") {
                addTrail($segments, $routeUpdate);
            } elseif ($routeUpdate->mode == "setStart") {
                if (!isset($segments) || count($segments) == 0) {
                    $segments = [];
                    
                    array_push($segments, (object)[
                            "lat" => $routeUpdate->point->lat,
                            "lng" => $routeUpdate->point->lng,
                            "dist" => 0,
                            "ele" => getElevation($routeUpdate->point->lat, $routeUpdate->point->lng),
                            "type" => "start"
                    ]);
                } else {
                    // Find "start" and "end"
                    for ($i = 0; $i < count($segments); $i++) {
                        if (isset($segments[$i]->type)) {
                            if ($segments[$i]->type == "end") {
                                $endIndex = $i;
                            } elseif ($segments[$i]->type == "start") {
                                $startIndex = $i;
                            }
                        }
                    }
                    
                    if (isset($startIndex)) {
                        // Start exists, update it.
                        
                        $segments[$startIndex]->lat = $routeUpdate->point->lat;
                        $segments[$startIndex]->lng = $routeUpdate->point->lng;
                        $segments[$startIndex]->dist = 0;
                        $segments[$startIndex]->ele = getElevation($routeUpdate->point->lat, $routeUpdate->point->lng);
                    } else {
                        // Start doesn't exist, add it
                        
                        array_splice($segments, 0, 0, (object)[
                                "lat" => $routeUpdate->point->lat,
                                "lng" => $routeUpdate->point->lng,
                                "dist" => 0,
                                "ele" => getElevation($routeUpdate->point->lat, $routeUpdate->point->lng),
                                "type" => "start"
                        ]);
                        
                        $startIndex = 0;
                        $endIndex = count($segments) - 1;
                    }
                    
                    if (isset($startIndex) && isset($endIndex)) {
                        $newSegments = findPath($segments[$startIndex], $segments[$endIndex]);
                        
                        if (isset($newSegments) && count($newSegments) > 0) {
                            $segments = $newSegments;
                        }
                    }
                }
            } elseif ($routeUpdate->mode == "setEnd") {
                if (!isset($segments) || count($segments) == 0) {
                    $segments = [];
                    
                    array_push($segments, (object)[
                            "lat" => $routeUpdate->point->lat,
                            "lng" => $routeUpdate->point->lng,
                            "dist" => 0,
                            "ele" => getElevation($routeUpdate->point->lat, $routeUpdate->point->lng),
                            "type" => "end"
                    ]);
                } else {
                    // Find "start" and "end"
                    for ($i = 0; $i < count($segments); $i++) {
                        if (isset($segments[$i]->type)) {
                            if ($segments[$i]->type == "end") {
                                $endIndex = $i;
                                
                                break;
                            } elseif ($segments[$i]->type == "start") {
                                $startIndex = $i;
                            }
                        }
                    }
                    
                    if (isset($endIndex)) {
                        // End exists, update it.
                        
                        $segments[$endIndex]->lat = $routeUpdate->point->lat;
                        $segments[$endIndex]->lng = $routeUpdate->point->lng;
                        $segments[$endIndex]->dist = 0;
                        $segments[$endIndex]->ele = getElevation($routeUpdate->point->lat, $routeUpdate->point->lng);
                    } else {
                        // End doesn't exist, add it
                        
                        array_push($segments, (object)[
                                "lat" => $routeUpdate->point->lat,
                                "lng" => $routeUpdate->point->lng,
                                "dist" => 0,
                                "ele" => getElevation($routeUpdate->point->lat, $routeUpdate->point->lng),
                                "type" => "end"
                        ]);
                        
                        $endIndex = count($segments) - 1;
                    }
                    
                    if (isset($startIndex) && isset($endIndex)) {
                        $newSegments = findPath($segments[$startIndex], $segments[$endIndex]);
                        
                        if (isset($newSegments) && count($newSegments) > 0) {
                            $segments = $newSegments;
                        }
                    }
                }
            }
            
            // Write the data to the file.
            file_put_contents($fileName, json_encode($segments));
        }
    }
}
