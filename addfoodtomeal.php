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
                <?php
                    // Include config file
                    require_once "config.php";
                    
                    try {
                        $result = $pdo->query("select footItemId, name, weight, calories, price from foodItem");
                        foreach($result as $row) {
                            echo "<tr>";
                            echo "<td value='", $row['footItemId'], "'><input type=checkbox />", $row['name'], "</td>";
                            echo "<td>", $row['weight'], "</td>";
                            echo "<td>", $row['calories'], "</td>";
                            echo "<td>", $row['price'], "</td>";
                            echo "</tr>\n";
                        }
                    }
                    catch(PDOException $e)
                    {
                        echo $e->getMessage();
                    }
                    
                    $pdo = null;
                ?>
            	</tbody>
            </table>
		
		    <input type="button" value="Add Items" onclick="addItems()"/>
		    
        </div>
        
        <div class="col-md-6">
            <table class="table table-bordered" style="text-align:left;">
                <thead>
    	            <th>Name</th><th>Weight</th><th>Calories</th><th>Price</th>
                </thead>
                <tbody id="addedItems">
            	</tbody>
            </table>

		    <input type="button" value="Remove Items" onclick="removeItems()"/>
		    
        </div>
      </div>
    </div>

    <form method="post">
    <input type="hidden" value="" />
    <input type="submit" value="Finish"/>
	</form>
	
	<script>
		function addItems() {
			// Get last row of table of added items
			let addedItems = document.getElementById("addedItems");

			let itemsToAdd = document.getElementById("itemsToAdd");

			let rows = itemsToAdd.getElementsByTagName ("TR");
			let count = rows.length;
			
			for (let i = 0; i < count; i++)
			{
				row = document.createElement("TR");

				// This should be the cell with the checkbox. Get the value.
				let cell = rows[i].firstElementChild;
				let id = cell.getAttribute("value");
				let name = cell.innerHTML;
				
//				for (let j = 0; j < columns.count; j++)
				{
    				td = document.createElement("TD");
    				txt = document.createTextNode(name + id);
    
    				td.appendChild(txt);
    				row.appendChild(td);
				}
				
				addedItems.appendChild(row);
			}
		}
		
		function removeItems() {
			
		}
	</script>    
</body>
</html>
