<!-- Modal -->
<div class="modal fade" id="profileDialog" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 id=modalTitle class="modal-title">Profile</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='profileForm'>
                    <label>Pace Factor (%):</label>
                    <input type="number" class='form-control' name='paceFactor' value='100'/>
                    <br/>

                    <label>Start Time:</label>
                    <input type="time" class='form-control' name='startTime' value='07:00'/>
                    <br/>

                    <label>End Time:</label>
                    <input type="time" class='form-control' name='endTime' value='18:00'/>
                    <br/>

                    <label>Break Duration (minutes):</label>
                    <input type="number" class='form-control' name='breakDuration' value='60'/>
                    <br/>

                    <label>End of Day Extension (minutes)</label>
                    <input type="number" class='form-control' name='endDayExtension' value='60'/>
                    <br/>

                    <label>End of Hike Extension (minutes)</label>
                    <input type="number" class='form-control' name='endHikeDayExtension' value='60'/>
                    <br/>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form='profileForm' class="btn btn-default">Save</button>
            </div>
        </div>
    </div>
</div> <!--  Modal -->
