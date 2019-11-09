<?php
namespace App;
use Illuminate\Database\Eloquent\Collection;
use ArrayAccess;
require_once app_path('coordinates.php');
require_once app_path('utilities.php');

class Route implements ArrayAccess
{

    private $hikeId;

    private $anchors;

    private const MAX_ORDER = 100000;

    public function __construct ($hikeId, $loadRelationships = false)
    {
        $this->hikeId = $hikeId;
        $this->loadAnchors();

        if ($loadRelationships)
        {
            $this->getTrailPoints();
            $this->anchors->load('timeConstraints');
        }
    }

    public function save ()
    {
        foreach ($this->anchors as $anchor)
        {
            $anchor->save();
        }
    }

    public function offsetSet ($offset, $value)
    {
        if (is_null($offset))
        {
            $this->anchors[] = $value;
        }
        else
        {
            $this->anchors[$offset] = $value;
        }
    }

    public function offsetExists ($offset)
    {
        return isset($this->anchors[$offset]);
    }

    public function offsetUnset ($offset)
    {
        unset($this->anchors[$offset]);
    }

    public function offsetGet ($offset)
    {
        return isset($this->anchors[$offset]) ? $this->anchors[$offset] : null;
    }

    public function get ($startAnchor = 0, $endAnchor = null)
    {
        $this->getTrailPoints($startAnchor, $endAnchor);

        $this->anchors->load('timeConstraints');

        if ($startAnchor > 0 || ($endAnchor !== null && $endAnchor < $this->anchors->count () - 1))
        {

            return $this->anchors->slice($startAnchor, $endAnchor - $startAnchor + 1)->values ();
        }

        return $this->anchors; // ->values ();
    }

    public function getAnchor ($anchorIndex)
    {
        return array($this->anchors[$anchorIndex]);
    }

    public function anchorCount ()
    {
        return $this->anchors->count();
    }

    public function getDistance ()
    {
        $anchor = $this->anchors->last();

        if ($anchor !== null)
        {
            $this->getTrailPoints();

            return $anchor->dist;
        }

        return 0;
    }

    public function setStart ($point)
    {
        $anchor = $this->anchors->first();

        if ($anchor == null || $anchor->type != 'start')
        {
            $routePoint = new RoutePoint();

            $routePoint->type = "start";
            $routePoint->lat = $point->lat;
            $routePoint->lng = $point->lng;
            $routePoint->hike_id = $this->hikeId;

            $routePoint->sort_order = $this->getSortOrder (-1, 0);

            $this->anchors->prepend($routePoint);
        }
        else
        {
            $anchor->lat = $point->lat;
            $anchor->lng = $point->lng;
        }

        $nextAnchorIndex = $this->findNextAnchorIndex(0);

        if (isset($nextAnchorIndex))
        {
            $nextAnchorId = $this->anchors[$nextAnchorIndex]->id;

            $this->findRouteBetweenAnchors([0, $nextAnchorIndex]);

            $nextAnchorIndex = $this->findAnchorIndexById($nextAnchorId);

            return [[0, $nextAnchorIndex]];
        }
        else
        {
            $trailInfo = Map::getTrailFromPoint($point);

            $this->anchors[0]->lat = $trailInfo->point->lat;
            $this->anchors[0]->lng = $trailInfo->point->lng;
        }

        return [[0]];
    }

    public function setEnd ($point)
    {
        $anchor = $this->anchors->last();

        if ($anchor == null || $anchor->type != 'end')
        {
            $routePoint = new RoutePoint();

            $routePoint->type = "end";
            $routePoint->lat = $point->lat;
            $routePoint->lng = $point->lng;
            $routePoint->hike_id = $this->hikeId;

            $routePoint->sort_order = $this->getSortOrder ($this->anchors->count () -1, $this->anchors->count ());

            $this->anchors->push($routePoint);
        }
        else
        {
            $anchor->lat = $point->lat;
            $anchor->lng = $point->lng;
        }

        $prevAnchorIndex = $this->findPrevAnchorIndex($this->anchors->count() - 1);

        if (isset($prevAnchorIndex))
        {
            $prevAnchorId = $this->anchors[$prevAnchorIndex]->id;

            $this->findRouteBetweenAnchors([$prevAnchorIndex, $this->anchors->count() - 1]);

            $prevAnchorIndex = $this->findAnchorIndexById($prevAnchorId);

            return [[$prevAnchorIndex, $this->anchors->count() - 1]];
        }
        else
        {
            $trailInfo = Map::getTrailFromPoint($point);

            $this->anchors[0]->lat = $trailInfo->point->lat;
            $this->anchors[0]->lng = $trailInfo->point->lng;
        }

        return [[0]];
    }

