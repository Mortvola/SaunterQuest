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
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; text-align: center; }
    </style>
</head>
<body>
    <div class="page-header">
        <h1>Add Food</h1>
    </div>
    <table>
    <?php
    class TableRows extends RecursiveIteratorIterator {
        function __construct($it) {
            parent::__construct($it, self::LEAVES_ONLY);
        }
        
        function current() {
            return "<td>".parent::current()."</td>";
        }
        
        function beginChildren() {
            echo "<tr><td><input type=checkbox></td>";
        }
        
        function endChildren() {
            echo "</tr>" . "\n";
        }
    } 
    
    // Include config file
    require_once "config.php";
    
    try {
        $stmt = $pdo->prepare("select name, weight, calories, price from foodItem");
        $stmt->execute ();

        // set the resulting array to associative
        $result = $stmt->setFetchMode(PDO::FETCH_ASSOC);
       
        foreach(new TableRows(new RecursiveArrayIterator($stmt->fetchAll())) as $k=>$v) {
            echo $v;
        }
        
        $pdo = null;
    }
    catch(PDOException $e)
    {
        echo $e->getMessage();
    }
    ?>
    </table>
</body>
</html>
