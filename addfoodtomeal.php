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
            <table class="table table-bordered" style="text-align:left;">
                <thead>
    	            <th>Name</th><th>Weight</th><th>Calories</th><th>Price</th>
                </thead>
                <tbody id="itemsToAdd">
            	</tbody>
            </table>
        </div>
        
        <div class="col-md-6">
            <table class="table table-bordered" style="text-align:left;">
                <thead>
    	            <th>Name</th><th>Weight</th><th>Calories</th><th>Price</th>
                </thead>
                <tbody id="addedItems">
            	</tbody>
            </table>
        </div>
      </div>
    </div>

    <form method="post">
    <input type="hidden" value="" />
    <input type="submit" value="Finish"/>
	</form>
	
	<script>
		"use strict";
		var tableData;
		var addedData = [];
		var addedCounter = 0;
		
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
							"<tr><td>" + "<button type='button' class='btn' onclick='addItem(" + x + ")'><span class='glyphicon glyphicon-plus-sign'></span></button>" + tableData[x].name
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

		function addItem (index)
		{
			let row = document.createElement("TR");
			
			let span = document.createElement("SPAN");
			span.setAttribute("class", "glyphicon glyphicon-minus-sign");
			
			let removeButton = document.createElement("BUTTON");
			removeButton.setAttribute("type", "button");
			removeButton.setAttribute("class", "btn");
			removeButton.setAttribute("onclick", "removeItem(" + addedCounter + ")");
			removeButton.appendChild(span);
			
			let td = document.createElement("TD");
			td.appendChild(removeButton);
			
			let txt = document.createTextNode(tableData[index].name);
			td.appendChild(txt);
			row.appendChild(td);

			td = document.createElement("TD");
			txt = document.createTextNode(tableData[index].weight);
			td.appendChild(txt);
			row.appendChild(td);
			
			td = document.createElement("TD");
			txt = document.createTextNode(tableData[index].calories);
			td.appendChild(txt);
			row.appendChild(td);

			td = document.createElement("TD");
			txt = document.createTextNode(tableData[index].price);
			td.appendChild(txt);
			row.appendChild(td);
			
			// Get the added items table and append new row
			let addedItems = document.getElementById("addedItems");
			addedItems.appendChild(row);

			addedData.push({id: addedCounter, tableRow: row, foodItemId: tableData[index].footItemId});
			addedCounter++;
		}

		function removeItem(addedId)
		{
			for (let x in addedData)
			{
				if (addedData[x].id == addedId)
				{
 					let addedItems = document.getElementById("addedItems");
 					addedItems.removeChild(addedData[x].tableRow);

					addedData.splice(x, 1);
					
					break;
				}
			}
		}

		loadTable ();
		
	</script>    
</body>
</html>
