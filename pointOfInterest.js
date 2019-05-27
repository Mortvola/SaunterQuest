var pointOfInterestCM = {};
var pointOfInterestUrl = "http://maps.google.com/mapfiles/ms/micons/blue.png";
var pointsOfInterest = [];


function findPointOfInterestIndex (poiId)
{
	for (let p in pointsOfInterest)
	{
		if (pointsOfInterest[p].pointOfInterestId == poiId)
		{
			return p;
		}
	}
	
	return -1;
}


function removePointOfInterest (object, position)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			var index = findPointOfInterestIndex(object.pointOfInterestId);
			pointsOfInterest[index].marker.setMap (null);
			removeContextMenu (pointsOfInterest[index].marker);
			
			pointsOfInterest.splice (index);
			
			calculate ();
		}
	}
	
	xmlhttp.open("DELETE", "pointOfInterest.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(object.pointOfInterestId));
}


function updatePointOfInterest (poiId)
{
	var pointOfInterest = objectifyForm($("#pointOfInterestForm").serializeArray());

	pointOfInterest.pointOfInterestId = poiId;
	
	var index = findPointOfInterestIndex(poiId);

	pointOfInterest.lat = pointsOfInterest[index].lat;
	pointOfInterest.lng = pointsOfInterest[index].lng;
	
	if (pointOfInterest.constraints != undefined)
	{
		for (let c in pointOfInterest.constraints)
		{
			if (pointOfInterest.constraints[c].type == 'linger')
			{
				pointOfInterest.constraints[c].time = pointOfInterest.hangOut;
				break;
			}
		}
	}
	else
	{
		pointOfInterest.constraints = [];
		pointOfInterest.constraints.push({type: 'linger', time: pointOfInterest.hangOut});
	}

	delete pointOfInterest.hangOut;
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			pointsOfInterest[index] = pointOfInterest;
		}
	}
	
	xmlhttp.open("PUT", "pointOfInterest.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(pointOfInterest));
}

function editPointOfInterest (object, position)
{
	var index = findPointOfInterestIndex(object.pointOfInterestId);

	$("input[name='name']").val(pointsOfInterest[index].name);
	$("input[name='description']").val(pointsOfInterest[index].description);

	if (pointsOfInterest[index].constraints != undefined)
	{
		for (let c in pointsOfInterest[index].constraints)
		{
			if (pointsOfInterest[index].constraints[c].type == 'linger')
			{
				$("input[name='hangOut']").val(pointsOfInterest[index].constraints[c].time);
				break;
			}
		}
	}
	
	$("#pointOfInterestSaveButton").off('click');
	$("#pointOfInterestSaveButton").click(function () { updatePointOfInterest(poiId)});
	
	$("#addPointOfInterest").modal ('show');
}

function addPointOfInterest (poi)
{
	poi.marker = new google.maps.Marker({
		position: {lat: parseFloat(poi.lat), lng: parseFloat(poi.lng)},
		map: map,
		icon: {
			url: pointOfInterestUrl
		}
	});

	poi.marker.pointOfInterestId = poi.pointOfInterestId;
	
	setContextMenu (poi.marker, pointOfInterestCM);
	
	poi.listener = attachInfoWindowMessage(poi,
		"<div>" + poi.name + "</div>"
		+ "<div>" + poi.description + "</div>");

	pointsOfInterest.push(poi);
}


function insertPointOfInterest (position)
{
	var pointOfInterest = objectifyForm($("#pointOfInterestForm").serializeArray());
	
	pointOfInterest.lat = position.lat ();
	pointOfInterest.lng = position.lng ();
	pointOfInterest.userHikeId = userHikeId;
	
	pointOfInterest.constraints = [];
	pointOfInterest.constraints.push({type: 'linger', time: pointOfInterest.hangOut});
	delete pointOfInterest.hangOut;

	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let poi = JSON.parse(this.responseText);

			addPointOfInterest(poi);

			calculate();
		}
	}

	xmlhttp.open("POST", "pointOfInterest.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(pointOfInterest));
}


function showAddPointOfInterest (object, position)
{
	$("#pointOfInterestSaveButton").off('click');
	$("#pointOfInterestSaveButton").click(function () { insertPointOfInterest(position); });

	$("#addPointOfInterest").modal ('show');
}


function retrievePointsOfInterest ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			var poi = JSON.parse(this.responseText);

			if (map)
			{
				for (let p in poi)
				{
					addPointOfInterest (poi[p]);
				}
			}
		}
	}
	
	xmlhttp.open("GET", "pointOfInterest.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


