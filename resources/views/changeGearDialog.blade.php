<!-- Modal -->
<div class="modal fade" id="changeGearDialog" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <h4 id=modalTitle class="modal-title">Change Gear</h4>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id='changeGearForm'>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form='changeGearForm' class="btn btn-default">Select</button>
            </div>
        </div>
    </div>
</div> <!--  Modal -->

<script>
    <?php require_once resource_path('js/changeGearDialog.js'); ?>
</script>
