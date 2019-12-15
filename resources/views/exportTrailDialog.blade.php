<!-- Modal -->
<div class="modal fade" id="exportTrail" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 id=modalTitle class="modal-title">Export Trail</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='exportTrailForm'>
                    <label>Maximum number of points per segment:</label>
                    <input type="text" class='form-control' name='segmentMax' id='exportTrailSegmentMax' value='200'/>
                    <br/>
                    <label>Maximum distance between points:</label>
                    <input type="text" class='form-control' name='maxDistance' id='exportTrailMaxDistance' value='400'/>
                </form>
                <a id="exportTrailLink" download="export.gpx" hidden></a>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button id="exportTrailButton" type="button" class="btn btn-default" data-dismiss="modal">Export</button>
            </div>
        </div>
    </div>
</div> <!--  Modal -->

<script>
    function showExportTrailModal ()
    {
        $("#exportTrailButton").off('click');
        $("#exportTrailButton").click(function () { exportTrail(); });

        $("#exportTrail").modal ('show');
    }

    function exportTrail ()
    {
        var segmentMax = $("#exportTrailSegmentMax").val ();
        var maxDistance = $("#exportTrailMaxDistance").val ();

        $("#exportTrailLink").attr ("href", hike.id + "/export?segmentMax=" + segmentMax + "&maxDistance=" + maxDistance);
        $("#exportTrailLink")[0].click ();
    }
</script>
