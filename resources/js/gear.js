"use strict";

function newGearItemRow (configId, itemId, gearItemId)
{
    let item = $('<div class="gear-item"></div>');
    
    // Add divs for adding a row.
    item.append('<div><div></div><div></div></div>');
    
    item.append('<input type="text" name="name" placeholder="Name"/>');
    item.append('<input type="text" name="description" placeholder="Description"/>');
    
    let weight = $('<div style="display:grid;grid-template-columns:1fr min-content"></div>');
    weight.append ('<input class="gear-number" style="min-width:0" type="text" name="weight" placeholder="Weight"/>');
    
    let select = $('<select name="unit_of_measure"></select>');
    select.append('<option value="oz">oz</option>');
    select.append('<option value="lb">lb</option>');
    select.append('<option value="g">g</option>');
    select.append('<option value="kg">kg</option>');

    weight.append(select);
    
    item.append(weight);

    item.append('<input class="gear-number" type="text" min="0" name="quantity" placeholder="Quantity"/>');
    item.append('<div class="gear-number"/>');
    item.append('<input class="dyna-list" list="gear-system" type="text" name="system" placeholder="System"/>');
    item.append('<input type="text" name="location" placeholder="Location" list="gear-location"/>');

    // Add event handlers
    
    let configItem = {item: item, configId: configId, itemId: itemId, gearItemId: gearItemId};

    let firstInput = item.find('input:first-of-type').first();
    let lastInput = item.find('input:last-of-type').last();
    
    firstInput.on('keydown', reverseTabEventHandler);
    lastInput.on('keydown', function () { forwardTabEventHandler (event, configItem); } );
    item.find('.dyna-list').on('blur', updateList);
    item.find('[name]').on('input', function () { delayedSaveRecord(configItem); });

    return item;
}


function delayedSaveRecord (configItem)
{
    if (configItem.timeoutId !== undefined)
    {
        clearTimeout (configItem.timeoutId);
    }
    
    configItem.timeoutId = setTimeout(() => { saveRecord (configItem); }, 3000);
}


function saveRecord (configItem)
{
    configItem.timeoutId = undefined;

    let record = {gear_configuration_id: configItem.configId};
    
    configItem.item.find ('[name]').each (function ()
        {
            let value = $(this).val ();
            let name = $(this).attr("name");
            
            record[name] = value;
        });
    
    let options = {
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        dataType: "json"
    };
    
    if (configItem.itemId === undefined)
    {
        options.url = "/gear/configuration/item";
        options.type = "POST";
    }
    else
    {
        options.url = "/gear/configuration/item/" + configItem.itemId;
        options.type = "PUT";
    }
    
    record.gear_item_id = configItem.gearItemId;

    options.data = JSON.stringify(record);

    console.log ('saving: ' + options.data);

    $.ajax(options)
    .done (function(result)
    {
        configItem.itemId = result.id;
        configItem.gearItemId = result.gear_item_id;
        
        console.log ('saved: ' + JSON.stringify(result));
    });
}


function updateList (event)
{
    let listName = $(this).attr("list");
    
    if (listName)
    {
        let value = $(this).val ();
        
        if (value !== '')
        {
            let found = false;
            
            $("#" + listName + " option").each (function ()
                {
                    if ($(this).attr("value") === value)
                    {
                        found = true;
                        
                        return false;
                    }
                });
            
            if (!found)
            {
                $("#" + listName).append("<option value = " + value + ">");
            }
        }
    }
}


function forwardTabEventHandler (event, configItem)
{
    if (event.keyCode === 9 && !event.shiftKey)
    {
        event.preventDefault ();
        
        let nextRow = configItem.item.next ();
        
        if (nextRow.length === 0)
        {
            let currentEmpty = true;
            
            configItem.item.find ('input').each (function ()
                {
                    let value = $(this).val ();
                    
                    if (value !== '')
                    {
                        currentEmpty = false;
                        
                        return false;
                    }
                });
            
            if (!currentEmpty)
            {
                nextRow = newGearItemRow(configItem.configId);
                configItem.item.after(nextRow);
            }
        }

        if (nextRow.length !== 0)
        {
            let firstInput = nextRow.find('input:first-of-type');
            
            if (firstInput.length > 0)
            {
                firstInput[0].focus ();
            }
        }
    }
}


