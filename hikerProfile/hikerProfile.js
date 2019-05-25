"use strict";

var hikerProfiles = [];


function hikerProfileRowGet (profile)
{
	let txt = "";
	
	txt += "<tr id='hikerProfile_" + profile.hikerProfileId + "'>";

	txt += "<td style='display:flex;justify-content:space-between;'>";
	txt += "<span>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editHikerProfile(" + profile.hikerProfileId + ")'><span class='glyphicon glyphicon-pencil'></span></a>";
	txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeHikerProfile(" + profile.hikerProfileId + ")'><span class='glyphicon glyphicon-trash'></span></a>";
	txt += "</span>"
	txt += nvl(profile.startDay, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.endDay, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.speedFactor, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.startTime, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.endTime, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.breakDuration, "") + "</td>";

	txt += "</tr>";

	return txt;
}

function retrieveHikerProfiles ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			hikerProfiles = JSON.parse(this.responseText);
			
			let txt = "";
			
			for (let d in hikerProfiles)
			{
				txt += hikerProfileRowGet (hikerProfiles[d]);
			}

			$("#hikerProfileLastRow").before(txt);
		}
	}
	
	xmlhttp.open("GET", "hikerProfile/hikerProfile.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}


function addHikerProfile ()
{
	$("#hikerProfileSaveButton").off('click');
	$("#hikerProfileSaveButton").click(insertHikerProfile);

	$("#addHikerProfile").modal ('show');
}


function findHikerProfileIndex (hikerProfileId)
{
	for (let h in hikerProfiles)
	{
		if (hikerProfiles[h].hikerProfileId == hikerProfileId)
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
		$("input[name='startDay']").val(hikerProfiles[h].startDay);
		$("input[name='endDay']").val(hikerProfiles[h].endDay);
		$("input[name='speedFactor']").val(hikerProfiles[h].speedFactor);
		
		$("input[name='startTime']").val(toTimeString (hikerProfiles[h].startTime));
		$("input[name='endTime']").val(toTimeString(hikerProfiles[h].endTime));
		$("input[name='breakDuration']").val(hikerProfiles[h].breakDuration);
		
		$("#hikerProfileSaveButton").off('click');
		$("#hikerProfileSaveButton").click(function () { updateHikerProfile(hikerProfileId)});
		
		$("#addHikerProfile").modal ('show');
	}
}


function objectifyForm(formArray)
{
	var returnObject = {};
	
	for (let i in formArray)
	{
		returnObject[formArray[i]['name']] = formArray[i]['value'];
	}
	
	return returnObject;
}


function toTimeFloat (time)
{
	return parseInt(time.substring (0, 2)) + parseInt(time.substring(3)) / 60.0;
}


function updateHikerProfile (hikerProfileId)
{
	var profile = objectifyForm($("#hikerProfileForm").serializeArray());
	profile.hikerProfileId = hikerProfileId;
	
	profile.startTime = toTimeFloat(profile.startTime);
	profile.endTime = toTimeFloat(profile.endTime);
	
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let h = findHikerProfileIndex (hikerProfileId);
			hikerProfiles[h] = profile;
			
			$("#hikerProfile_" + hikerProfileId).replaceWith (hikerProfileRowGet(profile));

			calculate ();
		}
	}
	
	xmlhttp.open("PUT", "hikerProfile/hikerProfile.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(profile));
}


function insertHikerProfile ()
{
	var profile = objectifyForm($("#hikerProfileForm").serializeArray());
	
	profile.startTime = toTimeFloat(profile.startTime);
	profile.endTime = toTimeFloat(profile.endTime);

	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			profile.hikerProfileId = JSON.parse(this.responseText);
			
			$("#hikerProfileLastRow").before(hikerProfileRowGet(profile));

			calculate ();
		}
	}
	
	xmlhttp.open("POST", "hikerProfile/hikerProfile.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("userHikeId=" + userHikeId + "\&profile=" + JSON.stringify(profile));
}


function removeHikerProfile (hikerProfileId)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			$("#hikerProfile_" + hikerProfileId).remove();
			calculate ();
		}
	}
	
	xmlhttp.open("DELETE", "hikerProfile/hikerProfile.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/json");
	xmlhttp.send(JSON.stringify(hikerProfileId));
}
