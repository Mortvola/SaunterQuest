<?php

require_once "config.php";

class pointOfInterest {};
class pointOfInterestConstraint {};


function getPointsOfInterest ($userHikeId)
{
	global $pdo;

	try
	{
		$sql = "select pointOfInterestId, lat, lng, name, description
				from pointOfInterest
				where userHikeId = :userHikeId";

		if ($stmt = $pdo->prepare($sql))
		{
			$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);

			$paramUserHikeId = $userHikeId;

			$stmt->execute ();

			$pointOfInterest = $stmt->fetchAll (PDO::FETCH_CLASS, 'pointOfInterest');

			unset ($stmt);
		}

		if (isset ($pointOfInterest))
		{
			foreach ($pointOfInterest as &$poi)
			{
				$sql = "select pointOfInterestConstraintId, type, time
						from pointOfInterestConstraint
						where pointOfInterestId = :pointOfInterestId";

				if ($stmt = $pdo->prepare($sql))
				{
					$stmt->bindParam(":pointOfInterestId", $paramPointOfInterestId, PDO::PARAM_INT);

					$paramPointOfInterestId = $poi->pointOfInterestId;

					$stmt->execute ();

					$poi->constraints = $stmt->fetchAll (PDO::FETCH_CLASS, 'pointOfInterestConstraint');

					unset ($stmt);
				}
			}

			return $pointOfInterest;
		}
	}
	catch(PDOException $e)
	{
		http_response_code (500);
		echo $e->getMessage();
	}
}
?>