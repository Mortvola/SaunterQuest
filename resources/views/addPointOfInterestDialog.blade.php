<!-- Modal -->
<div class="modal fade" id="addPointOfInterest" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Point of Interest</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='pointOfInterestForm'>
                    <label>Name:</label>
                    <input type="text" class='form-control' name='name'/>
                    <br/>

                    <label>Description:</label>
                    <input type="text" class='form-control' name='description'/>
                    <br/>
                    <label>Hang Out (in minutes)</label>
                    <input type="text" class='form-control' name='hangOut'/>
                    <br />
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button id='pointOfInterestSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
            </div>
        </div>
    </div>
</div>
