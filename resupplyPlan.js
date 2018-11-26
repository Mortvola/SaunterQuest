"use strict";

function loadResupply ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			let resupplyPlan = JSON.parse(this.responseText);

			console.log(resupplyPlan);
			
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
	
	xmlhttp.open("GET", "resupplyPlan.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}
