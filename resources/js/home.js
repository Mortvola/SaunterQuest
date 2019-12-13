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
