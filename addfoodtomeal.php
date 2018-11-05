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
        	<button type="button" class="btn" onclick="saveMealPlan()">Save</button>
        	<button type="button" class="btn">Cancel</button>
            <table class="table table-bordered table-condensed">
                <thead>
    	            <th>Name</th><th>Serving Size</th><th>Number of Servings</th><th>Calories</th><th>Weight</th>
                </thead>
                <tbody id="templateItems">
            	</tbody>
            </table>
        </div>
        
        <div class="col-md-6">
            <table class="table table-bordered table-condensed">
                <thead>
    	            <th>Name</th><th>Serving Size</th><th>Number of Servings</th><th>Calories</th><th>Weight</th>
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
		var mealPlan = {};
		var nextMealPlanEntryId = 0;
		var mealPlanId = "<?php echo $_GET["id"] ?>";
		var deletedMealPlanRows = [];
		
		function loadTable ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
					tableData = JSON.parse(this.responseText);

					var txt = "";
					
					for (let x in tableData.foodItems)
					{
						let foodItem = tableData.foodItems[x];

						foodItem.servingSizeIndex = 0;
						foodItem.numberOfServings = 1;
						
						txt +=
//							"<tr><td>" + "<input type='button' onclick='addItem(" + x + ")' value='Add' />" + tableData[x].name
							"<tr>"
							+ "<td>" + "<a class='btn btn-sm' onclick='addItem(tableData.foodItems[" + x + "])'><span class='glyphicon glyphicon-plus-sign'></span></a>"
							+ fullName(foodItem) + "</td>"
							+ "<td style='padding:0px;vertical-align:middle'>";

							txt += "<select class='form-control' onchange='servingSizeChanged(\"query_\", value,tableData.foodItems[" + x + "])'>";

							let lookup = foodItem.lookup;
							
							for (let l in lookup)
							{
								txt += "<option value='" + l + "'>" + lookup[l].description + " (" + lookup[l].grams + "g)" + "</option>";
 							}
							
							txt += "</select>";
							
							txt += "</td>"
							+ "<td style='padding:0px;vertical-align:middle'>" + "<input type='number' class='form-control' min='0.1' step='0.1' value='" + foodItem.numberOfServings
							+ "' onchange='numberOfServingsChanged(\"query_\", value,tableData.foodItems[" + x + "])'/>" + "</td>"
    						+ "<td id='query_calories_" + foodItem.foodItemId + "'>" + computeCalories(foodItem) + "</td>"
	    					+ "<td id='query_weight_" + foodItem.foodItemId + "'>" + computeWeight(foodItem) + "</td>"
    						//+ "</td><td>" + tableData.foodItems[x].price
							+ "</tr>";
					}
					
					document.getElementById ("itemsToAdd").innerHTML = txt;
				}
			}
			
			xmlhttp.open("GET", "GetTable.php", true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}

		function computeCalories (foodItem)
		{
			if (foodItem.lookup.length == 0)
			{
				return 0;
			}
			else
			{
				return (foodItem.lookup[foodItem.servingSizeIndex].grams / foodItem.gramsServingSize) * foodItem.numberOfServings * foodItem.calories;
			}
		}

		function computeWeight (foodItem)
		{
			if (foodItem.lookup.length == 0)
			{
				return 0;
			}
			else
			{
				return foodItem.lookup[foodItem.servingSizeIndex].grams * foodItem.numberOfServings;
			}
		}

		function fullName (foodItem)
		{
			if (foodItem.manufacturer == undefined || foodItem.manufacturer == null || foodItem.manufacturer == "")
			{
					return foodItem.name;
			}
			else
			{
				return foodItem.manufacturer + ":" + foodItem.name;
			}
		}
		
		function computeCaloriesAndWeight (prefix, foodItem)
		{
			let calories = computeCalories(foodItem);
			let weight = computeWeight(foodItem);
			
			document.getElementById(prefix + "calories_" + foodItem.foodItemId).innerHTML = calories;
			document.getElementById(prefix + "weight_" + foodItem.foodItemId).innerHTML = weight;
		}
		
		function servingSizeChanged (prefix, servingSizeIndex, foodItem)
		{
			foodItem.servingSizeIndex = servingSizeIndex;

			computeCaloriesAndWeight (prefix, foodItem);
		}

		function numberOfServingsChanged (prefix, numberOfServings, foodItem)
		{
			foodItem.numberOfServings = numberOfServings;

			computeCaloriesAndWeight (prefix, foodItem);
		}

		function loadMealPlan ()
		{
			if (mealPlanId != "")
			{
				var xmlhttp = new XMLHttpRequest ();
				xmlhttp.onreadystatechange = function ()
				{
					if (this.readyState == 4 && this.status == 200)
					{
	 					let data = JSON.parse(this.responseText);
	
	 					for (let x in data)
	 					{
		 					data[x].servingSizeIndex = 0;
		 					
	 	 					addItem(data[x]);
	 					}
	 				}
				}
	
				xmlhttp.open("GET", "GetDayTemplate.php?id=" + mealPlanId, true);
				//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.send();
			}
		}

		function saveMealPlan ()
		{
			let foodList = {addedItems: [], deletedItems: []};

			if (mealPlanId != "")
			{
				foodList.dayTemplateId = mealPlanId;
			}
			else
			{
//				foodList.name = "Day 1";
			}
			
			// convert data to a JSON object
			for (let x in mealPlan)
			{
				if (mealPlan[x].dayTemplateFoodItemId == undefined)
				{
					let item =
					{
						foodItemId: mealPlan[x].foodItemId,
						foodItemServingSizeId: mealPlan[x].lookup[mealPlan[x].servingSizeIndex].foodItemServingSizeId,
						numberOfServings: mealPlan[x].numberOfServings
					};
					
					foodList.addedItems.push(item);
				}
			}

			for (let x in deletedMealPlanRows)
			{
				foodList.deletedItems.push(deletedMealPlanRows[x]);
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

		function addItem (foodItem)
		{
			let row = document.createElement("TR");
			
			let span = document.createElement("SPAN");
			span.setAttribute("class", "glyphicon glyphicon-trash");
			
			let removeButton = document.createElement("A");
			removeButton.setAttribute("class", "btn btn-sm");
			removeButton.setAttribute("onclick", "removeItem(" + nextMealPlanEntryId + ")");
			removeButton.appendChild(span);
			
			let td = document.createElement("TD");
			td.appendChild(removeButton);
			
			let txt = document.createTextNode(fullName(foodItem));
			td.appendChild(txt);
			row.appendChild(td);

			// Create serviing size select
			let select = document.createElement("SELECT");
			select.setAttribute("class", "form-control");
			select.setAttribute("onchange", "servingSizeChanged(\"plan_\", value,mealPlan[" + nextMealPlanEntryId + "])");

			for (let l in foodItem.lookup)
			{
				let option = document.createElement("OPTION");
				option.setAttribute("value", l);

				let txt = document.createTextNode(foodItem.lookup[l].description + " (" + foodItem.lookup[l].grams + "g)");
				option.appendChild(txt);

				select.appendChild(option);
			}
			
			td = document.createElement("TD");
			td.setAttribute("style", "padding:0px;vertical-align:middle");
			td.appendChild(select);
			row.appendChild(td);

			// Create number of servings text input
			let edit = document.createElement("INPUT");
			edit.setAttribute("type", "number");
			edit.setAttribute("class", "form-control");
			edit.setAttribute("min", "0.1");
			edit.setAttribute("step", "0.1");
			edit.setAttribute("value", foodItem.numberOfServings);
			edit.setAttribute("onchange", "numberOfServingsChanged(\"plan_\", value,mealPlan[" + nextMealPlanEntryId + "])");
			td = document.createElement("TD");
			td.setAttribute("style", "padding:0px;vertical-align:middle");
			td.appendChild(edit);
			row.appendChild(td);
			
			// Create calories
			td = document.createElement("TD");
			td.setAttribute("id", "plan_calories_" + foodItem.foodItemId);
			txt = document.createTextNode(computeCalories(foodItem));
			td.appendChild(txt);
			row.appendChild(td);

			// Create weight
			td = document.createElement("TD");
			td.setAttribute("id", "plan_weight_" + foodItem.foodItemId);
			txt = document.createTextNode(computeWeight(foodItem));
			td.appendChild(txt);
			row.appendChild(td);
			
			// Get the added items table and append new row
			let templateItems = document.getElementById("templateItems");
			templateItems.appendChild(row);

			mealPlan[nextMealPlanEntryId] =
			{
				id: nextMealPlanEntryId,
				tableRow: row,
				foodItemId: foodItem.foodItemId,
				calories: foodItem.calories,
				gramsServingSize: foodItem.gramsServingSize,
				lookup: foodItem.lookup,
				servingSizeIndex: foodItem.servingSizeIndex,
				numberOfServings: foodItem.numberOfServings,
				dayTemplateFoodItemId: foodItem.dayTemplateFoodItemId
			};
			nextMealPlanEntryId++;
		}

		function removeItem(mealPlanEntryId)
		{
			let templateItems = document.getElementById("templateItems");
			templateItems.removeChild(mealPlan[mealPlanEntryId].tableRow);

			if (mealPlan[mealPlanEntryId].dayTemplateFoodItemId != undefined)
			{
				deletedMealPlanRows.push(mealPlan[mealPlanEntryId].dayTemplateFoodItemId);
			}

			delete mealPlan[mealPlanEntryId];
		}

		loadTable ();
		loadMealPlan ();
		
	</script>    
</body>
</html>