    public function addWaypoint ($point)
    {
        // Determine if the point is on the route already
        $result = Map::getTrailFromPoint ($point);

        if (isset ($result))
        {
            foreach ($this->anchors as $nextAnchorKey => $nextAnchor)
            {
                if (isset($prevAnchor))
                {
                    if ($this->edgeFractionBetweenAnchors ($result->edge_id, $result->fraction, $prevAnchor, $nextAnchor))
                    {
                        $bestPrevAnchorKey = $prevAnchorKey;
                        $bestNextAnchorKey = $nextAnchorKey;

                        break;
                    }
                }

                $prevAnchor = $nextAnchor;
                $prevAnchorKey = $nextAnchorKey;
            }
        }

        if (isset($bestPrevAnchorKey) && isset($bestNextAnchorKey))
        {
            // The point is on the route. Insert the anchor into the array of anchors.

            $routePoint = new RoutePoint();

            $routePoint->type = "waypoint";
            $routePoint->lat = $result->point->lat;
            $routePoint->lng = $result->point->lng;
            $routePoint->hike_id = $this->hikeId;
            $routePoint->prev_edge_id = $result->edge_id;
            $routePoint->prev_fraction = $result->fraction;
            $routePoint->next_edge_id = $result->edge_id;
            $routePoint->next_fraction = $result->fraction;

            $routePoint->sort_order = $this->getSortOrder($bestPrevAnchorKey, $bestNextAnchorKey);

            $this->anchors->splice($bestPrevAnchorKey + 1, 0, array (
                $routePoint
            ));

            return [[$bestPrevAnchorKey, $bestNextAnchorKey + 1]];
        }
        else
        {
            $routePoint = new RoutePoint();

            $routePoint->id = -1; // Temporary id
            $routePoint->type = "waypoint";
            $routePoint->lat = $point->lat;
            $routePoint->lng = $point->lng;
            $routePoint->hike_id = $this->hikeId;

            $prevAnchorIndex = $this->findNearestAnchor ($point);
            $nextAnchorIndex = $this->findNextAnchorIndex($prevAnchorIndex);
            $routePoint->sort_order = $this->getSortOrder($prevAnchorIndex, $nextAnchorIndex);

            $waypointIndex = $prevAnchorIndex + 1;
            $this->anchors->splice($waypointIndex, 0, array (
                $routePoint
            ));

            // Increment the next anchor index because the insertion of the waypoint
            // into the collection
            $nextAnchorIndex++;

            $prevAnchorId = $this->anchors[$prevAnchorIndex]->id;
            $nextAnchorId = $this->anchors[$nextAnchorIndex]->id;

            $this->findRouteBetweenAnchors([$prevAnchorIndex, $waypointIndex, $nextAnchorIndex]);

            unset($routePoint->id); // Remove the temporary id

            $prevAnchorIndex = $this->findAnchorIndexById($prevAnchorId);
            $nextAnchorIndex = $this->findAnchorIndexById($nextAnchorId);

            return [[$prevAnchorIndex, $nextAnchorIndex]];
        }
    }

    private function edgeFractionBetweenAnchors ($edgeId, $fraction, $prevAnchor, $nextAnchor)
    {
        return (isset ($prevAnchor->next_edge_id) && $prevAnchor->next_edge_id == $edgeId &&
            isset ($nextAnchor->prev_edge_id) && $nextAnchor->prev_edge_id == $edgeId &&
            ($fraction >= $prevAnchor->next_fraction && $fraction <= $nextAnchor->prev_fraction ||
                $fraction >= $nextAnchor->prev_fraction && $fraction <= $prevAnchor->next_fraction));
    }

