<style type="text/css">
	.resupply-grid
	{
		display: grid;
		grid-template-columns: auto auto;
		justify-content: space-between;
	}
	.resupply-grid-item
	{
		overflow:hidden;
		white-space:nowrap;
		text-overflow:ellipsis;
	}
</style>
<script>
	"use strict";
	
	var resupplyLocationCM = {};
	var resupplyUrl = "http://maps.google.com/mapfiles/ms/micons/postoffice-us.png";
	
	function loadResupply ()
	{
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let resupplyPlan = JSON.parse(this.responseText);
	
				let txt = "";
				
				for (let i in resupplyPlan)
				{
					txt += "<div class='panel panel-default'>";
					
					txt += "<div class='panel-heading' style='padding:5px 5px 5px 5px'>";
					if (i == 0)
					{
						txt += "<div>Initial packed items</div>";
					}
					else
					{
						txt += "<div>Resupply</div>";
					}
					
					txt += "</div>";
					
					txt += "<div>Items</div>";
					
					resupplyPlan[i].items.sort (function (a, b) { return a.name.localeCompare(b.name); });
					
					for (let j in resupplyPlan[i].items)
					{
						let servingSize = 0;
						let words = resupplyPlan[i].items[j].servingDescription.split(' ');
						let r = /\d+\/\d+/;
						if (r.test(words[0]))
						{
							let ints = words[0].split('/');
							servingSize = parseFloat(ints[0]) / parseFloat(ints[1]);
						}
						else
						{
							servingSize = parseInt(words[0]);
						}
						words.splice(0, 1);
						let servingDescription = words.join(' ');
						
						txt += "<div class='resupply-grid' style='border-top:1px solid #f0f0f0'>";
						txt += "<div class='resupply-grid-item' style='padding-left:2px;padding-right:5px'>" + resupplyPlan[i].items[j].name + "</div>"
						txt += "<div class='resupply-grid-item' style='padding-right:2px'>" + (parseInt(resupplyPlan[i].items[j].totalServings) * servingSize) + " " + servingDescription + "</div>";
						txt += "<div class='resupply-grid-item' style='font-size:11px;padding-left:2px;padding-bottom:5px'>" + resupplyPlan[i].items[j].manufacturer + "</div>";
						txt += "</div>";
					}
					
					txt += "</div>";
				}
				
				$('#resupply').html(txt);
			}
		}
		
		xmlhttp.open("GET", userHikeId + "/resupplyPlan", true);
		//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send();
	}
	
	
	function addResupplyLocation (object, position)
	{
		$("#resupplyLocationSaveButton").off('click');
		$("#resupplyLocationSaveButton").click(function () { insertResupplyLocation(position); });
	
		$("#addResupplyLocation").modal ('show');
	}
	
	function insertResupplyLocation (position)
	{
		var resupplyLocation = objectifyForm($("#resupplyLocationForm").serializeArray());
		
		resupplyLocation.lat = position.lat ();
		resupplyLocation.lng = position.lng ();
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				resupplyLocation.shippingLocationId = JSON.parse(this.responseText);
	
				resupplyLocation.marker = new google.maps.Marker({
					position: {lat: parseFloat(resupplyLocation.lat), lng: parseFloat(resupplyLocation.lng)},
					map: map,
					icon: {
						url: resupplyUrl
					}
				});
				
				let markerIndex = 0; //todo: fix this, it shouldn't be zero.
				resupplyLocation.marker.addListener ("rightclick", function (event) { resupplyLocationCM.open (map, event, markerIndex); });
				
				resupplyLocations.push(resupplyLocation);
			}
		}
		
		xmlhttp.open("POST", "/resupplyLocation.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("userHikeId=" + userHikeId + "\&resupplyLocation=" + JSON.stringify(resupplyLocation));
	}
	
	
	function retrieveResupplyLocations ()
	{
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				resupplyLocations = JSON.parse(this.responseText);
				
				if (map)
				{
					for (let r in resupplyLocations)
					{
						resupplyLocations[r].marker = new google.maps.Marker({
							position: {lat: parseFloat(resupplyLocations[r].lat), lng: parseFloat(resupplyLocations[r].lng)},
							map: map,
							icon: {
								url: resupplyUrl
							}
						});
						
						let shippingLocationId = resupplyLocations[r].shippingLocationId;
						resupplyLocations[r].marker.addListener ("rightclick", function (event) { resupplyLocationCM.open (map, event, shippingLocationId); });
	
						if (resupplyLocations[r].address2 == null)
						{
							resupplyLocations[r].address2 = "";
						}
						
						resupplyLocations[r].listener = attachInfoWindowMessage(resupplyLocations[r],
							"<div>" + resupplyLocations[r].name + "</div>"
							+ "<div>" + resupplyLocations[r].address1 + "</div>"
							+ "<div>" + resupplyLocations[r].address2 + "</div>"
							+ "<div>" + resupplyLocations[r].city + ", " + resupplyLocations[r].state + " " + resupplyLocations[r].zip + "</div>");
					}
				}
			}
		}
		
		xmlhttp.open("GET", userHikeId + "/resupplyLocation", true);
		//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send();
	}
	
	
	function resupplyFromLocation (object, position)
	{
		let resupplyEvent = {userHikeId: userHikeId, shippingLocationId: object.shippingLocationId}
	
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
			}
		}
		
		xmlhttp.open("POST", "/resupplyEvent.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(resupplyEvent));
	}
	
	
	function findResupplyLocationIndex (shippingLocationId)
	{
		for (let h in resupplyLocations)
		{
			if (resupplyLocations[h].shippingLocationId == shippingLocationId)
			{
				return h;
			}
		}
		
		return -1;
	}
	
	
	function editResupplyLocation (object, position)
	{
		//
		// Find the resupply location using the shippingLocationId.
		//
		let h = findResupplyLocationIndex (object.shippingLocationId);
		
		if (h > -1)
		{
			$("input[name='name']").val(resupplyLocations[h].name);
			$("input[name='inCareOf']").val(resupplyLocations[h].inCareOf);
			$("input[name='address1']").val(resupplyLocations[h].address1);
			$("input[name='address2']").val(resupplyLocations[h].address2);
			$("input[name='city']").val(resupplyLocations[h].city);
			$("input[name='state']").val(resupplyLocations[h].state);
			$("input[name='zip']").val(resupplyLocations[h].zip);
			
			$("#resupplyLocationSaveButton").off('click');
			$("#resupplyLocationSaveButton").click(function () { updateResupplyLocation(shippingLocationId)});
			
			$("#addResupplyLocation").modal ('show');
		}
	}
	
	function updateResupplyLocation (shippingLocationId)
	{
		var resupplyLocation = objectifyForm($("#resupplyLocationForm").serializeArray());
		resupplyLocation.shippingLocationId = shippingLocationId;
		
		let h = findResupplyLocationIndex (shippingLocationId);
	
		resupplyLocation.lat = resupplyLocations[h].lat;
		resupplyLocation.lng = resupplyLocations[h].lng;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let h = findResupplyLocationIndex (shippingLocationId);
				resupplyLocations[h] = resupplyLocation;
			}
		}
		
		xmlhttp.open("PUT", "/resupplyLocation.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(resupplyLocation));
	}
	
	
	function deleteResupplyLocation (object, position)
	{
	}
</script>
