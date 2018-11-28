<?php 

require_once "checkLogin.php";

$userId = $_SESSION["userId"];
$userHikeId = $_GET["id"];
// $userId = 1;
// $userHikeId = 100027;

require_once "config.php";

class foodPlan {};

function foodPlanGet ($foodPlanId)
{
	global $pdo, $userId;
	
	try
	{
		$sql = "select fi.manufacturer, fi.name, sum(dtfi.numberOfServings) AS totalServings, fiss.description AS servingDescription
				from dayTemplate dt
				join dayTemplateFoodItem dtfi on dtfi.dayTemplateId = dt.dayTemplateId
				join foodItem fi on fi.foodItemId = dtfi.foodItemId
				join foodItemServingSize fiss on fiss.foodItemId = dtfi.foodItemId and fiss.foodItemServingSizeid = dtfi.foodItemServingSizeId
				where dt.dayTemplateId = :foodPlanId and dt.userId = :userId
				group by fi.manufacturer, fi.name, fiss.description";
		
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

function scheduleGet (&$day)
{
	global $pdo, $userHikeId;
	
	try
	{
		$sql = "select data from userHike where userHikeId = :userHikeId";
		
		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
			
			$stmt->bindColumn("data", $columnData);
			
			$paramUserHikeId = $userHikeId;
			
			$stmt->execute ();
			
			$stmt->fetch(PDO::FETCH_BOUND);
		
			$day = json_decode($columnData);
		
			unset($stmt);
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}


function resupplyPackageAdd ()
{
	global $resupplyPackages, $foodPlanAccumulator;
	
	$resupplyPackages[] = (object)["items" => $foodPlanAccumulator];
	$foodPlanAccumulator = [];
}

$day = [];
$foodPlans = [];
$foodPlanAccumulator = [];
$resupplyPackages = [];

scheduleGet ($day);

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
				resupplyPackageAdd ();
			}
		}
	}
}

resupplyPackageAdd ();

echo json_encode($resupplyPackages);

?>