    public function updateWaypointPosition ($waypointId, $point)
    {
        $waypointIndex = $this->findAnchorIndexById($waypointId);

        if (isset($waypointIndex))
        {
            // Determine if the point is on the route already
            $result = Map::getTrailFromPoint ($point);

            if (isset ($result))
            {
                // First check to see if it was a simple move

                if ($waypointIndex > 0 && $waypointIndex < $this->anchors->count () - 1)
                {
                    $prevAnchor = $this->anchors[$waypointIndex - 1];
                    $nextAnchor = $this->anchors[$waypointIndex + 1];

                    if ($this->edgeFractionBetweenAnchors ($result->edge_id, $result->fraction, $prevAnchor, $nextAnchor))
                    {
                        $bestPrevAnchorKey = $waypointIndex - 1;
                        $bestNextAnchorKey = $waypointIndex + 1;
                    }
                }

                if (!isset($bestPrevAnchorKey) || !isset($bestNextAnchorKey))
                {
                    // It was apparently moved outside the previous or next anchor. Search
                    // the list until it is found.
                    foreach ($this->anchors as $nextAnchorKey => $nextAnchor)
                    {
                        if ($nextAnchorKey != $waypointIndex)
                        {
                            if (isset($prevAnchor))
                            {
                                if ($this->edgeFractionBetweenAnchors ($result->edge_id, $result->fraction, $prevAnchor, $nextAnchor))
                                {
                                    $bestPrevAnchorKey = $prevAnchorKey;
                                    $bestNextAnchorKey = $nextAnchorKey;

                                    break;
                                }
                            }

                            $prevAnchor = $nextAnchor;
                            $prevAnchorKey = $nextAnchorKey;
                        }
                    }
                }
            }

            $anchor = $this->anchors[$waypointIndex];

            if (isset($bestPrevAnchorKey) && isset($bestNextAnchorKey))
            {
                error_log ("moving anchor between " . $bestPrevAnchorKey . " and " . $bestNextAnchorKey);

                $updates = [];

                if ($bestPrevAnchorKey < $waypointIndex && $waypointIndex < $bestNextAnchorKey)
                {
                    error_log ("simple move");

                    $anchor->lat = $result->point->lat;
                    $anchor->lng = $result->point->lng;
                    $anchor->prev_fraction = $result->fraction;
                    $anchor->next_fraction = $result->fraction;

                    $updates[] = [$bestPrevAnchorKey, $bestNextAnchorKey];
                }
                else
                {
                    $anchor->lat = $result->point->lat;
                    $anchor->lng = $result->point->lng;
                    $anchor->prev_edge_id = $result->edge_id;
                    $anchor->prev_fraction = $result->fraction;
                    $anchor->next_edge_id = $result->edge_id;
                    $anchor->next_fraction = $result->fraction;

                    $anchor->sort_order = $this->getSortOrder($bestPrevAnchorKey, $bestNextAnchorKey);

                    // Remove the waypoint from the collection and re-insert it into its new location
                    $this->anchors->splice($waypointIndex, 1);

                    // Adjust the previous anchor key (index) if the
                    // the waypoint index was less than the previous anchor key (index)
                    // since we removed it.
                    if ($waypointIndex < $bestPrevAnchorKey)
                    {
                        $bestPrevAnchorKey--;
                    }

                    if ($waypointIndex < $bestNextAnchorKey)
                    {
                        $bestNextAnchorKey--;
                    }

                    if ($bestNextAnchorKey < $waypointIndex)
                    {
                        $waypointIndex++;
                    }

                    $this->anchors->splice($bestPrevAnchorKey + 1, 0, array (
                        $anchor
                    ));

                    // Increment the next anchor key since we just inserted the
                    // anchor before it.
                    $bestNextAnchorKey++;

                    $updates[] = [$waypointIndex - 1, $waypointIndex];
                    $updates[] = [$bestPrevAnchorKey, $bestNextAnchorKey];
                }

                return $updates;
            }
            else
            {
                $this->anchors[$waypointIndex]->lat = $point->lat;
                $this->anchors[$waypointIndex]->lng = $point->lng;

                $prevAnchorIndex = $this->findPrevAnchorIndex($waypointIndex);
                $nextAnchorIndex = $this->findNextAnchorIndex($waypointIndex);

                $prevAnchorId = $this->anchors[$prevAnchorIndex]->id;
                $nextAnchorId = $this->anchors[$nextAnchorIndex]->id;

                // The route after the waypoint needs to be found first because the
                // index
                // of the anchor will change.
                $this->findRouteBetweenAnchors([$prevAnchorIndex, $waypointIndex, $nextAnchorIndex]);

                $prevAnchorIndex = $this->findAnchorIndexById($prevAnchorId);
                $nextAnchorIndex = $this->findAnchorIndexById($nextAnchorId);

                return [[$prevAnchorIndex, $nextAnchorIndex]];
            }
        }
    }

