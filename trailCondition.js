var trailConditions = [];
var trailConditionMarkers = [];
var temporaryTrailConditionPolyLine;
var editingTrailConditionId = null;
var trailConditionMenu;


function trailConditionMenuGet ()
{
	if (trailConditionMenu == undefined)
	{
		trailConditionMenu = new ContextMenu ([
			{title:"Set start marker", func:setStartMarker},
			{title:"Set end marker", func:setEndMarker}]);
	}
	
	return trailConditionMenu;
}


function insertTrailCondition ()
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	
	trailCondition.userHikeId = userHikeId;
	
	// Both markers must be placed on the map.
	if (trailConditionMarkers[0] && trailConditionMarkers[0].map
	 && trailConditionMarkers[1] && trailConditionMarkers[1].map)
	{
		trailCondition.startLat = trailConditionMarkers[0].position.lat ();
		trailCondition.startLng = trailConditionMarkers[0].position.lng ();
		trailCondition.endLat = trailConditionMarkers[1].position.lat ();
		trailCondition.endLng = trailConditionMarkers[1].position.lng ();
	
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					trailCondition = JSON.parse(this.responseText);
	
					trailCondition.polyLine = trailConditionPolylineCreate (
						new google.maps.LatLng({lat: parseFloat(trailCondition.startLat), lng: parseFloat(trailCondition.startLng)}),
						new google.maps.LatLng({lat: parseFloat(trailCondition.endLat), lng: parseFloat(trailCondition.endLng)}),
						'#FF0000');
					
					trailConditions.push(trailCondition);
	
					$("#conditionsLastRow").before(trailConditionRowGet (trailCondition));
					
					calculate ();
				}

				closeEditTrailConditions ();
			}
		}
		
		xmlhttp.open("POST", "/trailCondition.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(trailCondition));
	}
}


function trailConditionTypeGet (type)
{
	if (type == 0)
	{
		return "No Camping";
	}
	else if (type == 1)
	{
		return "No Stealth Camping";
	}
	else if (type == 2)
	{
		return "Other";
	}
}


function trailConditionRowGet (trailCondition)
{
	let txt = "";
	
	txt += "<tr id='trailCondition_" + trailCondition.trailConditionId + "'>";

	txt += "<td style='display:flex;justify-content:flex-start;'>";
	txt += "<span style='padding-right:15px'>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='viewTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-eye-open'></span></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-pencil'></span></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeTrailCondition(" + trailCondition.trailConditionId + ")'><span class='glyphicon glyphicon-trash'></span></a>";
	txt += "</span>"
	txt += trailConditionTypeGet(trailCondition.type) + "</td>";
	txt += "<td align='left'>" + nvl(trailCondition.description, "") + "</td>";
	txt += "<td align='right'>" + nvl(trailCondition.speedFactor, 100) + "</td>";

	txt += "</tr>";

	return txt;
}


function getTrailConditionColor (type)
{
	if (type == 0)
	{
		return '#FF0000';
	}
	else if (type == 1)
	{
		return '#FFA500'; //'#FFFF00'; //'#FFD700'
	}
	else
	{
		return '#FF00FF'; //'#C0C0C0'; //'#708090'
	}
}


function retrieveTrailConditions ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			trailConditions = JSON.parse(this.responseText);
			
			let txt = "";

			for (let t in trailConditions)
			{
				trailConditions[t].polyLine = trailConditionPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					getTrailConditionColor(trailConditions[t].type));

				txt += trailConditionRowGet (trailConditions[t]);
			}
			
			$("#conditionsLastRow").before(txt);
		}
	}
	
	xmlhttp.open("GET", "/trailCondition.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function findTrailConditionIndex (trailConditionId)
{
	for (let t in trailConditions)
	{
		if (trailConditions[t].trailConditionId == trailConditionId)
		{
			return t;
		}
	}
	
	return -1;
}


function moveMarkerToTrail (marker, otherMarker)
{
	let segment = findNearestSegment(trailConditionMarkers[marker].position);
	
	let p = nearestPointOnSegment (
		{x: trailConditionMarkers[marker].position.lat(), y: trailConditionMarkers[marker].position.lng()},
		{x: routeCoords[segment].lat, y: routeCoords[segment].lng},
		{x: routeCoords[segment + 1].lat, y: routeCoords[segment + 1].lng});

	trailConditionMarkers[marker].setPosition ({lat: p.x, lng: p.y});

	if (temporaryTrailConditionPolyLine)
	{
		temporaryTrailConditionPolyLine.setMap(null);
	}
	
	// If both markers are on the map then draw a poly line between them on the trail.
	if (trailConditionMarkers[marker] && trailConditionMarkers[marker].map
	 && trailConditionMarkers[otherMarker] && trailConditionMarkers[otherMarker].map)
	{
		temporaryTrailConditionPolyLine = trailConditionPolylineCreate (
			trailConditionMarkers[marker].position, trailConditionMarkers[otherMarker].position,
			'#FF0000');
	}
}


function markerSetup (marker, position, otherMarker)
{
	if (trailConditionMarkers[marker] == undefined)
	{
		trailConditionMarkers[marker] = new google.maps.Marker({
			position: position,
			map: map,
			draggable: true
		});

		trailConditionMarkers[marker].addListener ("dragend", function (event)
		{
			moveMarkerToTrail (marker, otherMarker);
		});
	}
	else
	{
		trailConditionMarkers[marker].setPosition(position);
		trailConditionMarkers[marker].setMap(map);
	}
}


function setStartMarker (position)
{
	markerSetup (0, position, 1);
	
	moveMarkerToTrail (0, 1);
}


function setEndMarker (position)
{
	markerSetup (1, position, 0);

	moveMarkerToTrail (1, 0);
}


function addTrailCondition ()
{
	setRouteContextMenu (trailConditionMenuGet ());

	$("#trailConditionSaveButton").off('click');
	$("#trailConditionSaveButton").click(function () { insertTrailCondition()});

	$("#editTrailConditions").show (250);
}


function viewTrailCondition (trailConditionId)
{
	let t = findTrailConditionIndex(trailConditionId);
	
	if (t > -1)
	{
		let startPosition = {lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)};
		let endPosition = {lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)};

		positionMapToBounds (startPosition, endPosition);
	}
}


