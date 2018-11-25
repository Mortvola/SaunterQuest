"use strict";

var hikerProfiles = [];


function nvl(value, replacement)
{
	if (value == null)
	{
		return replacement;
	}
	else
	{
		return value;
	}
}


function hikerProfileRowGet (profile)
{
	let txt = "";
	
	txt += "<tr id='hikerProfile_" + profile.hikerProfileId + "'>";

	txt += "<td>";
	txt += "<a class='btn btn-sm' onclick='editHikerProfile(" + profile.hikerProfileId + ")'><span class='glyphicon glyphicon-pencil'></span></a>";
	txt += "<a class='btn btn-sm' onclick='removeHikerProfile(" + profile.hikerProfileId + ")'><span class='glyphicon glyphicon-trash'></span></a>";
	txt += nvl(profile.startDay, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.endDay, "") + "</td>";
	txt += "<td align='right'>" + nvl(profile.percentage, "") + "</td>";
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
		$("input[name='percentage']").val(hikerProfiles[h].percentage);
		$("input[name='startTime']").val(hikerProfiles[h].startTime);
		$("input[name='endTime']").val(hikerProfiles[h].endTime);
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


function updateHikerProfile (hikerProfileId)
{
	console.log(hikerProfileId);

	var profile = objectifyForm($("#hikerProfileForm").serializeArray());
	profile.hikerProfileId = hikerProfileId;
	
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
