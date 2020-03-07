<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>SaunterQuest</title>

        <!-- Scripts -->
        <script src="{{ asset('js/jquery-3.4.1.min.js') }}"></script>
        <script src="{{ asset('js/bootstrap-4.3.1.bundle.min.js') }}"></script>
        <script src="{{ asset('js/utilities.js') }}"></script>

        <!-- Fonts -->
        <link rel="dns-prefetch" href="//fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet">

        <!-- Styles -->
        <link href="{{ asset('css/bootstrap-4.3.1.css') }}" rel="stylesheet">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.1/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">

        <!-- Styles -->
        <style>
            :root {
                --title-font-size: calc(15px + 5vw);
            }

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
                display: grid;
                justify-items: center;
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
                background: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url({{ asset ('Forester.jpg') }});
                background-repeat: no-repeat;
                background-attachment: fixed;
                background-position: center;
                background-size: cover;
            }

            @media screen and (max-width: 668px) {
                :root {
                    --title-font-size: calc(15px + 8vw);
                }
            }

            .titles{
                display: grid;
                justify-items: center;
                width: max-content;
                color: white;
            }

            .title {
                font-size: var(--title-font-size);
                line-height: 85%;
                text-shadow: black 0px 2px 4px, black 0px -2px 4px, black -2px 0px 4px, black 2px 0px 4px;
            }

            .subtitle {
                font-size: calc(15px + 1vw);
                line-height: 85%;
                text-shadow: black 0px 2px 2px, black 0px -2px 2px, black -2px 0px 2px, black 2px 0px 2px;
                margin-top: 14px
            }

            .quote {
                font-size: calc(15px + 0.5vw);
                color: white;
                line-height: 85%;
                margin-top:64px;
                width: max-content;
                text-align: center;
                text-shadow: black 0px 1px 1px, black 0px -1px 1px, black 1px 0px 1px, black -1px 0px 1px;
            }

            .attribution {
                text-align:right;
                margin-top: 14px;
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
                        <a id="loginLink" style="color:white; cursor: pointer;">Login</a>
                        <a id="registerLink" style="color:white; cursor: pointer;">Register</a>
                    @endauth
                </div>
            @endif

            <div class="content">
                <div class="titles">
                    <div class="title">
                        SaunterQuest
                    </div>
                    <div class="subtitle">
                        It's about <u><em>time</em></u>
                    </div>
                </div>
                <div class="quote">
                    <div>
                    “I don't like either the word [hike] or the thing.
                    </div>
                    <div>People ought to saunter in the mountains..."</div>
                    <div class="attribution">-- John Muir</div>
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

                    @reg
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

                    @else
                        This site is under development. Registrations are currently only availble through invititation.
                    @endreg

                    </div>
                </div>
            </div>
        </div> <!--  Modal -->

        <script>
            {{File::requireOnce(resource_path('js/welcome.js'))}}
        </script>
    </body>
</html>
