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
                    <label>End of Hike Day Extension (minutes)</label>
                    <input type="text" class='form-control' name='endHikeDayExtension' id='endHikeDayExtension' value=''/>
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
