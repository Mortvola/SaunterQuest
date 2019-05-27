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


