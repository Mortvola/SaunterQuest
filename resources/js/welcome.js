"use strict";

function showCard (current, target)
{
    $(current).hide ();
    $(current).removeClass ('show');
    $(target).addClass ('show');
    $(target).show ();
}

$("[data-toggle='tablink']").on('click', function (event)
{
    event.preventDefault();
    var target = $(this).attr('href');
    var current = $(this).parents(".tab-pane");
    showCard(current, target);
});

function showLoginDialog ()
{
    if ($('#forgotPassword').hasClass('show'))
    {
        $('#forgotPassword').hide ();
        $('#forgotPassword').removeClass ('show');
    }

    if ($('#resetEmailSent').hasClass('show'))
    {
        $('#resetEmailSent').hide ();
        $('#resetEmailSent').removeClass ('show');
    }

    $('#login').addClass ('show');
    $('#login').show ();

    $("#loginForm").off('submit');
    $("#forgotPasswordForm").off('submit');

    $("#loginForm").submit(submitLogin);
    $("#forgotPasswordForm").submit(forgotPassword);
    $("#loginDialog").modal ('show');
}

function showRegisterDialog ()
{
    $("#registerForm").off('submit');

    $("#registerForm").submit(submitRegistration);
    $("#registerDialog").modal ('show');
}

function displayErrors (errors, id)
{
    var txt = "";

    if (errors)
    {
        for (let e of errors)
        {
            txt += "<div style='font-size:small'>" + e + "</div>";
        }
    }

    $(id).html(txt);
}

function submitRegistration (event)
{
    submitForm (event, 'register', "/register",
        function (responseText) { window.location.assign(responseText); });
}

function submitLogin (event)
{
    submitForm(event, 'login', "/login",
        function (responseText) { window.location.assign(responseText); });
}

function forgotPassword (event)
{
    submitForm(event, 'forgotPassword', "/password.email",
        function (responseText)
        {
            $("#resetEmailSent").find(".alert-success").html(responseText);
            showCard ('#forgotPassword', '#resetEmailSent');
        });
}

function submitForm (event, type, url, success)
{
    $.post({
        url: url,
        contentType: "application/x-www-form-urlencoded",
        data: $('#' + type + 'Form').serialize (),
        dataType: "json"
    })
    .done (function(response)
    {
        success(response);
    })
    .fail (function (xhr, status, errorThrown)
    {
        if (xhr.status == 422)
        {
            var response = xhr.responseJSON;

            displayErrors (response.errors.username, '#' + type + 'UsernameErrors');
            displayErrors (response.errors.email, '#' + type + 'EmailErrors');
            displayErrors (response.errors.password, '#' + type + 'PasswordErrors');
        }
        else
        {
            displayErrors (["An error occured. Please try again later."], '#' + type + 'GeneralErrors');
        }
    });

    event.preventDefault();
}

$().ready (function ()
    {
        $('#loginLink').on('click', function () { showLoginDialog (); });
        $('#registerLink').on('click', function () { showRegisterDialog (); });
    });
