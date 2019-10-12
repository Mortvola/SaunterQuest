<style type="text/css">
    .context-menu
    {
        position: absolute;
        border: 1px solid #999;
        box-shadow: 1px 3px 3px rgba(0, 0, 0, .3);
        margin-top: -10px;
        margin-left: 10px;
    }
    .context-menu-item
    {
        padding: 3px;
        background: white;
        color: #666;
        font-weight: bold;
        font-family: sans-serif;
        font-size: 12px;
        cursor: pointer;
    }
    .context-menu-item:hover
    {
        background: #eee;
    }
</style>
<script>
"use strict";

function removeContextMenu (object)
{
	if (object.rightClickContextMenu)
	{
		google.maps.event.removeListener (object.rightClickContextMenu);
	}
	
	if (object.clickContextMenu)
	{
		google.maps.event.removeListener (object.clickContextMenu);
	}
}

function setContextMenu (object, contextMenu, context)
{
	removeContextMenu(object);

	object.rightClickContextMenu = object.addListener ("rightclick", function(event) {contextMenu.open (map, event, object, context);});
	object.clickContextMenu = object.addListener ("click", function(event) {if (controlDown) { contextMenu.open (map, event, object, context);}});
}

function initializeContextMenu ()
{
	ContextMenu.prototype = new google.maps.OverlayView ();

	ContextMenu.prototype.open = function (map, event, object, context)
	{
		this.set('position', event.latLng);
		this.set('vertex', event.vertex);
		this.set('object', object);
		this.set('context', context);
		
		this.setMap(map);
		this.draw ();
	};

	ContextMenu.prototype.draw = function()
	{
		var position = this.get('position');
		var projection = this.getProjection();

		if (position && projection)
		{
		    var mapRect = $('#googleMap')[0].getBoundingClientRect();
            var point = projection.fromLatLngToDivPixel(position);
		    var xOffset = 0;
		    var yOffset = 0;
		    
		    if (point.x + this.div_.offsetWidth > mapRect.width / 2)
		    {
		        xOffset = (point.x + this.div_.offsetWidth) - mapRect.width / 2;
		    }
		    
            if (point.y + this.div_.offsetHeight > mapRect.height / 2)
            {
                yOffset = (point.y + this.div_.offsetHeight) - mapRect.height / 2;
            }

			this.div_.style.top = (point.y - yOffset) + 'px';
			this.div_.style.left = (point.x - xOffset) + 'px';
		}
	};

	ContextMenu.prototype.onAdd = function ()
	{
		var contextMenu = this;
		var map = this.getMap ();
		
		this.getPanes().floatPane.appendChild(this.div_);
		
		// mousedown anywhere on the map except on the menu div will close the
		// menu.
		this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(event)
		{
			// If the thing that was clicked was not a child of the context menu div
			// then close the context menu.
			if (event.target.parentElement != contextMenu.div_)
			{
				contextMenu.close();
			}
		}, true);
	};
			
	ContextMenu.prototype.onRemove = function ()
	{
		google.maps.event.removeListener(this.divListener_);
		this.div_.parentNode.removeChild(this.div_);
		
		// clean up
		this.set('position');
	};

	ContextMenu.prototype.close = function ()
	{
		this.setMap(null);
	};

	ContextMenu.prototype.itemClicked = function (itemFunction)
	{
		if (itemFunction != undefined)
		{
			// If the context menu was for a marker then execute the method
			// using the id as the parameter. Otherwise, use the
			// location information as the parameter
			var object = this.get('object');
			var context = this.get('context');
	
			var vertex = this.get ('vertex');
			
			if (vertex != undefined)
			{
				itemFunction (object, vertex, context);
			}
			else
			{
				var position = this.get('position');
	
				itemFunction(object, position, context);
			}
	
			this.close ();
		}
	};
}

//
// Create the context menu using the array of items to create sub-divs
// as children of the context menu div.
//
function ContextMenu (items)
{
	this.div_ = document.createElement ('div');
	this.div_.className = 'context-menu';

	var menu = this;
	
	for (let i in items)
	{
	    if (items[i].admin === undefined || items[i].admin === true && userAdmin === true)
	    {
	        var menuItem = document.createElement('div');
	        menuItem.innerHTML = items[i].title;
	        menuItem.className = 'context-menu-item';
	        this.div_.appendChild(menuItem);

	        google.maps.event.addDomListener(menuItem, 'click', function()
	        {
	            menu.itemClicked (items[i].func);
	        });
	    }
	}
}
</script>
