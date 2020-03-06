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

    .hikes
    {
        display: flex;
        flex-wrap: wrap;
        overflow: auto;
        padding-left: 14px;
        padding-right: 14px;
    }

    div.hike-card-header
    {
        background-color: burlywood;
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
            <h4>Hikes<a class='btn btn-sm' href='javascript:showHikeDialog()'><i class='fas fa-plus'></i></a></h4>
            <div class='hikes'>
            </div>
            <div class="map-please-wait" id="pleaseWait">
                <div class="spinner-border text-primary m-2 map-please-wait-spinner" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>
        </div>
    </div>

    <script>
    <?php require_once resource_path('js/home.js'); ?>
    </script>
@endsection
