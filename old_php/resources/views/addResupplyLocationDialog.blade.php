<!-- Modal -->
<div class="modal fade" id="addResupplyLocation" role="dialog">
    <div class="modal-dialog">

        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Resupply Location</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
            <form id='resupplyLocationForm'>
                <label>Name:</label>
                <input type="text" class='form-control' name='name'/>
                <br/>

                <label>In Care Of:</label>
                <input type="text" class='form-control' name='inCareOf'/>
                <br/>

                <label>Address 1:</label>
                <input type="text" class='form-control' name='address1'/>
                <br/>

                <label>Address 2:</label>
                <input type="text" class='form-control' name='address2'/>
                <br/>

                <label>City:</label>
                <input type="text" class='form-control' name='city'/>
                <br/>

                <label>State:</label>
                <input type="text" class='form-control' name='state'/>
                <br/>

                <label>Zip Code:</label>
                <input type="text" class='form-control' name='zip'/>
                <br/>
            </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button id='resupplyLocationSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
            </div>
        </div>

    </div>
</div>
