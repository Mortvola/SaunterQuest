@extends('layouts.app')

@section('content')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
       integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
       crossorigin=""/>
    <link rel="stylesheet" href="{{ asset('css/leaflet.contextmenu.min.css') }}">

    <style type="text/css">
        body
        {
            font: 14px sans-serif;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
        }

        .day-card-header
        {
          display: grid;
          grid-template-columns: auto auto auto;
          justify-content: space-between;
        }
        .map-info
        {
            display:none;
            position:absolute;
            top:10%;
            justify-self: center;
            width:200px;
            height:50px;
            background-color:white;
            border-radius:5px;
            box-shadow:0 2px 7px 1px rgba(0,0,0,0.3);
            z-index: 800;
        }
        .map-distance-window
        {
            width:14px;
            height:14px;
            font-size:14px
        }
        .map-please-wait
        {
            display:none;
            position:absolute;
            justify-self: center;
            align-self: center;
            width:100px;
            height:100px;
            background:rgba(255, 255, 255, 1.0);
            border-radius:5px;
            box-shadow:0 2px 7px 1px rgba(0,0,0,0.3);
            z-index: 800;
        }
        .map-please-wait-spinner
        {
            width: 5rem;
            height: 5rem;
            border-width: 10px;
        }
        .waypoint-table-header
        {
            border-bottom-style: solid;
        }
        .waypoint-table-header-cell
        {
            display:inline-block;
            font-weight:700;
        }
        .waypoint-table-cell
        {
            display:inline-block;
        }

        .map-grid-item
        {
            grid-area: map;
            display:grid;
            grid: minmax(0, 1fr) / minmax(0, 1fr);
            width:100%;
            height:100%
        }

        .ele-grid-item
        {
            grid-area: ele;
        }

        .controls-grid-item
        {
            grid-area: controls;
            border-right-style: solid;
            border-right-width: thin;
            height: 100%;
            display:grid;
            grid-template-rows: min-content minmax(0, 1fr);
        }

        .controls-grid-item .tab-content
        {
            height: 100%;
            background-color: #fbfbfb;
        }

        .hike-grid
        {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
            grid-template-rows: minmax(0, 3fr) minmax(0, 1fr);
            grid-template-areas:
                "controls map"
                "controls ele"
                ;
            justify-items: stretch;
            align-items: stretch;
            align-content:stretch;
        }

        .card
        {
            margin: 8px 8px 12px 8px;
            box-shadow: 0 2px 7px 1px rgba(0,0,0,0.3);
        }

        .card-header
        {
            padding: 8px;
        }

        .gear-card-body
        {
            margin: 4px;
        }

        @media screen and (max-width: 668px)
        {
            .controls-grid-item
            {
                display:none;
            }
            .hike-grid
            {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                grid-template-rows: minmax(0, 3fr) minmax(0, 1fr);
                grid-template-areas:
                    "map"
                    "ele"
                    ;
                justify-items: stretch;
                align-items: stretch;
                align-content: stretch;
            }
        }

        .trail-marker
        {
            background: none;
            border: none;
        }

        .trail-marker-label
        {
            position:absolute;
            width:16px;
            height:16px;
            margin-left:7px;
            margin-top: 2px;
            background:none;
            text-align:center;
        }

    </style>

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

    <div class="app" />
    <script src="/hike.js" />

    <script>
    <?php require_once resource_path('js/waypoints.js'); ?>
    </script>

    <script>
        sessionStorage.setItem('hikeId', {{ $hikeId }});
        sessionStorage.setItem('userAdmin', {{ Auth::user()->admin ? 'true' : 'false' }});
        sessionStorage.setItem('tileServerUrl', '{{ env('TILE_SERVER_URL', '') }}');
        var endOfDayUrl = "{{ asset('moon_pin.png') }}";
        var campUrl = "{{ asset('camp-ltblue-dot.png') }}";
    </script>

    <!-- Make sure you put this AFTER Leaflet's CSS -->
    <script>
    </script>
    <script>
    </script>

@endsection
