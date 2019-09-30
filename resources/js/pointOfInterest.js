<script>
var pointOfInterestCM = {};
var pointOfInterestUrl = "http://maps.google.com/mapfiles/ms/micons/blue.png";
var pointsOfInterest = [];


function findPointOfInterestIndex (poiId)
{
	for (let p in pointsOfInterest)
	{
		if (pointsOfInterest[p].id == poiId)
		{
			return p;
		}
	}
	
	return -1;
}


function removePointOfInterest (object, position)
{
	$.ajax({
        url: userHikeId + "/pointOfInterest/" + object.id,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE"
    })
    .done (function()
    {
		var index = findPointOfInterestIndex(object.id);
		pointsOfInterest[index].marker.setMap (null);
		removeContextMenu (pointsOfInterest[index].marker);
		
		pointsOfInterest.splice (index);
		
		schedule.retrieve ();
    });
}


function updatePointOfInterest (poiId)
{
	var pointOfInterest = objectifyForm($("#pointOfInterestForm").serializeArray());

	pointOfInterest.id = poiId;
	
	var index = findPointOfInterestIndex(poiId);

	pointOfInterest.lat = pointsOfInterest[index].lat;
	pointOfInterest.lng = pointsOfInterest[index].lng;
	pointOfInterest.constraints = pointsOfInterest[index].constraints;
	
	if (pointOfInterest.hangOut !== undefined && pointOfInterest.hangOut != "")
	{
		if (pointOfInterest.constraints == undefined || pointOfInterest.constraints.length == 0)
		{
			pointOfInterest.constraints = [];
			pointOfInterest.constraints.push({type: 'linger', time: pointOfInterest.hangOut});
		}
		else
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
	}
	else
	{
		for (let c in pointOfInterest.constraints)
		{
			if (pointOfInterest.constraints[c].type == 'linger')
			{
				pointOfInterest.constraints[c].remove = true;
				
				break;
			}
		}
	}

	delete pointOfInterest.hangOut;
	
    $.ajax({
        url: userHikeId + "/pointOfInterest/" + poiId,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            "Content-type": "application/json"
        },
        type: "PUT",
        data: JSON.stringify(pointOfInterest),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let poi = responseText;

		pointsOfInterest[index].lat = poi.lat;
		pointsOfInterest[index].lng = poi.lng;
		pointsOfInterest[index].name = poi.name;
		pointsOfInterest[index].description = poi.description;
		pointsOfInterest[index].constraints = poi.constraints;
		
		pointsOfInterest[index].message = getInfoWindowMessage(poi);
    });
}

function editPointOfInterest (object, position)
{
	var index = findPointOfInterestIndex(object.id);

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
	$("#pointOfInterestSaveButton").click(function () { updatePointOfInterest(object.id)});
	
	$("#addPointOfInterest").modal ('show');
}

function getInfoWindowMessage (poi)
{
	return "<div>" + poi.name + "</div>"
	+ "<div>" + poi.description + "</div>";
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

	poi.marker.id = poi.id;
	
	setContextMenu (poi.marker, pointOfInterestCM);
	
	poi.listener = attachInfoWindowMessage(poi,
		getInfoWindowMessage (poi));

	pointsOfInterest.push(poi);
}


function insertPointOfInterest (position)
{
	var pointOfInterest = objectifyForm($("#pointOfInterestForm").serializeArray());
	
	pointOfInterest.lat = position.lat ();
	pointOfInterest.lng = position.lng ();
	pointOfInterest.userHikeId = userHikeId;
	
	if (pointOfInterest.hangOut != "")
	{
		pointOfInterest.constraints = [];
		pointOfInterest.constraints.push({type: 'linger', time: pointOfInterest.hangOut});
		delete pointOfInterest.hangOut;
	}

    $.ajax({
        url: userHikeId + "/pointOfInterest",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            "Content-type": "application/json"
        },
        type: "POST",
        data: JSON.stringify(pointOfInterest),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let poi = responseText;

		addPointOfInterest(poi);

		schedule.retrieve();
    });
}


function showAddPointOfInterest (object, position)
{
	$("#pointOfInterestSaveButton").off('click');
	$("#pointOfInterestSaveButton").click(function () { insertPointOfInterest(position); });

	$("#addPointOfInterest").modal ('show');
}


function retrievePointsOfInterest ()
{
    $.get({
        url: userHikeId + "/pointOfInterest",
        dataType: "json"
    })
    .done (function(responseText)
    {
		var poi = responseText;

		if (map)
		{
			for (let p in poi)
			{
				addPointOfInterest (poi[p]);
			}
		}
    });
}
</script>