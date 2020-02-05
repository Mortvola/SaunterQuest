function showProfileDialog ()
{
    $.get({
        url: "/user/profile",
        dataType: "json",
        context: this
    })
    .done (function(responseText)
    {
        $("#profileForm [name='paceFactor']").val(responseText.paceFactor);
        $("#profileForm [name='startTime']").val(toTimeString (responseText.startTime));
        $("#profileForm [name='endTime']").val(toTimeString(responseText.endTime));
        $("#profileForm [name='breakDuration']").val(responseText.breakDuration);
        $('#profileForm [name="endDayExtension"]').val(responseText.endDayExtension);
        $('#profileForm [name="endHikeDayExtension"]').val(responseText.endHikeDayExtension);

        $("#profileDialog").modal ('show');
    });

    $("#profileForm").off('submit');
    $("#profileForm").submit(function (event)
    {
        event.preventDefault();
        
        var profile = objectifyForm($('#profileForm').serializeArray ());
        
        profile.startTime = toTimeFloat(profile.startTime);
        profile.endTime = toTimeFloat(profile.endTime);

        $.ajax({
            url: "/user/profile",
            headers:
            {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            },
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(profile),
        })
        .done (function()
        {
            $("#profileDialog").modal ('hide');
        });
    });
}

$().ready (function ()
    {
        $('#profile-menu-item').on('click', showProfileDialog);
    })