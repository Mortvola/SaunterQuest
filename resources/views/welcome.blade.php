<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Backpacker's Planner</title>

        <!-- Scripts -->
        <script src="{{ asset('js/jquery-3.3.1.slim.min.js') }}"></script>
        <script src="{{ asset('js/popper-1.14.7.min.js') }}"></script>
        <script src="{{ asset('js/bootstrap-4.3.1.min.js') }}"></script>
        <script src="{{ asset('js/utilities.js') }}"></script>

        <!-- Fonts -->
        <link rel="dns-prefetch" href="//fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">

        <!-- Styles -->
        <link href="{{ asset('css/bootstrap-4.3.1.css') }}" rel="stylesheet">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.1/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">

        <!-- Styles -->
        <style>
            html, body {
                background-color: #fff;
                color: #636b6f;
                font-family: 'Nunito', sans-serif;
                font-weight: 200;
                height: 100vh;
                margin: 0;
            }

            .full-height {
                height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }

            .position-ref {
                position: relative;
            }

            .top-right {
                position: absolute;
                right: 10px;
                top: 18px;
            }

            .content {
                text-align: center;
            }

            .title {
                font-size: 84px;
            }

            .links > a {
                color: #636b6f;
                padding: 0 25px;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: .1rem;
                text-decoration: none;
                text-transform: uppercase;
            }

            .m-b-md {
                margin-bottom: 30px;
            }

            body {
                background-color: black;
                background-image: url({{ asset ('Forester.jpg') }});
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-position: center;
                background-size: cover;
            }

            .title {
                font-size: calc(15px + 5vw);
            }

        </style>
    </head>
    <body>
        <div class="flex-center position-ref full-height">
            @if (Route::has('login'))
                <div class="top-right links" style="background-color: rgba(0, 0, 0, 0.65)">
                    @auth
                        <a href="/home" style="color:white">Home</a>
                    @else
                        <!-- a href="{{ route('login', null, false) }}" style="color:white">Login</a -->
                        <a href="javascript:showLoginDialog()" style="color:white">Login</a>
                        <a href="javascript:showRegisterDialog()" style="color:white">Register</a>
                    @endauth
                </div>
            @endif

            <div class="content">
                <div class="title" style="color: white; background-color: rgba(0, 0, 0, 0.65)">
                    Backpacker's Planner
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal fade" id="loginDialog" role="dialog">
            <div class="modal-dialog">
                <!-- Modal content-->
                <div class="modal-content">
                    <div class="tab-content">
                        <div id="login" class="tab-pane fade show active">
                            <div class="card-header">
                                {{ __('Login') }}
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="card-body">
                                <form id='loginForm'>
                                    @csrf

                                    <div class="form-group row">
                                        <label for="username" class="col-md-3 col-form-label text-md-right">{{ __('Username') }}</label>

                                        <div class="col-md-8">
                                            <input id="username" type="username" class="form-control" name="username" value="{{ old('username') }}" required autocomplete="username" autofocus>

                                            <span id="loginUsernameErrors" class="text-danger" role="alert">
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group row">
                                        <label for="loginPassword" class="col-md-3 col-form-label text-md-right">{{ __('Password') }}</label>

                                        <div class="col-md-8">
                                            <input id="loginPassword" type="password" class="form-control" name="password" required autocomplete="current-password">

                                            <span id="loginPasswordErrors" class="text-danger" role="alert">
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group row">
                                        <div class="col-md-8 offset-md-3">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" name="remember" id="remember" {{ old('remember') ? 'checked' : '' }}>

                                                <label class="form-check-label" for="remember">
                                                    {{ __('Remember Me') }}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-group row mb-0">
                                        <div class="col-md-8 offset-md-3">
                                            <button type="submit" class="btn btn-primary">
                                                {{ __('Login') }}
                                            </button>
                                            <button type="button" class="btn" data-dismiss="modal">Cancel</button>

                                            <span id="loginGeneralErrors" class="text-danger" role="alert">
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group row mb-0">
                                        <div class="col-md-8 offset-md-3">
                                            <a data-toggle='tablink' href="#forgotPassword">I forgot my password.</a>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div id="forgotPassword" class="tab-pane fade">
                            <div class="card-header">
                                {{ __('Forgot Password') }}
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="card-body">
                                @if (session('status'))
                                    <div class="alert alert-success" role="alert">
                                        {{ session('status') }}
                                    </div>
                                @endif

                                <form id="forgotPasswordForm">
                                    @csrf

                                    <div class="form-group row">
                                        <label for="email" class="col-md-3 col-form-label text-md-right">{{ __('E-Mail Address') }}</label>

                                        <div class="col-md-8">
                                            <input id="email" type="email" class="form-control" name="email" value="{{ old('email') }}" required autocomplete="email" autofocus>

                                            <span id="forgotPasswordEmailErrors" class="text-danger" role="alert">
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group row mb-0">
                                        <div class="col-md-8 offset-md-3">
                                            <button type="submit" class="btn btn-primary">
                                                {{ __('Send Password Reset Link') }}
                                            </button>
                                            <button type="button" class="btn" data-dismiss="modal">Cancel</button>

                                            <span id="forgotPasswordGeneralErrors" class="text-danger" role="alert">
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group row mb-0">
                                        <div class="col-md-8 offset-md-3">
                                            <a data-toggle="tablink" href="#login">Oh, wait! I remember my password.</a>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div id="resetEmailSent" class="tab-pane fade">
                            <div class="card-header">
                                {{ __('Forgot Password') }}
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-success" role="alert">
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div> <!--  Modal -->

        <!-- Modal -->
        <div class="modal fade" id="registerDialog" role="dialog">
            <div class="modal-dialog">
                <!-- Modal content-->
                <div class="modal-content">
                    <div class="card-header">
                        {{ __('Register') }}
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="card-body">
                        <form id="registerForm">
                            @csrf

                            <div class="form-group row">
                                <label for="username" class="col-md-3 col-form-label text-md-right">{{ __('Username') }}</label>

                                <div class="col-md-8">
                                    <input id="username" type="text" class="form-control" name="username" value="{{ old('username') }}" required autocomplete="username" autofocus>

                                    <span id="registerUsernameErrors" class="text-danger" role="alert">
                                    </span>
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="email" class="col-md-3 col-form-label text-md-right">{{ __('E-Mail Address') }}</label>

                                <div class="col-md-8">
                                    <input id="email" type="email" class="form-control" name="email" value="{{ old('email') }}" required autocomplete="email">

                                    <span id="registerEmailErrors" class="text-danger" role="alert">
                                    </span>
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="registerPassword" class="col-md-3 col-form-label text-md-right">{{ __('Password') }}</label>

                                <div class="col-md-8">
                                    <input id="registerPassword" type="password" class="form-control" name="password" required autocomplete="new-password">

                                    <span id="registerPasswordErrors" class="text-danger" role="alert">
                                    </span>
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="password-confirm" class="col-md-3 col-form-label text-md-right">{{ __('Confirm Password') }}</label>

                                <div class="col-md-8">
                                    <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required autocomplete="new-password">
                                </div>
                            </div>

                            <div class="form-group row mb-0">
                                <div class="col-md-8 offset-md-3">
                                    <button type="submit" class="btn btn-primary" id='registerSaveButton'>
                                        {{ __('Register') }}
                                    </button>
                                    <button type="button" class="btn" data-dismiss="modal">Cancel</button>

                                    <span id="registerGeneralErrors" class="text-danger" role="alert">
                                    </span>
                                </div>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div> <!--  Modal -->

        <script>
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
                submitForm (event, 'register', "{{ route('register', null, false) }}",
                    function (responseText) { window.location.assign(responseText); });
            }

            function submitLogin (event)
            {
                submitForm(event, 'login', "{{ route('login', null, false) }}",
                    function (responseText) { window.location.assign(responseText); });
            }

            function forgotPassword (event)
            {
                submitForm(event, 'forgotPassword', "{{ route('password.email', null, false) }}",
                    function (responseText)
                    {
                    	$("#resetEmailSent").find(".alert-success").html(responseText);
                    	showCard ('#forgotPassword', '#resetEmailSent');
                    });
            }

            function submitForm (event, type, url, success)
            {
                var xmlhttp = new XMLHttpRequest ();

                xmlhttp.onreadystatechange = function ()
                {
                    if (this.readyState == 4)
                    {
                        if (this.status == 200)
                        {
                            success (this.responseText);
                        }
                        else if (this.status == 422)
                        {
                            var response = JSON.parse(this.responseText);

                            displayErrors (response.errors.username, '#' + type + 'UsernameErrors');
                            displayErrors (response.errors.email, '#' + type + 'EmailErrors');
                            displayErrors (response.errors.password, '#' + type + 'PasswordErrors');
                        }
                        else if (this.status >= 400)
                        {
                            displayErrors (["An error occured. Please try again later."], '#' + type + 'GeneralErrors');
                        }
                    }
                }

                var txt = $('#' + type + 'Form').serialize ();

                xmlhttp.open("POST", url, true);
                xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                xmlhttp.send(txt);

                event.preventDefault();
            }
        </script>
    </body>
</html>
