<script>
"use strict";

var hikerProfiles = [];


function hikerProfileRowGet (profile)
{
	let txt = "";
	
	txt += "<tr id='hikerProfile_" + profile.id + "'>";

	txt += "<td style='display:flex;justify-content:space-between;'>";
	txt += "<span>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editHikerProfile(" + profile.id + ")'><i class='fas fa-pencil-alt'></i></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeHikerProfile(" + profile.id + ")'><i class='fas fa-trash-alt'></i></a>";
	txt += "</span>"
	
	// fixup start day.
	var startDay = nvl(profile.startDay, "");
	
	if (startDay != "")
	{
		startDay = parseInt(startDay) + 1;
	}
	
	txt += startDay + "</td>";

	// fixup end day
	var endDay = nvl(profile.endDay, "");
	
	if (endDay != "")
	{
		endDay = parseInt(endDay) + 1;
	}
	
	txt += "<td style='text-align:right'>" + endDay + "</td>";

	txt += "<td style='text-align:right'>" + nvl(profile.speedFactor, "") + "</td>";
	txt += "<td style='text-align:right'>" + timeFormat(nvl(profile.startTime, "")) + "</td>";
	txt += "<td style='text-align:right'>" + timeFormat(nvl(profile.endTime, "")) + "</td>";
	txt += "<td style='text-align:right'>" + nvl(profile.breakDuration, "") + "</td>";

	txt += "</tr>";

	return txt;
}

function retrieveHikerProfiles ()
{
    $.ajax({
        url: userHikeId + "/hikerProfile",
        type: "GET",
        dataType: "json"
    })
    .done (function(responseText)
    {
		hikerProfiles = responseText;
		
		let txt = "";
		
		for (let d in hikerProfiles)
		{
			txt += hikerProfileRowGet (hikerProfiles[d]);
		}

		$("#hikerProfileLastRow").before(txt);
    });
}


function addHikerProfile ()
{
	$("#hikerProfileSaveButton").off('click');
	$("#hikerProfileSaveButton").click(insertHikerProfile);

	$("#hikerProfileDialog").modal ('show');
}


function findHikerProfileIndex (hikerProfileId)
{
	for (let h in hikerProfiles)
	{
		if (hikerProfiles[h].id == hikerProfileId)
		{
			return h;
		}
	}
	
	return -1;
}


function toTimeString (time)
{
	var hour = Math.floor (time);
	if (hour < 10)
	{
		hour = "0" + hour;
	}
	
	var minutes = Math.floor((time - Math.floor (time)) * 60);
	if (minutes < 10)
	{
		minutes = "0" + minutes;
	}
	
	return hour + ":" + minutes;
}


function editHikerProfile (hikerProfileId)
{
	//
	// Find the hiker profile using the hikerProfileId.
	//
	let h = findHikerProfileIndex (hikerProfileId);
	
	if (h > -1)
	{
		$("input[name='startDay']").val(hikerProfiles[h].startDay == "" ? hikerProfiles[h].startDay : parseInt(hikerProfiles[h].startDay) + 1);
		$("input[name='endDay']").val(hikerProfiles[h].endDay == "" ? hikerProfiles[h].endDay : parseInt(hikerProfiles[h].endDay) + 1);
		$("input[name='speedFactor']").val(hikerProfiles[h].speedFactor);
		
		$("input[name='startTime']").val(toTimeString (hikerProfiles[h].startTime));
		$("input[name='endTime']").val(toTimeString(hikerProfiles[h].endTime));
		$("input[name='breakDuration']").val(hikerProfiles[h].breakDuration);
		
		$("#hikerProfileSaveButton").off('click');
		$("#hikerProfileSaveButton").click(function () { updateHikerProfile(hikerProfileId)});
		
		$("#hikerProfileDialog").modal ('show');
	}
}


function toTimeFloat (time)
{
	return parseInt(time.substring (0, 2)) + parseInt(time.substring(3)) / 60.0;
}


function updateHikerProfile (hikerProfileId)
{
	var profile = objectifyForm($("#hikerProfileForm").serializeArray());
	
	if (profile.startDay != "")
	{
		profile.startDay = parseInt(profile.startDay) - 1;
	}
	
	if (profile.endDay != "")
	{
		profile.endDay = parseInt(profile.endDay) - 1;
	}
	
	profile.startTime = toTimeFloat(profile.startTime);
	profile.endTime = toTimeFloat(profile.endTime);
	
	if (profile.breakDuration != "")
	{
		profile.breakDuration = parseInt(profile.breakDuration);
	}

    $.ajax({
        url: userHikeId + "/hikerProfile/" + hikerProfileId,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            "Content-type": "application/json"
        },
        type: "PUT",
        data: JSON.stringify(profile),
        dataType: "json"
    })
    .done (function(responseText)
    {
		let profile = responseText;

		let h = findHikerProfileIndex (hikerProfileId);
		hikerProfiles[h] = profile;
		
		$("#hikerProfile_" + hikerProfileId).replaceWith (hikerProfileRowGet(profile));

		schedule.retrieve ();
    });
}


function insertHikerProfile ()
{
	var profile = objectifyForm($("#hikerProfileForm").serializeArray());
	
	if (profile.startDay != "")
	{
		profile.startDay = parseInt(profile.startDay) - 1;
	}
	
	if (profile.endDay != "")
	{
		profile.endDay = parseInt(profile.endDay) - 1;
	}
	
	profile.startTime = toTimeFloat(profile.startTime);
	profile.endTime = toTimeFloat(profile.endTime);
	
	if (profile.breakDuration != "")
	{
		profile.breakDuration = parseInt(profile.breakDuration);
	}

	profile.userHikeId = userHikeId;
	
    $.ajax({
        url: userHikeId + "/hikerProfile",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            "Content-type": "application/json"
        },
        type: "POST",
        data: JSON.stringify(profile),
        dataType: "json"
    })
    .done (function(responseText)
    {
		profile = responseText;
		hikerProfiles.push (profile);
		
		$("#hikerProfileLastRow").before(hikerProfileRowGet(profile));

		schedule.retrieve ();
    });
}


function removeHikerProfile (hikerProfileId)
{
    $.ajax({
        url: userHikeId + "/hikerProfile" + hikerProfileId,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE"
    })
    .done (function(responseText)
    {
		$("#hikerProfile_" + hikerProfileId).remove();
		schedule.retrieve ();
    });
}
</script>
