"use strict";

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


function objectifyForm(formArray)
{
	var returnObject = {};
	
	for (let i in formArray)
	{
		returnObject[formArray[i]['name']] = formArray[i]['value'];
	}
	
	return returnObject;
}


function metersToMilesRounded (meters)
{
	return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
}


function metersToMiles (meters)
{
	return parseFloat(meters) / 1609.34;
}


function metersToFeet (meters)
{
	return Math.round(parseFloat(meters) * 3.281);
}


function gramsToOunces (grams)
{
	return grams * 0.035274;
}


function gramsToPoundsAndOunces (grams)
{
	let ounces = gramsToOunces (grams);
	let pounds = Math.floor (ounces / 16.0);
	ounces = Math.round(ounces % 16.0);
	
	return pounds.toString () + " lb " + ounces + " oz";
}

//Format time
//Parameter t is in minutes from midnight
function formatTime (t)
{
    let h = Math.floor(t / 60.0);
    let m = Math.floor((t % 60));
    
    let formattedTime = "";
    
    if (h < 10)
    {
        formattedTime = '0' + h;
    }
    else
    {
        formattedTime = h;
    }
    
    if (m < 10)
    {
        formattedTime += ":0" + m;
    }
    else
    {
        formattedTime += ":" + m;
    }
     
    return formattedTime;
}

// Parameter t is a string in the form of HH:MM.
function unformatTime (t)
{
    var time = t.split(':');
    
    return parseInt(time[0]) * 60 + parseInt(time[1]);
}
