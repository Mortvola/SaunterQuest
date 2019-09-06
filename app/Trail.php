<?php

namespace App;


class Trail
{
    public $name;
    public $type;
    public $cn;
    public $routes;
    
    public static function fromJSON ($jsonString)
    {
        $input = json_decode($jsonString);
        
        $trail = new Trail;
        
        $trail->type = $input->type;
        $trail->cn = $input->cn;
        $trail->routes = $input->routes;

        if (isset ($input->name))
        {
            $trail->name = $input->name;
        }
        
        return $trail;
    }

    public function combineRoutes ()
    {
        $mergeCount = 0;
        
        for ($i = 0; $i < count($this->routes);) {
            $route1 = $this->routes[$i]->route;
            
            unset($overallMin);
            for ($j = $i + 1; $j < count($this->routes); $j++) {
                
                $route2 = $this->routes[$j]->route;
                
                $result = routeEndpointConnectivity($route1, $route2);
                
                if (!isset($overallMin)) {
                    $overallMin = $result->distance;
                    $bestRoute2 = $j;
                    $bestResult = $result;
                } else if ($result->distance < $overallMin) {
                    $overallMin = $result->distance;
                    $bestRoute2 = $j;
                    $bestResult = $result;
                }
            }
            
            if (isset($overallMin) && $overallMin <= 30)
            {
                if ($bestResult->first == 0)
                {
                    if ($bestResult->reverse)
                    {
                        $this->routes[$i]->route = array_merge ($route1, array_reverse($route2));
                    }
                    else
                    {
                        $this->routes[$i]->route = array_merge ($route1, $route2);
                    }
                }
                else
                {
                    if ($bestResult->reverse)
                    {
                        $this->routes[$i]->route = array_merge (array_reverse($route2), $route1);
                    }
                    else
                    {
                        $this->routes[$i]->route = array_merge ($route2, $route1);
                    }
                }
                
                // Remove the entry that was merged into the first
                array_splice ($this->routes, $bestRoute2, 1);
                
                $mergeCount++;
                
                // Since we merged then we need to compare the newly merged
                // route against all the other routes so don't increment
                // the index.
            }
            else
            {
                //todo: if the current route had merges then we need to recalculate the
                // bounds.
                $this->routes[$i]->bounds = $this->getBounds ($this->routes[$i]->route);
                
                // Nothing to see here, so move on to the next route.
                $i++;
            }
        }
        
        return $mergeCount;
    }
    
    public function setBounds ()
    {
        // Update bounds information for each route.
        foreach ($this->routes as $route)
        {
            $bounds = $this->getBounds ($route->route);
            
            if ($route->bounds != $bounds)
            {
                $route->bounds = $bounds;
            }
        }
    }
    
    public function analyze ()
    {
        $boundsErrorCount = 0;
        
        // Determine bounds for each route and check to current bounds property.
        // If they are different, record an error.
        foreach ($this->routes as $route)
        {
            $bounds = $this->getBounds ($route->route);
            
            if ($route->bounds != $bounds)
            {
                $boundsErrorCount++;
            }
        }
        
        return $boundsErrorCount;
    }

    private function getBounds ($route)
    {
        foreach ($route as $r) {
            if (isset($r->lat) && isset($r->lng)) {
                if (!isset($minLat)) {
                    $minLat = $r->lat;
                } else {
                    $minLat = min($minLat, $r->lat);
                }
                
                if (!isset($maxLat)) {
                    $maxLat = $r->lat;
                } else {
                    $maxLat = max($maxLat, $r->lat);
                }
                
                if (!isset($minLng)) {
                    $minLng = $r->lng;
                } else {
                    $minLng = min($minLng, $r->lng);
                }
                
                if (!isset($maxLng)) {
                    $maxLng = $r->lng;
                } else {
                    $maxLng = max($maxLng, $r->lng);
                }
            }
        }
        
        return [$minLat, $minLng, $maxLat, $maxLng];
    }
}
