<?php

require_once "checkLogin.php";
require_once "config.php";
require_once "routeFile.php";

$userId = $_SESSION["userId"];

class foodPlan {};
class shippingLocation {};

function foodPlanGet ($foodPlanId)
{
	global $pdo, $userId;

	try
	{
		$sql = "select fi.manufacturer, fi.name, sum(dtfi.numberOfServings) AS totalServings, IFNULL(fiss.description, fi.servingSizeDescription) AS servingDescription
				from dayTemplate dt
				join dayTemplateFoodItem dtfi on dtfi.dayTemplateId = dt.dayTemplateId
				join foodItem fi on fi.foodItemId = dtfi.foodItemId
				left join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId and fiss.foodItemServingSizeid = dtfi.foodItemServingSizeId
				where dt.dayTemplateId = :foodPlanId and dt.userId = :userId
				group by fi.manufacturer, fi.name, IFNULL(fiss.description, fi.servingSizeDescription)";

		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":foodPlanId", $paramFoodPlanId, PDO::PARAM_INT);
			$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);

			$paramFoodPlanId = $foodPlanId;
			$paramUserId = $userId;

			$stmt->execute ();

			$foodPlan = $stmt->fetchAll(PDO::FETCH_CLASS, 'foodPlan');

			unset ($stmt);
		}

		return $foodPlan;
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}


function foodPlanAccumulate ($foodPlanItem)
{
	global $foodPlanAccumulator;

//	var_dump($foodPlanItem);

	for ($i = 0; $i < count($foodPlanAccumulator); $i++)
	{
//		var_dump($foodPlanAccumulator[$i]);

		if ($foodPlanAccumulator[$i]->manufacturer == $foodPlanItem->manufacturer
		 && $foodPlanAccumulator[$i]->name == $foodPlanItem->name
		 && $foodPlanAccumulator[$i]->servingDescription == $foodPlanItem->servingDescription)
		{
			//echo "Before ", $foodPlanAccumulator[$i]->name, " with ", $foodPlanAccumulator[$i]->totalServings, " servings of ", $foodPlanAccumulator[$i]->servingDescription, "\n";

			//echo "Adding ", $foodPlanItem->name, " with ", $foodPlanItem->totalServings, " servings of ", $foodPlanItem->servingDescription, "\n";
			$foodPlanAccumulator[$i]->totalServings += floatval($foodPlanItem->totalServings);

			//echo "After ", $foodPlanAccumulator[$i]->name, " with ", $foodPlanAccumulator[$i]->totalServings, " servings of ", $foodPlanAccumulator[$i]->servingDescription, "\n";
			//echo "\n";

			break;
		}
	}

	if ($i == count($foodPlanAccumulator))
	{
		$foodPlanAccumulator[] = clone($foodPlanItem);
	}
}

function scheduleGet ()
{
	global $userHikeId;

	return json_decode (file_get_contents (getHikeFolder ($userHikeId) . "schedule.json"));
}


function resupplyPackageAdd ($shippingLocationId)
{
	global $pdo, $resupplyPackages, $foodPlanAccumulator;

	$resupplyPackage = (object)["items" => $foodPlanAccumulator];

	if (isset($shippingLocationId) && $shippingLocationId != -1)
	{
		try
		{
			$sql = "select shippingLocationId, name, inCareOf, address1, address2, city, state, zip
					from shippingLocation sl
					where shippingLocationId = :shippingLocationId";

			if ($stmt = $pdo->prepare($sql))
			{
				$stmt->bindParam(":shippingLocationId", $paramShippingLocationId, PDO::PARAM_INT);

				$paramShippingLocationId = $shippingLocationId;

				$stmt->execute ();

				$shippingLocation = $stmt->fetchAll(PDO::FETCH_CLASS, 'shippingLocation');

				$resupplyPackage->shippingLocation = $shippingLocation;

				unset($stmt);
			}
		}
		catch(PDOException $e)
		{
			http_response_code (500);
			echo $e->getMessage();
		}
	}

	$resupplyPackages[] = $resupplyPackage;

	$foodPlanAccumulator = [];
}


$day = [];
$foodPlans = [];
$foodPlanAccumulator = [];
$resupplyPackages = [];
$nextShippingLocationId = -1;

if ($_SERVER["REQUEST_METHOD"] == "GET")
{
	$userHikeId = $_GET["id"];

	$day = scheduleGet ();

	for ($d = 0; $d < count($day); $d++)
	{
		if (!isset($foodPlans[$day[$d]->foodPlanId]))
		{
			$foodPlans[$day[$d]->foodPlanId] = foodPlanGet ($day[$d]->foodPlanId);
		}

		for ($i = 0; $i < count($foodPlans[$day[$d]->foodPlanId]); $i++)
		{
			foodPlanAccumulate ($foodPlans[$day[$d]->foodPlanId][$i]);
		}

		if (count($day[$d]->events) > 0)
		{
			for ($e = 0; $e < count($day[$d]->events); $e++)
			{
				if ($day[$d]->events[$e]->type == "resupply")
				{
					resupplyPackageAdd ($nextShippingLocationId);

					$nextShippingLocationId = $day[$d]->events[$e]->shippingLocationId;
				}
			}
		}
	}

	resupplyPackageAdd ($nextShippingLocationId);

	echo json_encode($resupplyPackages);
}
?>