    public function updateWaypointDetails ($waypointId, $details)
    {
        $waypointIndex = $this->findAnchorIndexById($waypointId);

        if (isset($waypointIndex))
        {
            $waypoint = $this->anchors[$waypointIndex];

            $waypoint->name = $details->name;

            foreach ($details->timeConstraints as $constraint)
            {
                if (isset($constraint->id) && $constraint->id !== null)
                {
                    $timeConstraint = $waypoint->timeConstraints->find($constraint->id);

                    $timeConstraint->type = $constraint->type;
                    $timeConstraint->time = $constraint->time;
                }
                else
                {
                    $timeConstraint = new TimeConstraint;

                    $timeConstraint->type = $constraint->type;
                    $timeConstraint->time = $constraint->time;
                }

                $waypoint->timeConstraints()->save ($timeConstraint);
            }
        }
    }

    public function deleteWaypoint ($waypointId)
    {
        $waypointIndex = $this->findAnchorIndexById($waypointId);

        if (isset($waypointIndex))
        {
            $prevAnchorIndex = $this->findPrevAnchorIndex($waypointIndex);

            // Delete the anchor
            $this->anchors[$waypointIndex]->delete();
            $this->anchors->splice($waypointIndex, 1);

            $nextAnchorIndex = $this->findNextAnchorIndex($prevAnchorIndex);

            $prevAnchorId = $this->anchors[$prevAnchorIndex]->id;
            $nextAnchorId = $this->anchors[$nextAnchorIndex]->id;

            $this->findRouteBetweenAnchors([$prevAnchorIndex, $nextAnchorIndex]);

            $prevAnchorIndex = $this->findAnchorIndexById($prevAnchorId);
            $nextAnchorIndex = $this->findAnchorIndexById($nextAnchorId);

            return [[$prevAnchorIndex, $nextAnchorIndex]];
        }
    }

    public function setWaypointOrder ($order)
    {
        $prevAnchorIndex = -1;

        for ($i = 0; $i < count($order); $i++)
        {
            $nextAnchorIndex = $this->findNextAnchorIndex($prevAnchorIndex);

            if ($order[$i] != $this->anchors[$nextAnchorIndex]->id)
            {
                $anchorIndex = $this->findAnchorIndexById($order[$i]);

                // Since we are going to pull out the anchor we need to
                // mark its previous anchor so that it re-find's the route.
                $prevAnchorIndex2 = $this->findPrevAnchorIndex($anchorIndex);
                if (isset($prevAnchorIndex2))
                {
                    $this->anchors[$prevAnchorIndex2]->findRoute = true;
                }

                // Remove the anchor from its current location and
                // re-insert it at the new location.
                $anchor = $this->anchors->splice($anchorIndex, 1)[0];
                $this->anchors->splice($nextAnchorIndex, 0, array (
                    $anchor
                ));

                $anchor->sort_order = $this->getSortOrder ($prevAnchorIndex, $nextAnchorIndex + 1);

                $anchor->findRoute = true;

                if ($prevAnchorIndex != -1)
                {
                    $this->anchors[$prevAnchorIndex]->findRoute = true;
                }
            }

            $prevAnchorIndex = $nextAnchorIndex;
        }

        $anchorIndex = 0;

        for (;;)
        {
            $nextAnchorIndex = $this->findNextAnchorIndex($anchorIndex);

            if (!isset($nextAnchorIndex))
            {
                break;
            }

            if ($this->anchors[$anchorIndex]->findRoute)
            {
                $this->findRouteBetweenAnchors([$anchorIndex, $nextAnchorIndex]);

                // We need to find the next anchor index again as it may have
                // changed with the deletions or insertions of 'soft' anchors.
                $nextAnchorIndex = $this->findNextAnchorIndex($anchorIndex);

                unset($this->anchors[$anchorIndex]->findRoute);
            }

            $anchorIndex = $nextAnchorIndex;
        }
    }

