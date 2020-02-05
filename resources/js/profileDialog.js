function showProfileDialog ()
{
    $.get({
        url: "/user/profile",
        dataType: "json",
        context: this
    })
    .done (function(responseText)
    {
        $('#profileForm #endHikeDayExtension').val(responseText.endHikeDayExtension);
        
        $("#profileSaveButton").off('click');
        $("#profileSaveButton").click(function () { profileSave(); });

        
        $("#profileDialog").modal ('show');
    });

    $("#profileForm").off('submit');
    $("#profileForm").submit(function (event)
    {
        event.preventDefault();
        
        var profile = objectifyForm($('#profileForm').serializeArray ());
        
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