<script>
var pointOfInterestCM = {};
var pointOfInterestUrl = "https://maps.google.com/mapfiles/ms/micons/blue.png";
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


function removePointOfInterest (poi)
{
    $("#pleaseWait").show ();

    $.ajax({
        url: "/pointOfInterest/" + poi.id,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE"
    })
    .done (function()
    {
		var index = findPointOfInterestIndex(poi.id);
		pointsOfInterest[index].marker.removeMarker ();
		
		pointsOfInterest.splice (index, 1);
		
		schedule.retrieve ();
    })
    .always (function ()
    {
        $("#pleaseWait").hide ();
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
        },
        type: "PUT",
        contentType: "application/json",
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


function updatePOI (poi)
{
    let position = poi.marker.getPosition();

    $.ajax({
        url: "/pointOfInterest/" + poi.id,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(position),
        dataType: "json"
    })
    .done (function(responseText)
    {
    });
}


function addPointOfInterest (poi)
{
    poi.marker = new campsiteMarker (map);
    poi.marker.setDraggable (true, function () { updatePOI (poi); });
    poi.marker.setPosition(poi);
	poi.marker.id = poi.id;

    let wayPointCM = [
        {text:"Remove Campsite", index: 0, callback: (event) => { removePointOfInterest (poi); }},
        {separator: true, index: 1}
    ];
    
    poi.marker.setContextMenu(wayPointCM);

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

    $.post({
        url: userHikeId + "/pointOfInterest",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
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
    $.getJSON({
        url: "/pointOfInterest",
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