    public function findRoute ($dumpGraph = false)
    {
        for (;;)
        {
            $nextAnchorIndex = $this->findNextAnchorIndex($prevAnchorIndex);

            if (!isset($nextAnchorIndex))
            {
                break;
            }

            $this->findRouteBetweenAnchors([$prevAnchorIndex, $nextAnchorIndex]);

            $prevAnchorIndex = $nextAnchorIndex;
        }
    }

    private function findPath ($anchors, $startRoute = null, $dumpGraph = false)
    {
        error_log ('anchors: ' . json_encode ($anchors));

        $request = (object)[
            "method" => "GET",
            "command" => "/map/route",
        ];

        foreach ($anchors as $anchor)
        {
            $request->points[] = (object)["lat" => $anchor->lat, "lng" => $anchor->lng];
        }

        return sendRequest ($request);
    }

    private function findRouteBetweenAnchors ($anchorIndexes, $startRoute = null)
    {
        $anchors = [];
        foreach ($anchorIndexes as $index)
        {
            $anchor = $this->anchors[$index];

            if (!isset($anchor))
            {
                return;
            }

            $anchors[] = $anchor;
        }

        $newAnchorsArray = $this->findPath($anchors, $startRoute);

        if (isset($newAnchorsArray)) // && count($newAnchors) >= 2)
        {
            for ($a = 0; $a < count($anchors) - 1; $a++)
            {
                $newAnchors = $newAnchorsArray[$a];

                $anchorIndex1 = $this->findAnchorIndexById($anchors[$a]->id);
                $anchorIndex2 = $this->findAnchorIndexById($anchors[$a + 1]->id);

                // Delete 'soft' anchors between the two anchors
                for ($i = $anchorIndex1 + 1; $i < $anchorIndex2; $i++)
                {
                    $this->anchors[$i]->delete();
                }

                $this->anchors->splice($anchorIndex1 + 1, $anchorIndex2 - $anchorIndex1 - 1);

                //$anchorIndex1 = $this->findAnchorIndexById($anchors[$a]->id);
                $anchor1 = $this->anchors[$anchorIndex1];
                $anchor1->lat = $newAnchors[0]->point->lat;
                $anchor1->lng = $newAnchors[0]->point->lng;

                if (isset($newAnchors[0]->prev))
                {
                    $anchor1->prev_edge_id = $newAnchors[0]->prev->edge_id;
                    $anchor1->prev_fraction = $newAnchors[0]->prev->fraction;
                }

                if (isset($newAnchors[0]->next))
                {
                    $anchor1->next_edge_id = $newAnchors[0]->next->edge_id;
                    $anchor1->next_fraction = $newAnchors[0]->next->fraction;
                }

                if (isset($newAnchors[0]->node_id))
                {
                    $anchor1->node_id = $newAnchors[$i]->node_id;
                }

                for ($i = 1; $i < count($newAnchors) - 1; $i++)
                {
                    $routePoint = new RoutePoint();

                    $routePoint->lat = $newAnchors[$i]->point->lat;
                    $routePoint->lng = $newAnchors[$i]->point->lng;

                    if (isset($newAnchors[$i]->prev))
                    {
                        $routePoint->prev_edge_id = $newAnchors[$i]->prev->edge_id;
                        $routePoint->prev_fraction = $newAnchors[$i]->prev->fraction;
                    }

                    if (isset($newAnchors[$i]->next))
                    {
                        $routePoint->next_edge_id = $newAnchors[$i]->next->edge_id;
                        $routePoint->next_fraction = $newAnchors[$i]->next->fraction;
                    }

                    if (isset($newAnchors[$i]->node_id))
                    {
                        $routePoint->node_id = $newAnchors[$i]->node_id;
                    }

                    $routePoint->hike_id = $this->hikeId;

                    $routePoint->sort_order = $this->getSortOrder ($anchorIndex1 + $i - 1, $anchorIndex1 + $i);

                    $this->anchors->splice($anchorIndex1 + $i, 0, array (
                        $routePoint
                    ));
                }

                $anchorIndex2 = $this->findAnchorIndexById($anchors[$a + 1]->id);
                $anchor2 = $this->anchors[$anchorIndex2];
                $anchor2->lat = $newAnchors[count($newAnchors) - 1]->point->lat;
                $anchor2->lng = $newAnchors[count($newAnchors) - 1]->point->lng;

                if (isset($newAnchors[count($newAnchors) - 1]->prev))
                {
                    $anchor2->prev_edge_id = $newAnchors[count($newAnchors) - 1]->prev->edge_id;
                    $anchor2->prev_fraction = $newAnchors[count($newAnchors) - 1]->prev->fraction;
                }

                if (isset($newAnchors[count($newAnchors) - 1]->next))
                {
                    $anchor2->next_edge_id = $newAnchors[count($newAnchors) - 1]->next->edge_id;
                    $anchor2->next_fraction = $newAnchors[count($newAnchors) - 1]->next->fraction;
                }

                if (isset($newAnchors[count($newAnchors) - 1]->node_id))
                {
                    $anchor2->node_id = $newAnchors[count($newAnchors) - 1]->node_id;
                }
            }

            $this->anchors = $this->anchors->values();
        }
    }

