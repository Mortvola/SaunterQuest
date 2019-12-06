@extends('layouts.app')

<style>
    .gear-main
    {
        display: grid;
        grid-template-rows: 1fr;
        grid-template-columns: 2fr 3fr;
        grid-template-areas:
            "inventory kits"
            ;
    }

    .gear-inventory
    {
        grid-area: inventory;
        place-self: start stretch;

        display: flex;
        flex-direction: column;

        margin-right: 14px;
    }

    .gear-kits
    {
        grid-area: kits;
        place-self: stretch stretch;

        margin-right: 14px;
    }

    .gear-list
    {
        list-style: none;
    }

    .gear-item
    {
        display: grid;
        grid-template-columns: 14px 14px 1fr 2fr 100px 50px 75px;
        grid-gap: 4px;
    }

    .gear-config-item
    {
        display: grid;
        grid-template-columns: 14px 1fr 2fr 100px 100px 100px 150px 1fr;
        grid-gap: 4px;
    }

    .gear-title
    {
        padding:1px;
        margin:2px;
        border-bottom-style: solid;
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

@section('content')
	<div class="gear-main">
        <div class="gear-inventory" id="gear-inventory">
            <div class="gear-item">
                <div></div>
                <div></div>
                <div class="gear-title">Item Name</div>
                <div class="gear-title">Description</div>
                <div class="gear-title gear-number">Weight</div>
                <div class="gear-title gear-number">Days</div>
                <div class="gear-title gear-number">Mileage</div>
            </div>
        </div>
        <div class="gear-kits" id="gear-kits">
            <div><button class='btn btn-link' data-add="gear-config">Add Gear Configuration <i class='fas fa-plus'></i></button></div>

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
