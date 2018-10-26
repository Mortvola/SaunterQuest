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
    <title>Create Food Item</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; text-align: center; }
    </style>
</head>
<body>
    <div class="page-header">
        <h1>Create Food Item</h1>
    </div>
    <form action="" method="post">
        <label>Name:</label>
        <input type="text" name="name" id="name" required="required"/>
    	<br/><br/>
        <label>Weight:</label>
        <input type="number" name="weight" id="weight" required="required"/>
    	<br/><br/>
        <label>Calories:</label>
        <input type="number" name="calories" id="calories" required="required"/>
    	<br/><br/>
        <label>Price:</label>
    	<input type="number" name="price" id="price" required="required" value="0" min="0" step="0.01" data-number-to-fixed="2" data-number-stepfactor="100"/>
    	<br/><br/>
        <input type="submit" value=" Submit " name="submit"/>
        <br/>
    </form>
    <?php
    if(isset($_POST["submit"])){
        // Include config file
        require_once "config.php";
        
        try {
            $sql = "INSERT INTO foodItem (creationDate, modificationDate, name, weight, calories, price)
            VALUES (now(), now(), '".$_POST["name"]."',".$_POST["weight"].",".$_POST["calories"].",".$_POST["price"].")";
            if ($pdo->query($sql)) {
                echo "<script type= 'text/javascript'>alert('New Record Inserted Successfully');</script>";
            }
            else{
                echo "<script type= 'text/javascript'>alert('Data not successfully Inserted.');</script>";
            }
            
            $pdo = null;
        }
        catch(PDOException $e)
        {
            echo $e->getMessage();
        }
    
    }
    ?>
</body>
</html>