function editTrailCondition (trailConditionId)
{
	let t = findTrailConditionIndex(trailConditionId);
	
	if (t > -1)
	{
		let startPosition = {lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)};
		let endPosition = {lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)};
		
		markerSetup (0, startPosition, 1);
		markerSetup (1, endPosition, 0);
		
		positionMapToBounds (startPosition, endPosition);

		temporaryTrailConditionPolyLine = trailConditionPolylineCreate (
			trailConditionMarkers[0].position, trailConditionMarkers[1].position,
			'#FF0000');

		//
		// If we were editing another trail condition polyline then restore it
		//
		if (editingTrailConditionId != null && trailConditionId != editingTrailConditionId)
		{
			let previous = findTrailConditionIndex(editingTrailConditionId);
			
			trailConditions[previous].polyLine.setMap(map);
		}
		
		editingTrailConditionId = trailConditionId;
		
		trailConditions[t].polyLine.setMap(null);
		
		setRouteContextMenu (trailConditionMenuGet ());

		$("#trailConditionForm select[name='type']").val(trailConditions[t].type);
		$("#trailConditionForm input[name='description']").val(trailConditions[t].description);
		$("#trailConditionForm input[name='speedFactor']").val(nvl(trailConditions[t].speedFactor, 100));

		$("#trailConditionSaveButton").off('click');
		$("#trailConditionSaveButton").click(function () { updateTrailCondition(trailConditionId)});

		$("#editTrailConditions").show (250);

	}
}


function cancelEditTrailConditions ()
{
	// If we were editing a trail condition then restore its polyline.
	if (editingTrailConditionId != null)
	{
		let t = findTrailConditionIndex (editingTrailConditionId);
		
		if (t > -1)
		{
			trailConditions[t].polyLine.setMap(map);
		}
	
		editingTrailConditionId = null;
	}

	closeEditTrailConditions ();
}


function closeEditTrailConditions ()
{
	$("#editTrailConditions").hide(250);

	trailConditionMarkers[0].setMap(null);
	trailConditionMarkers[1].setMap(null);
	temporaryTrailConditionPolyLine.setMap(null);
	
	setRouteContextMenu (routeContextMenu);
}


function updateTrailCondition (trailConditionId)
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	trailCondition.trailConditionId = trailConditionId;
	
	let t = findTrailConditionIndex (trailConditionId);

	trailCondition.startLat = trailConditionMarkers[0].position.lat ();
	trailCondition.startLng = trailConditionMarkers[0].position.lng ();
	trailCondition.endLat = trailConditionMarkers[1].position.lat ();
	trailCondition.endLng = trailConditionMarkers[1].position.lng ();
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4)
		{
			if (this.status == 200)
			{
				let t = findTrailConditionIndex (trailConditionId);
	
				// If there is an existing polyline then remove it from the map.
				if (trailConditions[t].polyLine)
				{
					trailConditions[t].polyLine.setMap(null);
				}
				
				trailConditions[t] = trailCondition;
				
				trailConditions[t].polyLine = trailConditionPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					'#FF0000');
	
				$("#trailCondition_" + trailConditionId).replaceWith (trailConditionRowGet(trailCondition));
	
				calculate ();
			}

			closeEditTrailConditions ();
		}
	}
	
	xmlhttp.open("PUT", "/trailCondition.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(trailCondition));
}


function removeTrailCondition (trailConditionId)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let t = findTrailConditionIndex (trailConditionId);
			
			// If there is an existing polyline then remove it from the map.
			if (trailConditions[t].polyLine)
			{
				trailConditions[t].polyLine.setMap(null);
			}

			trailConditions.splice(t, 1);
			
			$("#trailCondition_" + trailConditionId).remove();
			calculate ();
		}
	}
	
	xmlhttp.open("DELETE", "/trailCondition.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(trailConditionId));
}