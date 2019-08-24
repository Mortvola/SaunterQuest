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