function reverseTabEventHandler (event)
{
    if (event.keyCode === 9 && event.shiftKey)
    {
        let prev = $(this).prev ();
        
        if (prev.length === 0)
        {
            event.preventDefault ();
            
            let prevRow = $(this).parent ().prev ();
            
            if (prevRow.length != 0)
            {
                let lastInput = prevRow.find('input:last-of-type');
                
                if (lastInput)
                {
                    lastInput.focus ();
                }
            }
        }
    }
}


function loadGearConfiguration (configuration)
{
    let card = $('<div></div>').addClass('card');
    let cardHeader = $('<div style="padding:0"></div>').addClass('card-header').appendTo(card);
    let button = $('<button class="btn btn-link">' + configuration.name + '</button>').appendTo(cardHeader);
    button.attr('data-toggle', 'collapse');
    button.attr('data-target', '#gearCollapse' + configuration.id);
    
    let del = $('<a><i class="fas fa-trash-alt"></i></a>').appendTo(cardHeader);
    del.on('click', function ()
        {
            $.ajax ({
                url: "/gear/configuration/" + configuration.id,
                headers:
                {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
                },
                type: "DELETE",
                context: this
            })
            .done (function ()
                {
                    $(this).parents('.card').remove ();
                });
        });

    let collapse = $('<div class="collapse"></div>').appendTo(card);
    collapse.attr('id', 'gearCollapse' + configuration.id);
    collapse.attr('data-parent', '#gear-kits');

    let gearItem = $('<div class="gear-item"></div>').appendTo(collapse);
    gearItem.append('<div></div>');
    gearItem.append('<div class="gear-title">Item Name</div>');
    gearItem.append('<div class="gear-title">Description</div>');
    gearItem.append('<div class="gear-title gear-number">Weight</div>');
    gearItem.append('<div class="gear-title gear-number">Quantity</div>');
    gearItem.append('<div class="gear-title gear-number">Total Weight</div>');
    gearItem.append('<div class="gear-title">System</div>');
    gearItem.append('<div class="gear-title">Location</div>');

    if (configuration.gear_configuration_items && configuration.gear_configuration_items.length > 0)
    {
        for (let configItem of configuration.gear_configuration_items)
        {
            let gearItemId = undefined;
            
            if (configItem.gear_item)
            {
                gearItemId = configItem.gear_item.id;
            }
            
            let row = newGearItemRow(configuration.id, configItem.id, gearItemId);

            let entries = Object.entries(configItem);

            for (const [prop, value] of entries)
            {
                row.find('[name="' + prop + '"').val(value);
            }

            if (configItem.gear_item)
            {
                let entries = Object.entries(configItem.gear_item);
                
                for (const [prop, value] of entries)
                {
                    row.find('[name="' + prop + '"').val(value);
                }
            }
            
            gearItem.after(row);
        }
    }
    else
    {
        let nextRow = newGearItemRow(configuration.id);
        gearItem.after(nextRow);
    }

    $('#gear-kits').append(card);
    
    return card;
}


function addGearConfiguration ()
{
    $.ajax ({
        url: "/gear/configuration",
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        type: "POST",
        dataType: "json"
    })
    .done (function (configuration)
        {
            $("#gear-kits .collapse").collapse('hide');
            
            let card = loadGearConfiguration (configuration);
            
            card.find('.collapse').addClass('show');
        });
}


$().ready (function ()
    {
        $("[data-add='gear-config']").on('click', addGearConfiguration);
        
        $.getJSON("/gear/configuration")
        .done (function (configurations)
            {
                for (let configuration of configurations)
                {
                    loadGearConfiguration (configuration);
                }
            });
    });
