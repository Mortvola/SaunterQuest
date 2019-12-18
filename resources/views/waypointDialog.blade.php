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
                    <label style="display:block">
                        Name:
                        <input type="text" class='form-control' name='name'/>
                    </label>

                    <div class="form-check">
                        <input type="checkbox" class='form-check-input' data-constraint='camp'/>
                        <label class="form-check-label">Camp</label>
                    </div>
                    <br/>

                    <label style="display:block">
                        Delay (in minutes)
                        <input type="text" class='form-control' data-constraint='delay'/>
                    </label>

                    <label style="display:block">
                        Depart no later than:
                        <input type="time" class='form-control' data-constraint='startTime' value=''/>
                    </label>

                    <label style="display:block">
                        Gear Change:
                        <select name="gearConfigId">
                            <option value="-1">None</option>
                        </select>
                    </label>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form='waypointForm' class="btn btn-default">Save</button>
            </div>
        </div>
    </div>
</div>