    private function findNextAnchorIndex ($startIndex)
    {
        if ($this->anchors->count() >= 2)
        {
            for ($i = $startIndex + 1; $i < $this->anchors->count(); $i++)
            {
                if (isset($this->anchors[$i]->type))
                {
                    return $i;
                }
            }
        }
    }

    private function findPrevAnchorIndex ($startIndex)
    {
        if ($this->anchors->count() >= 2)
        {
            for ($i = $startIndex - 1; $i >= 0; $i--)
            {
                if (isset($this->anchors[$i]->type))
                {
                    return $i;
                }
            }
        }
    }

    private function findAnchorIndexById ($id)
    {
        for ($i = 0; $i < $this->anchors->count(); $i++)
        {
            if ($this->anchors[$i]->id == $id)
            {
                return $i;
            }
        }
    }

    private function loadAnchors ()
    {
        $this->anchors = RoutePoint::where('hike_id', $this->hikeId)->get()
            ->sortBy('sort_order')
            ->values();
    }

    private function getTrailPointsBetweenAnchors ($anchorIndex)
    {
        $prevAnchor = $this->anchors[$anchorIndex];
        $nextAnchor = $this->anchors[$anchorIndex + 1];

        // If this segment and the next start on the same trail then
        // find the route along the trail.
        if (isset($prevAnchor->next_edge_id) && isset($nextAnchor->prev_edge_id) &&
            $prevAnchor->next_edge_id == $nextAnchor->prev_edge_id &&
            $prevAnchor->next_fraction != $nextAnchor->prev_fraction)
        {
            $trail = Map::getPath($prevAnchor->next_edge_id, $prevAnchor->next_fraction, $nextAnchor->prev_fraction);

            // array_splice ($this->anchors, $s + 1, 0, $trail);
            // $s += count($trail);

            if (count($trail) > 0)
            {
                array_splice($trail, 0, 1);
                array_splice($trail, count($trail) - 1, 1);
            }

            $prevAnchor->trail = $trail;
        }
        else
        {
            error_log("index: " . $anchorIndex . ", next edge id: " . $prevAnchor->next_edge_id . ", next fraction: " . $prevAnchor->next_fraction);
            error_log("index: " . ($anchorIndex + 1) . ", prev edge id: " . $nextAnchor->prev_edge_id . ", prev fraction: " . $nextAnchor->prev_fraction);
        }
    }

