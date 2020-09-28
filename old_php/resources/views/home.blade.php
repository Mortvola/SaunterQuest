@extends('layouts.app')

@section('content')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
       integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
       crossorigin=""/>
    <link rel="stylesheet" href="{{ asset('css/leaflet.contextmenu.min.css') }}">
    <div class="app" />
    @component('addResupplyLocationDialog')
    @endcomponent

    @component('addPointOfInterestDialog')
    @endcomponent

    @component('waypointDialog')
    @endcomponent

    @component('addLingerDialog')
    @endcomponent

    @component('exportTrailDialog')
    @endcomponent

    <script>
        sessionStorage.setItem('tileServerUrl', '{{ env('TILE_SERVER_URL', '') }}');
        const endOfDayUrl = "{{ asset('moon_pin.png') }}";
        const campUrl = "{{ asset('camp-ltblue-dot.png') }}";
        <?php require_once resource_path('js/waypoints.js'); ?>
    </script>

    <script src="app.js" />
    <?php require_once resource_path('js/dragDivider.js'); ?>
    <?php require_once resource_path('js/editable.js'); ?>
@endsection
