<?php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Add Food</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
</head>
<body>
    <div class="page-header" style="text-align:center;">
        <h1>Add Food</h1>
    </div>
    
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6">
	        <p>Name:</p>
        </div>
        <div class="col-md-6">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
        	<button type="button" class="btn" onclick="saveDayTemplate()">Save</button>
        	<button type="button" class="btn">Cancel</button>
            <table class="table table-bordered table-condensed">
                <thead>
    	            <th>Name</th><th>Weight</th><th>Calories</th><th>Price</th>
                </thead>
                <tbody id="templateItems">
            	</tbody>
            </table>
        </div>
        
        <div class="col-md-6">
            <table class="table table-bordered table-condensed">
                <thead>
    	            <th>Name</th><th>Weight</th><th>Calories</th><th>Price</th>
                </thead>
                <tbody id="itemsToAdd">
            	</tbody>
            </table>
        </div>
      </div>
    </div>

	<script>
		"use strict";
		var tableData;
		var templateRows = [];
		var templateRowsCounter = 0;
		var dayTemplateId = "<?php echo $_GET["id"] ?>";
		var deletedTemplateRows = [];
		
		function loadTable ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					tableData = JSON.parse(this.responseText);

					var txt = "";
					
					for (let x in tableData)
					{
						txt +=
//							"<tr><td>" + "<input type='button' onclick='addItem(" + x + ")' value='Add' />" + tableData[x].name
							"<tr><td>" + "<a class='btn btn-sm' onclick='addItem(tableData[" + x + "])'><span class='glyphicon glyphicon-plus-sign'></span></a>" + tableData[x].name
    						+ "</td><td>" + tableData[x].weight
    						+ "</td><td>" + tableData[x].calories
    						+ "</td><td>" + tableData[x].price
							+ "</td></tr>";
					}

					document.getElementById ("itemsToAdd").innerHTML = txt;
				}
			}
			
			xmlhttp.open("GET", "GetTable.php", true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}

		function loadDayTemplate ()
		{
			if (dayTemplateId != "")
			{
				var xmlhttp = new XMLHttpRequest ();
				xmlhttp.onreadystatechange = function ()
				{
					if (this.readyState == 4 && this.status == 200)
					{
	 					let data = JSON.parse(this.responseText);
	
	 					for (let x in data)
	 					{
	 	 					addItem(data[x]);
	 					}
	 				}
				}
	
				xmlhttp.open("GET", "GetDayTemplate.php?id=" + dayTemplateId, true);
				//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.send();
			}
		}

		function saveDayTemplate ()
		{
			let foodList = {addedItems: [], deletedItems: []};

			if (dayTemplateId != "")
			{
				foodList.dayTemplateId = dayTemplateId;
			}
			else
			{
				foodList.name = "Day 1";
			}
			
			// convert data to a JSON object
			for (let x in templateRows)
			{
				if (templateRows[x].dayTemplateFoodItemId == undefined)
				{
					let item = {foodItemId: templateRows[x].foodItemId};
					
					foodList.addedItems.push(item);
				}
			}

			for (let x in deletedTemplateRows)
			{
				foodList.deletedItems.push(deletedTemplateRows[x]);
			}
			
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
				}
			}
			
			// convert data to a JSON object
			let jsonData = JSON.stringify(foodList);
			
			xmlhttp.open("POST", "SaveDayTemplate.php", true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send("x=" + jsonData);
		}

		function addItem (data)
		{
			let row = document.createElement("TR");
			
			let span = document.createElement("SPAN");
			span.setAttribute("class", "glyphicon glyphicon-trash");
			
//			let removeButton = document.createElement("BUTTON");
			let removeButton = document.createElement("A");
//			removeButton.setAttribute("type", "button");
			removeButton.setAttribute("class", "btn btn-sm");
			removeButton.setAttribute("onclick", "removeItem(" + templateRowsCounter + ")");
			removeButton.appendChild(span);
			
			let td = document.createElement("TD");
			td.appendChild(removeButton);
			
			let txt = document.createTextNode(data.name);
			td.appendChild(txt);
			row.appendChild(td);

			td = document.createElement("TD");
			txt = document.createTextNode(data.weight);
			td.appendChild(txt);
			row.appendChild(td);
			
			td = document.createElement("TD");
			txt = document.createTextNode(data.calories);
			td.appendChild(txt);
			row.appendChild(td);

			td = document.createElement("TD");
			txt = document.createTextNode(data.price);
			td.appendChild(txt);
			row.appendChild(td);
			
			// Get the added items table and append new row
			let templateItems = document.getElementById("templateItems");
			templateItems.appendChild(row);

			templateRows.push({id: templateRowsCounter, tableRow: row, foodItemId: data.foodItemId, dayTemplateFoodItemId: data.dayTemplateFoodItemId});
			templateRowsCounter++;
		}

		function removeItem(templateRowId)
		{
			for (let x in templateRows)
			{
				if (templateRows[x].id == templateRowId)
				{
 					let templateItems = document.getElementById("templateItems");
 					templateItems.removeChild(templateRows[x].tableRow);

					if (templateRows[x].dayTemplateFoodItemId != undefined)
					{
						deletedTemplateRows.push(templateRows[x].dayTemplateFoodItemId);
					}
					
					templateRows.splice(x, 1);

					break;
				}
			}
		}

		loadTable ();
		loadDayTemplate ();
		
	</script>    
</body>
</html>
