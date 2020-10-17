<?php

namespace App;

require_once app_path("routeFile.php");


function foodPlanGet($userId, $foodPlanId)
{
    $foodPlan = \DB::select (\DB::raw (
        "select fi.manufacturer, fi.name, sum(dtfi.number_of_servings) AS totalServings, COALESCE(fiss.description, fi.serving_size_description) AS servingDescription
		from day_template dt
		join day_template_food_item dtfi on dtfi.day_template_id = dt.id
		join food_item fi on fi.id = dtfi.food_item_id
		left join food_item_serving_size fiss on fiss.food_item_id = dtfi.food_item_id and fiss.id = dtfi.food_item_serving_size_id
		where dt.id = :foodPlanId and dt.user_id = :userId
		group by fi.manufacturer, fi.name, COALESCE(fiss.description, fi.serving_size_description)"),
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

function scheduleGet($userHikeId)
{
    return json_decode(file_get_contents(getHikeFolder($userHikeId) . "schedule.json"));
}


function resupplyPackageAdd($shippingLocationId, &$resupplyPackages, &$foodPlanAccumulator)
{
    $resupplyPackage = (object)["items" => $foodPlanAccumulator];

    if (isset($shippingLocationId) && $shippingLocationId != -1) {
        $resupplyPackage->shippingLocation = \DB::select (\DB::raw (
            "select id, name, in_care_of, address1, address2, city, state, zip
			from shipping_location sl
			where id = :shippingLocationId"),
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

        $day = scheduleGet($userHikeId);

        for ($d = 0; $d < count($day); $d++) {
            if (!isset($foodPlans[$day[$d]->foodPlanId])) {
                $foodPlans[$day[$d]->foodPlanId] = foodPlanGet($userId, $day[$d]->foodPlanId);
            }

            for ($i = 0; $i < count($foodPlans[$day[$d]->foodPlanId]); $i++) {
                foodPlanAccumulate($foodPlans[$day[$d]->foodPlanId][$i], $foodPlanAccumulator);
            }

            if (isset($day[$d]->events) && count($day[$d]->events) > 0) {
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
