@extends('layouts.app')

@section('content')
<style>
    :root
    {
/*         --gear-title-bg-color: #5d4037; */
/*         --gear-title-color: white; */
/*         --gear-card-container-bg-color: #b3e5fc; */
/*         --gear-card-bg-color: gray; */
/*         --gear-card-color: white; */
/*         --gear-title-bg-color: #89b555;
         --gear-inventory-bg-color: #89b555;
         --gear-title-color: white;
         --gear-card-container-bg-color: black;
         --gear-card-bg-color: #adb6bb;
         --gear-card-color: black;
         --gear-bg-color: #45525d;
         --gear-color: white;
         --gear-card-header-bg-color: #45525d;
*/
         --gear-title-color: white;
         --gear-card-container-bg-color: black;

         --gear-config-title-bg-color: #6c3108;
         --gear-config-header-bg-color: #c3ac8a;
         --gear-config-header-color: black;
         --gear-config-bg-color: #e4dacb;

         --gear-title-bg-color: #4d5461;
         --gear-card-color: black;
         --gear-bg-color: #bec0c5;
         --gaer-color: black;
    }

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

        background-color: var(--gear-card-container-bg-color);
    }

    .gear-collapse
    {
        background-color: var(--gear-card-container-bg-color);
    }

    .gear-inventory-title
    {
        background-color: var(--gear-title-bg-color);
        color: var(--gear-title-color);
        grid-area: inventory-title;
        margin-right: 14px;
    }

    .gear-config-add
    {
        color: var(--gear-title-color);
    }

    .gear-config-header
    {
        background-color: var(--gear-config-header-bg-color);
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

        background-color: var(--gear-card-container-bg-color);
    }

    .gear-kits-title
    {
        background-color: var(--gear-config-title-bg-color);
        color: var(--gear-title-color);
        grid-area: kits-title;
    }

    .btn-link
    {
        color: var(--gear-config-header-color);
    }

    .btn-link:hover
    {
        color: white;
    }

    .gear-kits
    {
        grid-area: kits;
        place-self: stretch stretch;

        height: 100%;
        width: 100%;
        min-width: 0;
        overflow: auto;

        background-color: var(--gear-card-container-bg-color);
    }

    .gear-item
    {
        display: grid;
        grid-template-columns: 14px 14px minmax(0, 1fr) minmax(0, 2fr) 100px 50px 75px;
        grid-gap: 4px;

        background-color: var(--gear-bg-color);
        color: var(--gear-color);
    }

    .gear-item input, .gear-item select
    {
        background-color: var(--gear-bg-color);
        color: var(--gear-color);
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
        grid-template-columns: 1fr min-content;
        grid-template-rows: min-content minmax(0, 1fr);
        grid-template-areas:
            "label label"
            "input select"
            ;
        width: 100%;
    }

    .uofm-select
    {
        display: none;
    }

    .gear-config-item
    {
        display: grid;
        grid-template-columns: 14px minmax(0, 1fr) minmax(0, 2fr) 100px 100px 100px 150px minmax(0, 1fr);
        grid-gap: 4px;

        background-color: var(--gear-config-bg-color);
        color: var(--gear-card-color);
    }

    .gear-config-item input, .gear-config-item select
    {
        background-color: var(--gear-config-bg-color);
        color: var(--gear-card-color);
    }

    .gear-config-label
    {
        display: none;
    }

    @media screen and (max-width: 800px)
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

        .gear-inventory-title
        {
            margin-right: 0;
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
            grid-template-columns: 14px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr);
            grid-template-areas:
                "menu name name name weight"
                ". description description description description"
                ". days distance . ."
                ;
            grid-gap: 0;
            border: 1px solid rgba(0, 0, 0, 0.125);
            margin: 2px;
            border-radius: 8px;
        }

        .gear-config-item
        {
            display: grid;
            grid-template-columns: 14px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1fr);
            grid-template-areas:
                "menu name name system location"
                ". description description description description"
                ". weight quantity totalWeight ."
                ;
            grid-gap: 0;
            border: 1px solid rgba(0, 0, 0, 0.125);
            margin: 2px;
            border-radius: 8px;
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

        .gear-config-label
        {
            display: block;
            font-size: small;
            align-self: end;
            margin: 0;
            border-bottom: black solid thin;
            width: 100%;
        }

        .gear-config-description
        {
            grid-area: description;
        }

        .gear-weight-label
        {
            grid-area: label;
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

        .gear-days
        {
            grid-area: days;
        }

        .gear-distance
        {
            grid-area: distance;
        }

        .gear-config-title-bar
        {
            display: none;
        }

        .gear-config-group
        {
            display:grid;
            grid-template-columns: 1fr;
            grid-template-rows: min-content minmax(0, 1fr);
        }

        .gear-config-quantity
        {
            grid-area: quantity;
        }

        .gear-config-totalWeight
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

    .gear-item input:hover, .gear-config-item input:hover:not([readonly])
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
        <div class="gear-kits-title">Gear Configurations<button class='btn btn-link' data-add="gear-config"><i class='fas fa-plus gear-config-add'></i></button></div>
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
