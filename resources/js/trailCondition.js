<script>
var trailConditions = [];
var editingTrailConditionId = null;
var trailConditionMenu;

const dialogSpeed = 250;


function trailConditionMenuGet ()
{
	if (trailConditionMenu == undefined)
	{
		trailConditionMenu = new ContextMenu ([
			{title:"Set start marker", func:setRouteHighlightStartMarker},
			{title:"Set end marker", func:setRouteHighlightEndMarker}]);
	}
	
	return trailConditionMenu;
}


function insertTrailCondition ()
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	
	trailCondition.userHikeId = userHikeId;
	
	// Both markers must be placed on the map.
	if (routeHighlightMarkers[0] && routeHighlightMarkers[0].map
	 && routeHighlightMarkers[1] && routeHighlightMarkers[1].map)
	{
		trailCondition.startLat = routeHighlightMarkers[0].position.lat ();
		trailCondition.startLng = routeHighlightMarkers[0].position.lng ();
		trailCondition.endLat = routeHighlightMarkers[1].position.lat ();
		trailCondition.endLng = routeHighlightMarkers[1].position.lng ();
	
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					trailCondition = JSON.parse(this.responseText);
	
					trailCondition.polyLine = routeHighlightPolylineCreate (
						new google.maps.LatLng({lat: parseFloat(trailCondition.startLat), lng: parseFloat(trailCondition.startLng)}),
						new google.maps.LatLng({lat: parseFloat(trailCondition.endLat), lng: parseFloat(trailCondition.endLng)}),
						'#FF0000');
					
					trailConditions.push(trailCondition);
	
					$("#conditionsLastRow").before(trailConditionRowGet (trailCondition));
					
					schedule.retrieve ();
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
	
	txt += "<tr id='trailCondition_" + trailCondition.id + "'>";

	txt += "<td style='display:flex;justify-content:flex-start;'>";
	txt += "<span style='padding-right:15px'>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='viewTrailCondition(" + trailCondition.id + ")'><i class='fas fas-eye'></i></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editTrailCondition(" + trailCondition.id + ")'><i class='fas fa-pencil-alt'></i></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeTrailCondition(" + trailCondition.id + ")'><i class='fas fa-trash-alt'></i></a>";
	txt += "</span>"
	txt += trailConditionTypeGet(trailCondition.type) + "</td>";
	txt += "<td style='text-align:left'>" + nvl(trailCondition.description, "") + "</td>";
	txt += "<td style='text-align:right'>" + nvl(trailCondition.speedFactor, 100) + "</td>";

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
				trailConditions[t].polyLine = routeHighlightPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					getTrailConditionColor(trailConditions[t].type));

				txt += trailConditionRowGet (trailConditions[t]);
			}
			
			$("#conditionsLastRow").before(txt);
		}
	}
	
	xmlhttp.open("GET", "trailCondition?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function findTrailConditionIndex (trailConditionId)
{
	for (let t in trailConditions)
	{
		if (trailConditions[t].id == trailConditionId)
		{
			return t;
		}
	}
	
	return -1;
}


function addTrailCondition ()
{
	setContextMenu (actualRoutePolyline, trailConditionMenuGet ());

	$("#trailConditionSaveButton").off('click');
	$("#trailConditionSaveButton").click(function () { insertTrailCondition()});

	$("#editTrailConditions").show (dialogSpeed);
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
		
		markerSetup (0, startPosition);
		markerSetup (1, endPosition);
		
		positionMapToBounds (startPosition, endPosition);

		highlightBetweenMarkers ();

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
		
		setContextMenu (actualRoutePolyline, trailConditionMenuGet ());

		$("#trailConditionForm select[name='type']").val(trailConditions[t].type);
		$("#trailConditionForm input[name='description']").val(trailConditions[t].description);
		$("#trailConditionForm input[name='speedFactor']").val(nvl(trailConditions[t].speedFactor, 100));

		$("#trailConditionSaveButton").off('click');
		$("#trailConditionSaveButton").click(function () { updateTrailCondition(trailConditionId)});

		$("#editTrailConditions").show (dialogSpeed);

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
	$("#editTrailConditions").hide(dialogSpeed);

	endRouteHighlighting ();
	
	setContextMenu (actualRoutePolyline, routeContextMenu);
}


function updateTrailCondition (trailConditionId)
{
	var trailCondition = objectifyForm($("#trailConditionForm").serializeArray());
	trailCondition.id = trailConditionId;
	
	let t = findTrailConditionIndex (trailConditionId);

	trailCondition.startLat = routeHighlightMarkers[0].position.lat ();
	trailCondition.startLng = routeHighlightMarkers[0].position.lng ();
	trailCondition.endLat = routeHighlightMarkers[1].position.lat ();
	trailCondition.endLng = routeHighlightMarkers[1].position.lng ();
	
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
				
				trailConditions[t].polyLine = routeHighlightPolylineCreate (
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng)}),
					new google.maps.LatLng({lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng)}),
					'#FF0000');
	
				$("#trailCondition_" + trailConditionId).replaceWith (trailConditionRowGet(trailCondition));
	
				schedule.retrieve ();
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
			schedule.retrieve ();
		}
	}
	
	xmlhttp.open("DELETE", "/trailCondition.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(trailConditionId));
}
</script>
