"use strict"

$( "#sortable" ).sortable(
{
    stop: function (event, ui)
    {
        var a = $('#sortable').sortable('toArray', {attribute: 'data-item'}).map(Number);

        route.setWaypointOrder (a);
    }
});

$( "#sortable" ).disableSelection();

$(document).on('routeUpdated', function ()
    {
        var txt = "";
    
        for (let w of route.waypoints)
        {
            var sortOrder = w.getLabel ();
            var name = "";
    
            if (w.name)
            {
                name = w.name;
            }
    
            txt += "<div data-item=\"" + w.id + "\" draggable='true'>" +
                "<div class='waypoint-table-cell' style='width:15%'><i class='fas fa-grip-lines' style='opacity:0.2'></i><div class='waypoint-table-cell' style='padding-left:10px'>" + sortOrder + "</div></div>" + 
                "<div class='waypoint-table-cell'>" + name + "</div>" +
                "</div>";
        }
    
        $('#sortable').html(txt);
    });
