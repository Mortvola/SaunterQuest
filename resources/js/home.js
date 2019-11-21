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

    $.ajax({
        url: "hike",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            "Content-type": "application/json"
        },
        type: "POST",
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

$().ready(function ()
    {
        $('.edit-hike-name').each (function ()
            {
                let value = $(this).html ();
                let url = $(this).attr('data-url');
                let prop = $(this).attr('data-prop');
                
                $(this).html(value + "<a class='btn btn-sm'><i class='fas fa-pencil-alt'></i></a>");
                $(this).on('click', function () {
                    $(this).hide ();
                    
                    let grid = $("<div style='width:100%;display: grid;grid-template-columns: 1fr min-content min-content;'></div");
                    let edit = $("<input type='text' style='width:100%;border-width:2px; border-style:solid'/>");
                    let save = $("<button class='btn btn-sm' type='button'>" + 
                        "<i class='fas fa-check-square'></i>" +
                        "</button>");
                    let cancel = $("<button class='btn btn-sm' type='button'>" + 
                        "<i class='fas fa-window-close'></i>" +
                        "</button>");

                    grid.insertAfter($(this));
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
                                $(label).html(value + "<a class='btn btn-sm'><i class='fas fa-pencil-alt'></i></a>");
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
            });
    });
