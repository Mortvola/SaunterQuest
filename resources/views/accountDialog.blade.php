<!-- Modal -->
<div class="modal fade" id="accountDialog" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 id=modalTitle class="modal-title">Account</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='accountForm'>
                    <label>Name</label>
                    <input type="text" class='form-control' name='name' id='name' value=''/>
                    <br/>
                    <label>{{ __('E-Mail Address') }}</label>
                    <input type="text" class='form-control' name='emailAddress' id='emailAddress' value=''/>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button id="accountSaveButton" type="button" class="btn btn-default" data-dismiss="modal">Save</button>
            </div>
        </div>
    </div>
</div> <!--  Modal -->
