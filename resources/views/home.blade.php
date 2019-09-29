@extends('layouts.app')

@section('content')
    <!-- Modal -->
    <div class="modal fade" id="hikeDialog" role="dialog">
        <div class="modal-dialog">

            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Name Your Hike</h4>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
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
                    <button id='addHikeSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
                </div>
            </div>

        </div>
    </div> <!--  Modal -->

	<div class="row no-gutters" style="height:100%">
        <div class="col-md-12" style="overflow-y:scroll;height:100%">
            <h4>Planned Hikes</h4>
            <table class="table table-condensed">
                <thead><tr><th>Name</th><th>Length</th><th>Duration</th><th>Start Date</th></tr></thead>
                <tbody>
                    <?php
                        $results = Auth::user()->hikes()->get ();

                        foreach ($results as $hike) {
                            echo "<tr id='userHike_", $hike->id, "'>\n";
                            echo "<td>\n";
                            echo "<a class='btn btn-sm' href='/hike/", $hike->id, "'><i class='fas fa-pencil-alt'></i></a>\n";
                            echo "<a class='btn btn-sm' href='javascript:deleteHike(", $hike->id, ")'><i class='fas fa-trash-alt'></i></a>\n";
                            echo "<a href=\"/hike/", $hike->id, "\">", $hike->name, "</a></td>\n";
                            echo "<td>", "</td>\n";
                            echo "<td>", "</td>\n";
                            echo "<td>", "None", "</td>\n";
                            echo "</tr>\n";
                         }
                    ?>
                    <tr id='userHikeLastRow'>
                    <td><a class='btn btn-sm' href='javascript:showHikeDialog()'><i class='fas fa-plus'></i></a></td>
                    <td/><td/><td/><td/>
                    </tr>

                </tbody>
            </table>
            <h4>Completed Hikes</h4>
            <table class="table table-condensed">
                <thead><tr><th>Name</th><th>Length</th><th>Duration</th><th>Start Date</th></tr></thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </div>

    <script>
    "use strict";

    function deleteHike (hikeId)
    {
        var xmlhttp = new XMLHttpRequest ();
        xmlhttp.onreadystatechange = function ()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                let hike = document.getElementById("userHike_" + hikeId);
                hike.parentElement.removeChild(hike);
            }
        }

        xmlhttp.open("DELETE", "hike/" + hikeId, true);
        xmlhttp.setRequestHeader("Content-type", "application/json");
    	xmlhttp.setRequestHeader("X-CSRF-TOKEN", $('meta[name="csrf-token"]').attr('content'));
        xmlhttp.send();
    }

    function insertHike ()
    {
        var hike = objectifyForm($("#userHikeForm").serializeArray());

        var xmlhttp = new XMLHttpRequest ();
        xmlhttp.onreadystatechange = function ()
        {
            if (this.readyState == 4 && (this.status >= 200 && this.status < 300))
            {
                hike = JSON.parse(this.responseText);

                document.location.href = "/hike/" + hike.id;
            }
        }

        xmlhttp.open("POST", "hike", true);
        xmlhttp.setRequestHeader("Content-type", "application/json");
    	xmlhttp.setRequestHeader("X-CSRF-TOKEN", $('meta[name="csrf-token"]').attr('content'));
        xmlhttp.send(JSON.stringify(hike.name));
    }

    function showHikeDialog ()
    {
        $("#addHikeSaveButton").off('click');
        $("#addHikeSaveButton").click(insertHike);

        $("#hikeDialog").modal ('show');
    }
    </script>
@endsection