    private function getTrailPoints ($startAnchor = 0, $endAnchor = null)
    {
        if ($endAnchor === null)
        {
            $endAnchor = $this->anchors->count () - 1;
        }

        for ($s = $startAnchor; $s < $endAnchor; $s++)
        {
            $this->getTrailPointsBetweenAnchors ($s);
        }

        $this->assignDistances($startAnchor, $endAnchor);
    }

    private function getSortOrder ($prevAnchorIndex, $nextAnchorIndex)
    {
        for ($i = 0; $i < 2; $i++)
        {
            if ($prevAnchorIndex < 0 || $this->anchors->count () == 0)
            {
                $prevOrder = 0;
            }
            else
            {
                $prevOrder = $this->anchors[$prevAnchorIndex]->sort_order;
            }

            if ($nextAnchorIndex >= $this->anchors->count ())
            {
                $nextOrder = Route::MAX_ORDER;
            }
            else
            {
                $nextOrder = $this->anchors[$nextAnchorIndex]->sort_order;
            }

            $order = $prevOrder + intval(($nextOrder - $prevOrder) / 2);

            if (($prevAnchorIndex >= 0 && $order == $this->anchors[$prevAnchorIndex]->sort_order)
                || ($nextAnchorIndex < $this->anchors->count() && $order == $this->anchors[$nextAnchorIndex]->sort_order))
            {
                $this->updateSortOrder ();
            }
            else
            {
                break;
            }
        }

        return $order;
    }

    private function updateSortOrder ()
    {
        $valuePerAnchor = intval(Route::MAX_ORDER / $this->anchors->count());

        foreach ($this->anchors as $anchor)
        {
            if (isset($prevAnchor))
            {
                $anchor->sort_order = $prevAnchor->sort_order + $valuePerAnchor;
            }
            else
            {
                $anchor->sort_order = $valuePerAnchor;
            }

            $prevAnchor = $anchor;
        }
    }

    private function findNearestAnchor ($point)
    {
        for ($i = 0; $i < $this->anchors->count () - 1; $i++)
        {
            $anchor = $this->anchors[$i];

            if (isset($anchor->type))
            {
                $anchorIndex = $i;
            }

            if (isset($anchor->trail))
            {
                list($s, $distance) = nearestSegmentFind($point->lat, $point->lng, $anchor->trail);

                if ($s > -1 && (!isset($closestDistance) || $distance < $closestDistance))
                {
                    $closestDistance = $distance;
                    $closestAnchorIndex = $anchorIndex;
                }
            }
        }

        if (isset ($closestAnchorIndex))
        {
            return $closestAnchorIndex;
        }
    }

    private function assignTrailDistances ($trail, $distance, $prevLat, $prevLng)
    {
        $elevation = new Elevation;

        for ($t = 0; $t < count($trail); $t++)
        {
            $distance += haversineGreatCircleDistance($prevLat, $prevLng, $trail[$t]->point->lat, $trail[$t]->point->lng);

            $trail[$t]->dist = $distance;
            $trail[$t]->point->ele = $elevation->getElevation($trail[$t]->point->lat, $trail[$t]->point->lng);

            $prevLat = $trail[$t]->point->lat;
            $prevLng = $trail[$t]->point->lng;
        }

        return [
            $distance,
            $prevLat,
            $prevLng
        ];
    }

    private function assignDistances ($startAnchor, $endAnchor)
    {
        $elevation = new Elevation;

        for ($a = $startAnchor; $a <= $endAnchor; $a++)
        {
            $anchor = $this->anchors[$a];

            if (isset($prevAnchor))
            {
                // Find distance from previous anchor, either via trail or straight line
                // distance.
                $prevLat = $prevAnchor->lat;
                $prevLng = $prevAnchor->lng;

                if (isset($prevAnchor->trail))
                {
                    list ($distance, $prevLat, $prevLng) = $this->assignTrailDistances($prevAnchor->trail, $distance, $prevLat, $prevLng);
                }

                $distance += haversineGreatCircleDistance($prevLat, $prevLng, $anchor->lat, $anchor->lng);
            }
            else
            {
                $distance = 0;
            }

            $anchor->dist = $distance;
            $anchor->ele = $elevation->getElevation($anchor->lat, $anchor->lng);

            $prevAnchor = $anchor;
        }
    }
}
