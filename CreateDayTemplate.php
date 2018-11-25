<?php

require_once "checkLogin.php";

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; text-align: center; }
    </style>
</head>
<body>
    <table>
	    <thead>
	    	<tr>
	    		<th>Morning</th>
	    	</tr>
	    </thead>
	    <tbody>
	    	<tr>
	    		<td><a href=/addfoodtomeal.php?meal=0>Add Food</a></td>
	    	</tr>
	    </tbody>
    </table>
    <table>
	    <thead>
	    	<tr>
	    		<th>Afternoon</th>
	    	</tr>
	    </thead>
	    <tbody>
	    	<tr>
	    		<td><a href=/addfoodtomeal?meal=1>Add Food</a></td>
	    	</tr>
	    </tbody>
    </table>
    <table>
	    <thead>
	    	<tr>
	    		<th>Evening</th>
	    	</tr>
	    </thead>
	    <tbody>
	    	<tr>
	    		<td><a href=/addfoodtomeal?meal=2>Add Food</a></td>
	    	</tr>
	    </tbody>
    </table>
</body>
</html>