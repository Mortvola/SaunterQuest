<!-- Modal -->
<style type="text/css">
		input.grams
		{
			max-width:75px;
			text-align: right;
		}
		input.calories
		{
			max-width:100px;
			text-align: right;
		}
		.sub-nutrient-label
		{
			text-indent:25px;
			font-weight:normal;
		}
		hr.thick-black
		{
			display: block;
			position: relative;
			padding: 0;
			margin: 8px auto;
			height: 1px;
			width: 100%;
			max-height: 0;
			font-size: 1px;
			line-height: 0;
			clear: both;
			border: none;
			border-top: 2px solid #000000;
			border-bottom: 2px solid #000000;
		}
</style>

<div class="modal fade" id="addFoodItem" role="dialog">
	<div class="modal-dialog">

		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal">&times;</button>
				<h4 class="modal-title">Food Item</h4>
			</div>

			<div class="modal-body">
				<form class="form-inline" action="" id='foodItemForm'>

					<label>Manufacturer:</label>
					<input type="text" class='form-control' name="manufacturer" required="required" style="width:100%"/>
					<br/>

					<label>Name:</label>
					<input type="text" class='form-control' name="name" required="required" style="width:100%"/>
					<br/>

					<label>Serving Sizes:</label>
					<table class="table table-condensed">
						<thead>
							<tr>
								<th>Description</th>
								<th>Grams/Serving</th>
							</tr>
						</thead>
						<tbody>

							<tr>
								<td>
									<input type="text" class='form-control' name="servingSizeDescription" required="required" style='width:100%'/>
								</td>
								<td>
									<input type="number" class='form-control grams' name="gramsServingSize" required="required"/>
								</td>
							</tr>

							<tr id='servingSizeLastRow'>
								<td><a class='btn btn-sm' onclick='addServingSizeRow()'><span class='glyphicon glyphicon-plus'></span></a></td>
								<td/>
							</tr>

						</tbody>
					</table>

					<hr class='thick-black'>

					<label>Calories:</label>
					<input type="number" class='form-control calories' name="calories" required="required"/>
					<br/>

					<hr class='thick-black'>

					<div class="container-fluid" style='justify-content:space-between;'>
						<div class="row">
							<div class="col-md-6">
								<label>Total Fat:</label>
								<input type="number" class='form-control grams' name="totalFat" step="0.1" required="required"/>
								<br/>

								<label class='sub-nutrient-label'>Saturated Fat:</label>
								<input type="number" class='form-control grams' name="saturatedFat" step="0.1"/>
								<br/>

								<label class='sub-nutrient-label'>Trans Fat:</label>
								<input type="number" class='form-control grams' name="transFat" step="0.1"/>
								<br/>

								<label>Cholesterol:</label>
								<input type="number" class='form-control grams' name="cholesterol"/>
								<br/>

								<label>Sodium:</label>
								<input type="number" class='form-control grams' name="sodium"/>
								<br/>
							</div>
							<div class="col-md-6">
								<label>Total Carbohydrates:</label>
								<input type="number" class='form-control grams' name="totalCarbohydrates" required="required"/>
								<br/>

								<label class='sub-nutrient-label'>Dietary Fiber:</label>
								<input type="number" class='form-control grams' name="dietaryFiber"/>
								<br/>

								<label class='sub-nutrient-label'>Sugars:</label>
								<input type="number" class='form-control grams' name="sugars"/>
								<br/>

								<label>Protein:</label>
								<input type="number" class='form-control grams' name="protein" required="required"/>
								<br/>
							</div>
						</div>
					</div>
				</form>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn" data-dismiss="modal">Cancel</button>
				<button id='foodItemSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
			</div>
		</div>

	</div>
</div> <!--  Modal -->

<script>
	<?php require_once "utilities.js" ?>

	function servingSizeRowGet (servingSize)
	{
		var txt = "";

		txt += "<tr name='alternateServingSize'>";
		txt += "<td>";
		txt += "<span>";
		txt += "<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeServingSize()'><span class='glyphicon glyphicon-trash'></span></a>";
		txt += "</span>"
		txt += "<input name='alternateDescription' type='text' class='form-control' required='required' ";

		if (servingSize !== undefined && servingSize.description !== undefined)
		{
			txt += "value='" + servingSize.description + "' ";
		}

		txt += "/>";

		txt += "</td>";
		txt += "<td>";
		txt += "<input name='alternateGrams' type='number' class='form-control grams' required='required' ";

		if (servingSize !== undefined && servingSize.grams !== undefined)
		{
			txt += "value='" + servingSize.grams + "' ";
		}

		txt += "/>";
		txt += "</td>";
		txt += "</tr>";

		var newRow = $(txt);

		if (servingSize !== undefined && servingSize.foodItemServingSizeId !== undefined)
		{
			newRow.data ("servingSizeId", servingSize.foodItemServingSizeId);
		}

		return newRow;
	}

	function addServingSizeRow (servingSize)
	{
		$("#servingSizeLastRow").before(servingSizeRowGet(servingSize));
	}

	function clearFoodItemDialog ()
	{
		$("input[name='manufacturer']").val("");
		$("input[name='name']").val("");
		$("input[name='servingSizeDescription']").val("");
		$("input[name='gramsServingSize']").val("");
		$("input[name='calories']").val("");
		$("input[name='totalFat']").val("");
		$("input[name='saturatedFat']").val("");
		$("input[name='transFat']").val("");
		$("input[name='cholesterol']").val("");
		$("input[name='sodium']").val("");
		$("input[name='totalCarbohydrates']").val("");
		$("input[name='dietaryFiber']").val("");
		$("input[name='sugars']").val("");
		$("input[name='protein']").val("");

		$("tr[name='alternateServingSize']").remove ();
	}

	function loadFoodItemDialog (foodItem)
	{
		$("input[name='manufacturer']").val(foodItem.manufacturer);
		$("input[name='name']").val(foodItem.name);
		$("input[name='servingSizeDescription']").val(foodItem.servingSizeDescription);
		$("input[name='gramsServingSize']").val(foodItem.gramsServingSize);
		$("input[name='calories']").val(foodItem.calories);
		$("input[name='totalFat']").val(foodItem.totalFat);
		$("input[name='saturatedFat']").val(foodItem.saturatedFat);
		$("input[name='transFat']").val(foodItem.transFat);
		$("input[name='cholesterol']").val(foodItem.cholesterol);
		$("input[name='sodium']").val(foodItem.sodium);
		$("input[name='totalCarbohydrates']").val(foodItem.totalCarbohydrates);
		$("input[name='dietaryFiber']").val(foodItem.dietaryFiber);
		$("input[name='sugars']").val(foodItem.sugars);
		$("input[name='protein']").val(foodItem.protein);

		$("tr[name='alternateServingSize']").remove ();

		for (let s in foodItem.servingDescriptions)
		{
			addServingSizeRow (foodItem.servingDescriptions[s]);
		}
	}

	function unloadFoodItemDialog ()
	{
		var foodItem = objectifyForm($("#foodItemForm").serializeArray());

		foodItem.servingDescriptions = [];

		$("tr[name='alternateServingSize']").each (function (index)
		{
			var servingSize =
			{
				description: $(this).find ("input[name='alternateDescription']").val(),
				grams: parseInt($(this).find ("input[name='alternateGrams']").val())
			};

			var servingSizeId = $(this).data ("servingSizeId");

			if (servingSizeId !== undefined)
			{
				servingSize.servingSizeId = parseInt(servingSizeId);
			}

			foodItem.servingDescriptions.push (servingSize);
		});

		return foodItem;
	}
</script>
