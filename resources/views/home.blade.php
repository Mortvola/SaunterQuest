@extends('layouts.app')

<style>
            body {
                background-color: black;
                background-image: url({{ asset ('Forester.jpg') }});
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-position: center;
                background-size: cover;
            }
</style>

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
            <h4>Planned Saunters</h4>
            <div id='userHikeLastRow' style='display:inline'>
            <div><a class='btn btn-sm' href='javascript:showHikeDialog()'><i class='fas fa-plus'></i></a></div>
            </div>
            <div class='d-flex flex-column flex-sm-row' style='overflow: auto; padding-left: 14px; padding-right: 14px'>
                    <?php
                        $results = Auth::user()->hikes()->get ();

                        foreach ($results as $hike)
                        {
                            $days = $hike->getDuration ();
                            $distance = metersToMilesRounded($hike->getDistance ());

                            echo "<div class='card bpp-shadow mr-4 mb-4 flex-shrink-0 flex-grow-0' style='width:250px' id='userHike_", $hike->id, "'>\n";
                            echo "<div class='card-header'>";
                            echo "<div class='edit-hike-name' data-url='hike/", $hike->id, "' data-prop='name'>", $hike->name, "</div>";
                            echo "</div>";
                            echo "<div class='card-body'>";
                            echo "<div>Distance: ", $distance, " miles</div>\n";
                            echo "<div>Duration: ", $days, " days</div>\n";
                            echo "<a class='btn btn-sm' href='/hike/", $hike->id, "'><i class='fas fa-pencil-alt'></i></a>\n";
                            echo "<a class='btn btn-sm' href='javascript:deleteHike(", $hike->id, ")'><i class='fas fa-trash-alt'></i></a>\n";
                            echo "</div>\n";
                            echo "</div>\n";
                        }
                    ?>
            </div>
            <h4>Completed Saunters</h4>
            <table class="table table-condensed">
                <thead><tr><th>Name</th><th>Length</th><th>Duration</th><th>Start Date</th></tr></thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </div>

    <script>
    <?php require_once resource_path('js/home.js'); ?>
    </script>
@endsection
