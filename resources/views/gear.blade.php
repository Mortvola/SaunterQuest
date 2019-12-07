@extends('layouts.app')

@section('content')
<style>
    .gear-main
    {
        display: grid;
        grid-template-rows: min-content minmax(0px, 1fr);
        grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
        grid-template-areas:
            "inventory-title kits-title"
            "inventory kits"
            ;
        width: 100%;
        height: 100%;
    }

    .gear-inventory-title
    {
        grid-area: inventory-title;
    }

    .gear-inventory
    {
        grid-area: inventory;

        display: flex;
        flex-direction: column;

        padding-right: 14px;

        height: 100%;
        width: 100%;
        overflow: auto;
    }

    .gear-kits-title
    {
        grid-area: kits-title;
    }

    .gear-kits
    {
        grid-area: kits;
        place-self: stretch stretch;

        height: 100%;
        width: 100%;
        min-width: 0;
        overflow: auto;
    }

    .gear-item
    {
        display: grid;
        grid-template-columns: 14px 14px minmax(0, 1fr) minmax(0, 2fr) 100px 50px 75px;
        grid-gap: 4px;
    }

    .gear-title
    {
        padding:1px;
        margin:2px;
        border-bottom-style: solid;
    }

    .gear-weight
    {
        display:grid;
        grid-template-columns: min-content minmax(0, 1fr) min-content;
        width: 100%;
    }

    .gear-config-quantity
    {
        display:grid;
        grid-template-columns: min-content minmax(0, 1fr);
        width: 100%;
    }

    .gear-config-totalWeight-group
    {
        display:grid;
        grid-template-columns: min-content minmax(0, 1fr);
        width: 100%;
    }

    .gear-config-item
    {
        display: grid;
        grid-template-columns: 14px minmax(0, 1fr) minmax(0, 2fr) 100px 100px 100px 150px minmax(0, 1fr);
        grid-gap: 4px;
    }

    @media screen and (max-width: 668px)
    {
        .gear-main
        {
            display: grid;
            grid-template-rows: min-content minmax(0px, 1fr) min-content minmax(0px, 1fr);
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas:
                "kits-title"
                "kits"
                "inventory-title"
                "inventory"
                ;
        }

        .gear-inventory
        {
            padding-right: 0;
            overflow-y: scroll;
        }

        .gear-kits
        {
            padding-right: 0;
            overflow-y: scroll;
        }

        .gear-item
        {
            display: grid;
            grid-template-columns: 14px minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr);
            grid-template-areas:
                "menu name weight"
                "description description description"
                "days days distance"
                ;
            grid-gap: 0;
            border: 1px solid rgba(0, 0, 0, 0.125)
        }

        .gear-config-item
        {
            display: grid;
            grid-template-columns: 14px minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr);
            grid-template-areas:
                "menu name system location"
                ". description description description"
                ". weight . ."
                ". quantity . ."
                ". totalWeight . ."
                ;
            grid-gap: 0;
            border: 1px solid rgba(0, 0, 0, 0.125)
        }

        .drag-handle
        {
            grid-area: drag;
        }

        .gear-menu
        {
            grid-area: menu;
        }

        .gear-name
        {
            grid-area: name;
        }

        .gear-description
        {
            grid-area: description;
        }

        .gear-weight
        {
            grid-area: weight;
        }

        .drag-handle
        {
            display: none;
        }

        .gear-title-bar
        {
            display: none;
            height: 100%;
        }

        .gear-config-title-bar
        {
            display: none;
        }

        .gear-config-quantity
        {
            grid-area: quantity;
        }

        .gear-config-totalWeight-group
        {
            grid-area: totalWeight;
        }

        .gear-config-system
        {
            grid-area: system;
        }

        .gear-config-location
        {
            grid-area: location;
        }
    }

    .gear-number
    {
        text-align: right;
    }

    .gear-item div, .gear-config-item div
    {
        padding:2px;
        width: 100%;
    }

    .gear-item input, .gear-config-item input
    {
        border-style:none;
        padding:2px;
        width: 100%;
    }

    .gear-item select, .gear-config-item select
    {
        border-style:none;
    }

    .gear-item input:hover, .gear-config-item input:hover
    {
        border-style:solid;
        border-width:2px;
        padding:0;
    }

    .gear-item input:focus, .gear-config-item input:focus
    {
        border-style:solid;
        border-width:2px;
        padding:0;
    }

    .gear-select-item
    {
        cursor: default;
        padding-left: 14px;
        padding-right: 14px;
    }

    .gear-select-item:hover
    {
        background-color: lightblue;
    }

</style>

	<div class="gear-main">
        <div class="gear-inventory-title">Gear Inventory</div>
        <div class="gear-inventory" id="gear-inventory">
            <div class="gear-item gear-title-bar">
                <div></div>
                <div></div>
                <div class="gear-title">Item Name</div>
                <div class="gear-title">Description</div>
                <div class="gear-title gear-number">Weight</div>
                <div class="gear-title gear-number">Days</div>
                <div class="gear-title gear-number">Distance</div>
            </div>
        </div>
        <div class="gear-kits-title">Gear Configurations<button class='btn btn-link' data-add="gear-config"><i class='fas fa-plus'></i></button></div>
        <div class="gear-kits" id="gear-kits">
        </div>
    </div>

    <datalist id="gear-location">
        <option value="Pack">
        <option value="Worn">
    </datalist>
    <datalist id="gear-system">
    <script>
    <?php require_once resource_path('js/gear.js'); ?>
    </script>
@endsection
