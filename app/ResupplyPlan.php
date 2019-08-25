<?php

namespace App;

require_once app_path("routeFile.php");


function foodPlanGet($userId, $foodPlanId)
{
    $foodPlan = \DB::select (\DB::raw (
        "select fi.manufacturer, fi.name, sum(dtfi.numberOfServings) AS totalServings, IFNULL(fiss.description, fi.servingSizeDescription) AS servingDescription
		from dayTemplate dt
		join dayTemplateFoodItem dtfi on dtfi.dayTemplateId = dt.dayTemplateId
		join foodItem fi on fi.foodItemId = dtfi.foodItemId
		left join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId and fiss.foodItemServingSizeid = dtfi.foodItemServingSizeId
		where dt.dayTemplateId = :foodPlanId and dt.userId = :userId
		group by fi.manufacturer, fi.name, IFNULL(fiss.description, fi.servingSizeDescription)"),
        array ("userId" => $userId, "foodPlanId" => $foodPlanId));

    return $foodPlan;
}


function foodPlanAccumulate($foodPlanItem, &$foodPlanAccumulator)
{
    //  var_dump($foodPlanItem);
    
    for ($i = 0; $i < count($foodPlanAccumulator); $i++) {
        //      var_dump($foodPlanAccumulator[$i]);
        
        if ($foodPlanAccumulator[$i]->manufacturer == $foodPlanItem->manufacturer
                && $foodPlanAccumulator[$i]->name == $foodPlanItem->name
                && $foodPlanAccumulator[$i]->servingDescription == $foodPlanItem->servingDescription) {
                    //echo "Before ", $foodPlanAccumulator[$i]->name, " with ", $foodPlanAccumulator[$i]->totalServings, " servings of ", $foodPlanAccumulator[$i]->servingDescription, "\n";
                    
                    //echo "Adding ", $foodPlanItem->name, " with ", $foodPlanItem->totalServings, " servings of ", $foodPlanItem->servingDescription, "\n";
                    $foodPlanAccumulator[$i]->totalServings += floatval($foodPlanItem->totalServings);
                    
                    //echo "After ", $foodPlanAccumulator[$i]->name, " with ", $foodPlanAccumulator[$i]->totalServings, " servings of ", $foodPlanAccumulator[$i]->servingDescription, "\n";
                    //echo "\n";
                    
                    break;
                }
    }
    
    if ($i == count($foodPlanAccumulator)) {
        $foodPlanAccumulator[] = clone($foodPlanItem);
    }
}

function scheduleGet()
{
    global $userHikeId;
    
    return json_decode(file_get_contents(getHikeFolder($userHikeId) . "schedule.json"));
}


function resupplyPackageAdd($shippingLocationId, &$resupplyPackages, &$foodPlanAccumulator)
{
    $resupplyPackage = (object)["items" => $foodPlanAccumulator];
    
    if (isset($shippingLocationId) && $shippingLocationId != -1) {
        $resupplyPackage->shippingLocation = \DB::select (\DB::raw (
            "select shippingLocationId, name, inCareOf, address1, address2, city, state, zip
			from shippingLocation sl
			where shippingLocationId = :shippingLocationId"),
            array ("shippingLocationId" => $shippingLocationId));
    }
    
    $resupplyPackages[] = $resupplyPackage;
    
    $foodPlanAccumulator = [];
}


class resupplyPlan
{
    public static function get ($userId, $userHikeId)
    {
        $foodPlanAccumulator = [];
        $resupplyPackages = [];
        $nextShippingLocationId = -1;
        
        $day = scheduleGet();
        
        for ($d = 0; $d < count($day); $d++) {
            if (!isset($foodPlans[$day[$d]->foodPlanId])) {
                $foodPlans[$day[$d]->foodPlanId] = foodPlanGet($userId, $day[$d]->foodPlanId);
            }
            
            for ($i = 0; $i < count($foodPlans[$day[$d]->foodPlanId]); $i++) {
                foodPlanAccumulate($foodPlans[$day[$d]->foodPlanId][$i], $foodPlanAccumulator);
            }
            
            if (count($day[$d]->events) > 0) {
                for ($e = 0; $e < count($day[$d]->events); $e++) {
                    if ($day[$d]->events[$e]->type == "resupply") {
                        resupplyPackageAdd($nextShippingLocationId, $resupplyPackages, $foodPlanAccumulator);
                        
                        $nextShippingLocationId = $day[$d]->events[$e]->shippingLocationId;
                    }
                }
            }
        }
        
        resupplyPackageAdd($nextShippingLocationId, $resupplyPackages, $foodPlanAccumulator);
        
        return json_encode($resupplyPackages);
    }
}
