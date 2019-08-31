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
                    <label>Name</label>
                    <input type="text" class='form-control' name='name' id='name' value=''/>
                    <br/>
                    <label>{{ __('E-Mail Address') }}</label>
                    <input type="text" class='form-control' name='emailAddress' id='emailAddress' value=''/>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button id="profileSaveButton" type="button" class="btn btn-default" data-dismiss="modal">Save</button>
            </div>
        </div>
    </div>
</div> <!--  Modal -->

<script>
    function showProfileDialog ()
    {
        $("#profileSaveButton").off('click');
        $("#profileSaveButton").click(function () { profileSave(); });

        $("#profileDialog").modal ('show');
    }

    function profileSave ()
    {
    }
</script>
