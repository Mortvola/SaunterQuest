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
                    <div class="form-group">
                    <label>Name:</label>
                    <input type="text" class='form-control' name='name'/>
                    </div>

                    <div class="form-check">
                        <input type="checkbox" class='form-check-input' data-constraint='camp'/>
                        <label class="form-check-label">Camp</label>
                    </div>
                    <br/>

                    <div class="form-group">
                    <label>Delay (in minutes)</label>
                    <input type="text" class='form-control' data-constraint='delay'/>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form='waypointForm' class="btn btn-default">Save</button>
            </div>
        </div>
    </div>
</div>
