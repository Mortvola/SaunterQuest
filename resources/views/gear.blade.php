@extends('layouts.app')


@section('content')
	<div class="row no-gutters" style="height:100%">
        <div class="col-md-6" style="overflow-y:scroll;height:100%">
            <table id="bs-table">
            </table>
        </div>
    </div>

    <script>
    "use strict";

    $('#bs-table').bootstrapTable({
        cellInputEnabled: true,
        columns: [{
          field: 'system',
          title: 'System',
          cellInputEnabled: true,
          cellInputType: 'select',
          cellInputSelectOptinons: [
              {text: '', value: '', disabled: true, default: true},
              {text: 'Sleep', value: 'sleep', disabled: false},
              {text: 'Cook', value: 'cook', disabled: false},
              {text: 'Electronics', value: 'electronics', disabled: false},
              {text: 'Hygiene', value: 'hygiene', disabled: false},
              {text: 'Navigation', value: 'navigation', disabled: false},
              {text: 'Pack', value: 'pack', disabled: false},
              {text: 'Rain', value: 'rain', disabled: false},
              {text: 'Shelter', value: 'shelter', disabled: false},
              {text: 'Sleep', value: 'sleep', disabled: false},
              {text: 'Snow', value: 'snow', disabled: false},
              {text: 'Sun/Bugs', value: 'sun-bugs', disabled: false},
              {text: 'Water', value: 'water', disabled: false},
          ],
        }, {
          field: 'description',
          title: 'Description',
          cellInputEnabled: true,
          cellInputType: 'text',
        }, {
          field: 'brand',
          title: 'Brand',
          cellInputEnabled: true,
          cellInputType: 'text',
        }, {
          field: 'quantity',
          title: 'Quantity',
          cellInputEnabled: true,
          cellInputType: 'text',
        },{
          field: 'unit_weight',
          title: 'Weight',
          cellInputEnabled: true,
          cellInputType: 'text',
        }],
        data: [{
          system: 'sleep',
          description: 'Item 1',
          brand: 'Zpacks',
          quantity: 1,
          unit_weight: 16.5,
        }, {
          id: 2,
          name: 'Item 2',
          price: '$2'
        }, {
            id: 3,
            name: 'Item 2',
            price: '$2'
          }, {
              id: 4,
              name: 'Item 2',
              price: '$2'
            }, {
                id: 5,
                name: 'Item 2',
                price: '$2'
              }]
      })
    </script>
@endsection
