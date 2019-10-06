<!-- Modal -->
<div class="modal fade" id="waypointDialog" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Waypoint</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='waypointForm'>
                    <label>Name:</label>
                    <input type="text" class='form-control' name='name'/>
                    <br/>

                    <label>Delay (in minutes)</label>
                    <input type="text" class='form-control' data-constraint='delay'/>
                    <br />
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form='waypointForm' class="btn btn-default">Save</button>
            </div>
        </div>
    </div>
</div>
