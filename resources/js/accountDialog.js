function showAccountDialog ()
{
    $("#accountSaveButton").off('click');
    $("#accountSaveButton").click(function () { accountSave(); });

    $("#accountDialog").modal ('show');
}

function accountSave ()
{
}


$().ready (function ()
    {
        $('#account-menu-item').on('click', showAccountDialog);
    });