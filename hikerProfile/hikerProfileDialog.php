<!-- Modal -->
<div class="modal fade" id="addHikerProfile" role="dialog">
	<div class="modal-dialog">
	
		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header">
				<h4 class="modal-title">Hiker Profile</h4>
				<button type="button" class="close" data-dismiss="modal">&times;</button>
			</div>
			
			<div class="modal-body">
				<form id='hikerProfileForm'>
					<label>Start Day:</label>
					<input type="number" class='form-control' name='startDay'/>
					<br/>
					
					<label>End Day:</label>
					<input type="number" class='form-control' name='endDay'/>
					<br/>
					
					<label>Speed Factor (%):</label>
					<input type="number" class='form-control' name='speedFactor' value='100'/>
					<br/>
					
					<label>Start Time:</label>
					<input type="time" class='form-control' name='startTime' value='07:00'/>
					<br/>
					
					<label>End Time:</label>
					<input type="time" class='form-control' name='endTime' value='18:00'/>
					<br/>
					
					<label>Break Duration (hours):</label>
					<input type="number" class='form-control' name='breakDuration'/>
					<br/>
				</form>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn" data-dismiss="modal">Cancel</button>
				<button id='hikerProfileSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
			</div>
		</div>
	
	</div>
</div> <!--  Modal -->"
