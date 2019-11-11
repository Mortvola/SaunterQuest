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
            var name = 'Waypoint ' + w.id;
    
            if (w.name)
            {
                name = w.name;
            }
    
            txt += "<div data-item=\"" + w.id + "\" draggable='true'>" + name + "</div>";
        }
    
        $('#sortable').html(txt);
    });
