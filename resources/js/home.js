"use strict";

function deleteHike (hikeId)
{
    $.ajax({
        url: "hike/" + hikeId,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE"
    })
    .done (function()
    {
        $("#userHike_" + hikeId).remove ();
    });
}

function insertHike ()
{
    var hike = objectifyForm($("#userHikeForm").serializeArray());

    $.post({
        url: "hike",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        data: JSON.stringify(hike.name),
        dataType: "json"
    })
    .done (function(hike)
    {
        document.location.href = "/hike/" + hike.id;
    });
}

function showHikeDialog ()
{
    $("#addHikeSaveButton").off('click');
    $("#addHikeSaveButton").click(insertHike);

    $("#hikeDialog").modal ('show');
}


function makeEditable (element)
{
    let value = element.html ();
    let url = element.attr('data-url');
    let prop = element.attr('data-prop');
    
    element.html(value + "<a class='btn btn-sm'><i class='fas fa-pencil-alt' style='color:rgba(0,0,0,0.4)'></i></a>");
    element.on('click', function () {
        element.hide ();
        
        let grid = $("<div style='width:100%;display: grid;grid-template-columns: 1fr min-content min-content;'></div");
        let edit = $("<input type='text' style='width:100%;border-width:2px; border-style:solid'/>");
        let save = $("<button class='btn btn-sm' type='button'>" + 
            "<i class='fas fa-check-square'></i>" +
            "</button>");
        let cancel = $("<button class='btn btn-sm' type='button'>" + 
            "<i class='fas fa-window-close'></i>" +
            "</button>");

        grid.insertAfter(element);
        grid.append(edit);
        grid.append(save);
        grid.append(cancel);

        edit.val(value);
        edit.focus ();
        
        let label = this;

        save.on ('click', function ()
            {
                value = edit.val();

                $.ajax({
                    url: url,
                    headers:
                    {
                        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
                    },
                    type: "PUT",
                    contentType: "application/json",
                    data: JSON.stringify({[prop]: value})
                })
                .done (function()
                {
                    $(label).html(value + "<a class='btn btn-sm'><i class='fas fa-pencil-alt' style='color:rgba(0,0,0,0.4)'></i></a>");
                    $(label).show ();
                    grid.remove ();
                });
            });

        cancel.on('click', function ()
            {
                $(label).show ();
                grid.remove ();
            });
    });
}


function getHikes ()
{
    $("#pleaseWait").show ();

    $.getJSON({
        url: "/hikes",
        context: this
    })
    .done (function(response)
    {
        if (Array.isArray(response))
        {
            response.sort(function (a, b)
                {
                    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                  
                    if (nameA < nameB)
                    {
                      return -1;
                    }
                    
                    if (nameA > nameB)
                    {
                      return 1;
                    }
    
                    // names must be equal
                    return 0;
                });
            
            for (let hike of response)
            {
                let card = $('<div></div>')
                    .addClass("card bpp-shadow mr-4 mb-4 flex-shrink-0 flex-grow-0")
                    .css("width", "250px")
                    .attr("id", "userHike_" + hike.id)
                
                let name = $('<div></div>')
                    .addClass('edit-hike-name')
                    .attr('data-url', 'hike/' + hike.id)
                    .attr('data-prop', 'name')
                    .text(hike.name);
                    
                makeEditable (name);
                
                let header = $('<div></div>')
                    .addClass('hike-card-header card-header');
                
                name.appendTo(header);
                header.appendTo(card);
                
                let body = $('<div></div>')
                    .addClass('card-body')
                    .append('<div></div>');

                $('<div></div>')
                .text ('Distance: ' + metersToMilesRounded(hike.distance) + ' miles')
                .appendTo (body);
            
                $('<div></div>')
                .text ('Duration: ' + hike.days + ' days')
                .appendTo (body);

                let buttons = $('<div></div>')
                    .css({display: "flex", "justify-content": "space-between", "margin-top": "14px"})
                    .appendTo(body);
                
                $('<button></button>')
                    .addClass ('btn btn-sm btn-outline-secondary')
                    .text ('Delete')
                    .on('click', function () { deleteHike (hike.id); })
                    .appendTo (buttons);
        
                $('<button></button>')
                    .addClass ('btn btn-outline-secondary')
                    .attr('type', 'button')
                    .text ('Open')
                    .on('click', function () { window.location.href = '/hike/' + hike.id; })
                    .attr('href', '/hike/' + hike.id)
                    .appendTo (buttons);
                
                body.appendTo(card);
                
                card.appendTo ('.hikes');
            }
        }
    })
    .always (function ()
    {
        
        $("#pleaseWait").hide ();
    });
}


$().ready(function ()
    {
        getHikes ();
    });
