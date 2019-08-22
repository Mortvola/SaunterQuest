<?php

require_once "checkLogin.php";

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="/bootstrap.min.js"></script>
    <style type="text/css">
        body{ font: 14px sans-serif; }
    </style>
</head>
<body>
    <!-- Modal -->
    <div class="modal fade" id="addUserHike" role="dialog">
        <div class="modal-dialog">

            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title">Name Your Hike</h4>
                </div>
                <div class="modal-body">
                    <form id='userHikeForm'>
                        <label>Name:</label>
                        <input type="text" class='form-control' name='name'/>
                    <br/>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                    <button id='addUserHikeSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
                </div>
            </div>

        </div>
    </div> <!--  Modal -->

    <div class="page-header" style=" text-align: center;">
        <h1>Backpacker's Planner</h1>
    </div>
    <p  style="text-align: center;">
        <a href="reset-password.php" class="btn btn-warning">Reset Your Password</a>
        <a href="logout.php" class="btn btn-danger">Sign Out of Your Account</a>
    </p>
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <ul class="nav navbar-nav">
                <li class="nav-item active"><a class="nav-link">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Daily View</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Segment View</a></li>
                <li class="nav-item"><a class="nav-link" href="/DayTemplates.php">Daily Meal Plans</a></li>
            </ul>
        </div>
    </nav>
    <div>
        <div class="container-fluid">
            <?php
                // Include config file
                require_once "config.php";
            ?>
            <div class="col-md-4">
            <h4>Available Hikes</h4>
            <table class="table table-condensed">
            <thead><tr><th>Name</th><th>Length</th></tr></thead>
            <tbody>
            <?php
                $sql = "select name, hikeId
					from hike";

            if ($stmt = $pdo->prepare($sql)) {
                $stmt->execute();

                $output = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($output as $hike) {
                    echo "<tr>";
                    echo "<td>", "<a href='/editHike.php?orig=", $hike["hikeId"], "'>", $hike["name"], "</a></td>";
                    echo "<td>", "</td>";
                    echo "</tr>";
                }

                unset($stmt);
            }
            ?>
            </tbody>
            </table>
            </div>
            <div class="col-md-1">
            </div>
            <div class="col-md-7">
            <h4>Your Hikes</h4>
            <table class="table table-condensed">
            <thead><tr><th>Name</th><th>Length</th><th>Duration</th><th>Start Date</th></tr></thead>
            <tbody>
                <?php
                    $sql = "select name, userHikeId
						from userHike
						where userId = :userId";

                if ($stmt = $pdo->prepare($sql)) {
                    $stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
                    $paramUserId = $_SESSION["userId"];

                    $stmt->execute();

                    $output = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($output as $hike) {
                        echo "<tr id='userHike_", $hike["userHikeId"], "'>";
                        echo "<td>";
                        echo "<a class='btn btn-sm' href='/editHike.php?id=", $hike["userHikeId"], "'><span class='glyphicon glyphicon-pencil'></span></a>";
                        echo "<a class='btn btn-sm' onclick='deleteHike(", $hike["userHikeId"], ")'><span class='glyphicon glyphicon-trash'></span></a>";
                        echo "<a href='/editHike.php?id=", $hike["userHikeId"], "'>", $hike["name"], "</a></td>";
                        echo "<td>", "</td>";
                        echo "<td>", "</td>";
                        echo "<td>", "None", "</td>";
                        echo "</tr>";
                    }

                    unset($stmt);
                }
                ?>
                <tr id='userHikeLastRow'>
                <td><a class='btn btn-sm' onclick='addUserHike()'><span class='glyphicon glyphicon-plus'></span></a></td>
                <td/><td/><td/><td/>
                </tr>

            </tbody>
            </table>
            </div>
        </div>
    </div>
    <script src="/utilities.js"></script>
    <script>
    "use strict";

    function deleteHike (userHikeId)
    {
        var xmlhttp = new XMLHttpRequest ();
        xmlhttp.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                let userHike = document.getElementById("userHike_" + userHikeId);
                userHike.parentElement.removeChild(userHike);
            }
        }

        var userHike = {}

        userHike.userHikeId = userHikeId;

        xmlhttp.open("DELETE", "userHike.php", true);
        xmlhttp.setRequestHeader("Content-type", "application/json");
        xmlhttp.send(JSON.stringify(userHike));
    }

    function insertUserHike ()
    {
        var userHike = objectifyForm($("#userHikeForm").serializeArray());

        var xmlhttp = new XMLHttpRequest ();
        xmlhttp.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                userHike = JSON.parse(this.responseText);

                document.location.href = "/editHike.php?id=" + userHike.userHikeId;
            }
        }

        xmlhttp.open("POST", "userHike.php", true);
        xmlhttp.setRequestHeader("Content-type", "application/json");
        xmlhttp.send(JSON.stringify(userHike));
    }

    function addUserHike ()
    {
        $("#addUserHikeSaveButton").off('click');
        $("#addUserHikeSaveButton").click(insertUserHike);

        $("#addUserHike").modal ('show');
    }
    </script>
</body>
</html>
