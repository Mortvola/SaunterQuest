<?php

require_once "checkLogin.php";

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Add Food</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="/bootstrap.min.js"></script>
    <style>
        .meal-plan-divider { background-color:CornflowerBlue; }
    </style>
</head>
<body>
    <?php require_once "foodItemDialog.php"; ?>

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
                    <th colspan="3" class="meal-plan-divider">Morning</th>
                    <th class="meal-plan-divider" id="mealPlanTimeCalories0" style="text-align:right"></th>
                    <th class="meal-plan-divider" id="mealPlanTimeWeight0" style="text-align:right"></th>
                </thead>
                <thead>
                    <th>Name</th><th>Serving Size</th><th>Number of Servings</th><th>Calories</th><th>Weight</th>
                </thead>
                <tbody id="mealPlanTime0">
                </tbody>
            </table>
            <table class="table table-bordered table-condensed">
                <thead>
                    <th colspan="3" class="meal-plan-divider">Afternoon</th>
                    <th class="meal-plan-divider" id="mealPlanTimeCalories1" style="text-align:right"></th>
                    <th class="meal-plan-divider" id="mealPlanTimeWeight1" style="text-align:right"></th>
                </thead>
                <thead>
                    <th>Name</th><th>Serving Size</th><th>Number of Servings</th><th>Calories</th><th>Weight</th>
                </thead>
                <tbody id="mealPlanTime1">
                </tbody>
            </table>
            <table class="table table-bordered table-condensed">
                <thead>
                    <th colspan="3" class="meal-plan-divider">Evening</th>
                    <th class="meal-plan-divider" id="mealPlanTimeCalories2" style="text-align:right"></th>
                    <th class="meal-plan-divider" id="mealPlanTimeWeight2" style="text-align:right"></th>
                </thead>
                <thead>
                    <th>Name</th><th>Serving Size</th><th>Number of Servings</th><th>Calories</th><th>Weight</th>
                </thead>
                <tbody id="mealPlanTime2">
                </tbody>
            </table>
        </div>

        <div class="col-md-6">
            <div>
                <a class='btn btn-sm' onclick='addFoodItem()'><i class='fas fa-plus'></i>Add Food Item</a>
            </div>
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

                        foodItem.foodItemServingSizeId = -1;
                        foodItem.numberOfServings = 1;

                        txt +=
                            "<tr>"

                            // Name column
                            + "<td>"
                            + "<div class='btn-group'>"
                            +   "<button type='button' class='btn btn-sm dropdown-toggle' data-toggle='dropdown'>"
                            +       "<span class='caret'></span>"
                            +   "</button>"
                            +   "<ul class='dropdown-menu'>"
                            +       "<li><a onclick='addItem(tableData.foodItems[" + x + "],0)'>Add to morning</a></li>"
                            +       "<li><a onclick='addItem(tableData.foodItems[" + x + "],1)'>Add to afternoon</a></li>"
                            +       "<li><a onclick='addItem(tableData.foodItems[" + x + "],2)'>Add to evening</a></li>"
                            +       "<li><a onclick='editFoodItem(tableData.foodItems[" + x + "])'>Edit item</a></li>"
                            +   "</ul>"
                            + "</div>"
                            + fullName(foodItem)
                            + "</td>"

                            + "<td style='padding:0px;vertical-align:middle'>";

                            // Serving Size column
                            txt += "<select class='form-control' onchange='servingSizeChanged(\"query_\", value,tableData.foodItems[" + x + "])'>";

                            txt += "<option value='-1'>" + foodItem.servingSizeDescription + " (" + foodItem.gramsServingSize + "g)" + "</option>";

                            let servingDescriptions = foodItem.servingDescriptions;

                            for (let l in servingDescriptions)
                            {
                                txt += "<option value='" + servingDescriptions[l].foodItemServingSizeId + "'>" + servingDescriptions[l].description + " (" + servingDescriptions[l].grams + "g)" + "</option>";
                            }

                            txt += "</select>";

                            // Number of servings column
                            txt += "</td>"
                            + "<td style='padding:0px;vertical-align:middle'>" + "<input type='number' class='form-control' min='0.1' step='0.1' value='" + foodItem.numberOfServings
                            + "' onchange='numberOfServingsChanged(\"query_\", value,tableData.foodItems[" + x + "])'/>" + "</td>"

                            // Calories column
                            + "<td style='text-align:right' id='query_calories_" + foodItem.foodItemId + "'>" + computeCalories(foodItem) + "</td>"

                            // Weight column
                            + "<td style='text-align:right' id='query_weight_" + foodItem.foodItemId + "'>" + computeWeight(foodItem) + "</td>"
                            //+ "</td><td>" + tableData.foodItems[x].price
                            + "</tr>";
                    }

                    document.getElementById ("itemsToAdd").innerHTML = txt;
                }
            }

            xmlhttp.open("GET", "foodItem.php", true);
            //xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send();
        }

        function getServingSizeDescriptionById (servingDescriptions, servingSizeId)
        {
            for (let y in servingDescriptions)
            {
                if (servingDescriptions[y].foodItemServingSizeId == servingSizeId)
                {
                    return servingDescriptions[y];
                }
            }
        }

        function computeCalories (foodItem)
        {
            if (foodItem.foodItemServingSizeId == -1)
            {
                return Math.round(foodItem.numberOfServings * foodItem.calories);
            }
            else
            {
                var servingSizeDescription = getServingSizeDescriptionById (foodItem.servingDescriptions, foodItem.foodItemServingSizeId);

                if (servingSizeDescription != undefined)
                {
                    return Math.round((servingSizeDescription.grams / foodItem.gramsServingSize) * foodItem.numberOfServings * foodItem.calories);
                }
            }
        }

        function computeWeight (foodItem)
        {
            if (foodItem.foodItemServingSizeId == -1)
            {
                return Math.round(foodItem.gramsServingSize * foodItem.numberOfServings);
            }
            else
            {
                var servingSizeDescription = getServingSizeDescriptionById (foodItem.servingDescriptions, foodItem.foodItemServingSizeId);

                if (servingSizeDescription != undefined)
                {
                    return Math.round(servingSizeDescription.grams * foodItem.numberOfServings);
                }
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
                return foodItem.manufacturer + ": " + foodItem.name;
            }
        }

        function computeCaloriesAndWeight (prefix, foodItem)
        {
            let calories = computeCalories(foodItem);
            let weight = computeWeight(foodItem);

            document.getElementById(prefix + "calories_" + foodItem.foodItemId).innerHTML = calories;
            document.getElementById(prefix + "weight_" + foodItem.foodItemId).innerHTML = weight;

            if (prefix == "plan_")
            {
                computeCaloriesAndWeightTotals(foodItem.mealTimeId);
            }
        }

        function servingSizeChanged (prefix, foodItemServingSizeId, foodItem)
        {
            foodItem.foodItemServingSizeId = foodItemServingSizeId;
            foodItem.modified = true;

            computeCaloriesAndWeight (prefix, foodItem);
        }

        function numberOfServingsChanged (prefix, numberOfServings, foodItem)
        {
            foodItem.numberOfServings = numberOfServings;
            foodItem.modified = true;

            computeCaloriesAndWeight (prefix, foodItem);
        }

        function computeCaloriesAndWeightTotals(mealTimeId)
        {
            let calories = 0;
            let weight = 0;

            for (let x in mealPlan)
            {
                if (mealPlan[x].mealTimeId == mealTimeId)
                {
                    calories += computeCalories(mealPlan[x]);
                    weight += computeWeight(mealPlan[x]);
                }
            }

            document.getElementById("mealPlanTimeCalories" + mealTimeId).innerHTML = calories;
            document.getElementById("mealPlanTimeWeight" + mealTimeId).innerHTML = weight;
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
                            addItem(data[x], data[x].mealTimeId);
                        }

                        computeCaloriesAndWeightTotals (0);
                        computeCaloriesAndWeightTotals (1);
                        computeCaloriesAndWeightTotals (2);
                    }
                }

                xmlhttp.open("GET", "mealPlan.php?id=" + mealPlanId, true);
                //xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xmlhttp.send();
            }
        }

        function saveMealPlan ()
        {
            let foodList = {addedItems: [], deletedItems: [], modifiedItems: []};

            if (mealPlanId != "")
            {
                foodList.dayTemplateId = mealPlanId;
            }
            else
            {
//              foodList.name = "Day 1";
            }

            // convert data to a JSON object
            for (let x in mealPlan)
            {
                if (mealPlan[x].dayTemplateFoodItemId == undefined)
                {
                    let item =
                    {
                        mealTimeId: mealPlan[x].mealTimeId,
                        foodItemId: mealPlan[x].foodItemId,
                        foodItemServingSizeId: mealPlan[x].foodItemServingSizeId,
                        numberOfServings: mealPlan[x].numberOfServings
                    };

                    foodList.addedItems.push(item);
                }
                else if (mealPlan[x].modified == true)
                {
                    let item =
                    {
                        dayTemplateFoodItemId: mealPlan[x].dayTemplateFoodItemId,
                        foodItemServingSizeId: mealPlan[x].foodItemServingSizeId,
                        numberOfServings: mealPlan[x].numberOfServings
                    };

                    foodList.modifiedItems.push(item);
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

            xmlhttp.open("POST", "mealPlan.php", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send("x=" + jsonData);
        }

        function addItem (foodItem, mealTimeId)
        {
            let row = document.createElement("TR");

            let span = document.createElement("SPAN");
            span.setAttribute("class", "fas fa-trash-alt");

            let removeButton = document.createElement("A");
            removeButton.setAttribute("class", "btn btn-sm");
            removeButton.setAttribute("onclick", "removeItem(" + nextMealPlanEntryId + "," + mealTimeId + ")");
            removeButton.appendChild(span);

            let td = document.createElement("TD");
            td.appendChild(removeButton);

            let txt = document.createTextNode(fullName(foodItem));
            td.appendChild(txt);
            row.appendChild(td);

            // Create serving size select
            let select = document.createElement("SELECT");
            select.setAttribute("class", "form-control");
            select.setAttribute("onchange", "servingSizeChanged(\"plan_\", value,mealPlan[" + nextMealPlanEntryId + "])");

            let option = document.createElement("OPTION");
            option.setAttribute("value", -1);
            txt = document.createTextNode(foodItem.servingSizeDescription + " (" + foodItem.gramsServingSize + "g)");
            option.appendChild(txt);
            select.appendChild(option);

            for (let l in foodItem.servingDescriptions)
            {
                option = document.createElement("OPTION");
                option.setAttribute("value", foodItem.servingDescriptions[l].foodItemServingSizeId);

                let txt = document.createTextNode(foodItem.servingDescriptions[l].description + " (" + foodItem.servingDescriptions[l].grams + "g)");
                option.appendChild(txt);

                select.appendChild(option);
            }
            select.value = foodItem.foodItemServingSizeId;

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
            td.setAttribute("style", "text-align:right");
            txt = document.createTextNode(computeCalories(foodItem));
            td.appendChild(txt);
            row.appendChild(td);

            // Create weight
            td = document.createElement("TD");
            td.setAttribute("id", "plan_weight_" + foodItem.foodItemId);
            td.setAttribute("style", "text-align:right");
            txt = document.createTextNode(computeWeight(foodItem));
            td.appendChild(txt);
            row.appendChild(td);

            // Get the added items table and append new row
            let templateItems = document.getElementById("mealPlanTime" + mealTimeId);
            templateItems.appendChild(row);

            mealPlan[nextMealPlanEntryId] =
            {
                id: nextMealPlanEntryId,
                tableRow: row,
                mealTimeId: mealTimeId,
                foodItemId: foodItem.foodItemId,
                calories: foodItem.calories,
                gramsServingSize: foodItem.gramsServingSize,
                foodItemServingSizeId: foodItem.foodItemServingSizeId,
                servingDescriptions: foodItem.servingDescriptions,
                numberOfServings: foodItem.numberOfServings,
                dayTemplateFoodItemId: foodItem.dayTemplateFoodItemId
            };
            nextMealPlanEntryId++;

            computeCaloriesAndWeightTotals (mealTimeId);
        }

        function removeItem(mealPlanEntryId, mealTimeId)
        {
            let templateItems = document.getElementById("mealPlanTime" + mealTimeId);
            templateItems.removeChild(mealPlan[mealPlanEntryId].tableRow);

            if (mealPlan[mealPlanEntryId].dayTemplateFoodItemId != undefined)
            {
                deletedMealPlanRows.push(mealPlan[mealPlanEntryId].dayTemplateFoodItemId);
            }

            delete mealPlan[mealPlanEntryId];

            computeCaloriesAndWeightTotals (mealTimeId);
        }

        loadTable ();
        loadMealPlan ();

        function updateFoodItem (foodItemId)
        {
            var foodItem = unloadFoodItemDialog ();

            foodItem.foodItemId = foodItemId;

            var xmlhttp = new XMLHttpRequest ();
            xmlhttp.onreadystatechange = function ()
            {
                if (this.readyState == 4 && this.status == 200)
                {
                }
            }

            xmlhttp.open("PUT", "foodItem.php", true);
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.send(JSON.stringify(foodItem));
        }

        function insertFoodItem ()
        {
            var foodItem = unloadFoodItemDialog ();

            var xmlhttp = new XMLHttpRequest ();
            xmlhttp.onreadystatechange = function ()
            {
                if (this.readyState == 4 && this.status == 200)
                {
                }
            }

            xmlhttp.open("POST", "foodItem.php", true);
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.send(JSON.stringify(foodItem));
        }

        function editFoodItem (foodItem)
        {
            loadFoodItemDialog (foodItem);

            $("#foodItemSaveButton").off('click');
            $("#foodItemSaveButton").click(function () { updateFoodItem(foodItem.foodItemId)});

            $("#addFoodItem").modal ('show');
        }

        function addFoodItem ()
        {
            clearFoodItemDialog ();

            $("#foodItemSaveButton").off('click');
            $("#foodItemSaveButton").click(function () { insertFoodItem()});

            $("#addFoodItem").modal ('show');
        }

    </script>
</body>
</html>
