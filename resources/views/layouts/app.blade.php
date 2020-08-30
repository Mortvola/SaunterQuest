<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1,shrink-to-fit=no">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Scripts -->
    <script src="{{ asset('js/jquery-3.4.1.min.js') }}"></script>
    <script src="{{ asset('js/bootstrap-4.3.1.bundle.min.js') }}"></script>
    <script src="{{ asset('js/jquery-ui-1.12.1.js') }}"></script>

    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nunito">

    <!-- Styles -->
    <link rel="stylesheet" href="{{ asset('css/bootstrap-4.3.1.css') }}">
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.1/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>
    <script>
        sessionStorage.setItem('username', '{{ Auth::user()->username }}');
        @if (Auth::user()->admin)
        sessionStorage.setItem('userAdmin', {{ Auth::user()->admin ? 'true' : 'false' }});
        @endif
    </script>

    <div id="app" class="background-picture">
        @yield('content')
    </div>

    <script>
    </script>
</body>
</html>
