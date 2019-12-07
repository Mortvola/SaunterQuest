"use strict";

let menu = {};
let subMenu = {};

function initializeContextMenu ()
{
    menu = $('<div></div>')
    .css('position', 'absolute')
    .css('background-color', 'white')
    .css('border', 'thin solid')
    .hide()
    .appendTo('body');

    subMenu = $('<div></div>')
    .css('position', 'absolute')
    .css('background-color', 'white')
    .css('border', 'thin solid')
    .hide()
    .appendTo('body');

    $(window).on('click', function ()
        {
            if (menu.is(':visible'))
            {
                menu.hide ();
            }
            
            if (subMenu.is(':visible'))
            {
                subMenu.hide ();
            }
        });
}


function addMenuItem (menu, text, func)
{
    let menuItem = $("<div></div>")
        .addClass('gear-select-item')
        .css('user-select', 'none')
        .text(text);
    
    menuItem.on('click', function (event)
        {
            func.call(menuItem, event);
        });
    
    menuItem.appendTo(menu);
    
    return menuItem;
}


function addSubMenuItem(menu, text, func, context)
{
    return addMenuItem (menu, text, function (event)
        {
            showMenu.call($(this), event, func, context, {left: $(this).offset ().left + $(this).outerWidth (), top: $(this).offset ().top}, $(this));
        });
}

function showMenu (event, createMenu, context, offset, parentMenuItem)
{
    if (parentMenuItem === undefined)
    {
        if (menu && menu.is(':visible'))
        {
            menu.hide ();
        }
    }
    
    if (subMenu.is(':visible'))
    {
        subMenu.hide ();
    }
    
    createMenu (context)
        .css('left', offset.left)
        .css('top', offset.top)
        .show ();

    event.stopPropagation ();
}


function createGearListMenu (item, insert)
{
    subMenu.empty ();

    addMenuItem (subMenu, "Add new gear inline", function ()
        {
            item.find('input[name="name"]').val("");
            item.find('input[name="description"]').val("");
            item.find('input[name="weight"]').val("");
            item.find('input[name="unit_of_measure"]').val("oz");
            
            item.removeData('gearItemId')
            
            subMenu.hide ();
            
            item.delayedSave ();
        });
    
    let gearList = $("#gear-inventory").children ();
    
    for (let gear of gearList)
    {
        let values = getNamedValues($(gear));
        
        let itemText = values.name;
        
        if (values.description)
        {
            itemText += ", " + values.description;
        }
        
        if (values.weight)
        {
            itemText += ", " + values.weight;

            if (values.unit_of_measure)
            {
                itemText += " " + values.unit_of_measure;
            }
        }
        
        addMenuItem (subMenu, itemText, function ()
            {
                let row = item;
                if (insert)
                {
                    row = newGearConfigItemRow (item.data('configId'), undefined, $(gear).data('id'));
                    item.after(row);
                }

                setNamedValues (row, values);
            
                row.data('gearItemId', $(gear).data('id'));
            
                subMenu.hide ();
            
                row.delayedSave ();
            });
    }
    
    return subMenu;
}


function createConfigItemMenu (item)
{
    menu.empty ();

    addSubMenuItem (menu, 'Insert row', function (item)
        {
            return createGearListMenu (item, true);
        },
        item);

    addSubMenuItem (menu, 'Change gear', function (item)
        {
            return createGearListMenu (item, false);
        },
        item);

    addMenuItem (menu, 'Delete row', function ()
        {
            if (item.data('timeoutId') !== undefined)
            {
                clearTimeout (item.data('timeoutId'));
                item.removeData('timeoutId');
            }

            if (item.data('id') !== undefined)
            {
                deleteConfigItem (item);
            }
            else
            {
                // Clear each of the input elements.
                item.find ('input[name]').each (function ()
                    {
                        $(this).val ('');
                    });
            }
        });
    
    return menu;
}


function deleteConfigItem (item)
{
    $.ajax ({
        url: "/gear/configuration/item/" + item.data('id'),
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE",
        context: item
    })
    .done (function ()
        {
            let parent = $(this).parent ();
            
            $(this).remove ();
            
            // If there are no gear config items left then
            // add an empty one.
            // (a count of one means only the title row is left)
            if (parent.children().length == 1)
            {
                let nextRow = newGearConfigItemRow(item.data('configId'));
                parent.append(nextRow);
            }
        });
}


function newGearConfigItemRow (configId, itemId, gearItemId)
{
    let item = $('<div></div>').addClass('gear-config-item');
    
    item.data('id', itemId);
    item.data('configId', configId);
    item.data('gearItemId', gearItemId);
    
    $('<i class="fas fa-caret-down"></i>')
        .css('align-self', 'center')
        .on('click', function (event)
        {
            showMenu.call($(this), event, createConfigItemMenu, item, {left: $(this).offset().left, top: $(this).offset().top + $(this).outerHeight ()});
        })
        .appendTo(item);
    
    $('<input type="text" name="name" placeholder="Name"/>').addClass('gear-name').addClass('gear-item-field').appendTo(item);
    $('<input type="text" name="description" placeholder="Description"/>').addClass('gear-description').addClass('gear-item-field').appendTo(item);
    
    let weight = $('<div></div>').addClass('gear-weight');
    $('<div></div>').text('Weight:').appendTo(weight);
    $('<input style="min-width:0" type="text" name="weight" placeholder="Weight"/>').addClass('gear-number gear-item-field').appendTo(weight);
    
    let select = $('<select name="unit_of_measure"></select>').addClass('gear-item-field');
    select.append('<option value="oz">oz</option>');
    select.append('<option value="lb">lb</option>');
    select.append('<option value="g">g</option>');
    select.append('<option value="kg">kg</option>');

    weight.append(select);
    
    item.append(weight);

    let quantity = $('<div></div>').addClass('gear-config-quantity');
    $('<div></div>').text('Quantity:').appendTo(quantity);
    $('<input type="text" min="0" name="quantity" placeholder="Quantity"/>').addClass('gear-number').appendTo(quantity);
    quantity.appendTo(item);
    
    let totalWeight = $('<div></div>').addClass('gear-config-totalWeight-group');
    $('<div></div>').text('Total:').appendTo(totalWeight);
    $('<div/>').addClass('gear-config-totalWeight').addClass('gear-number').appendTo(totalWeight);
    totalWeight.appendTo(item);
    
    $('<input type="text" name="system" placeholder="System" list="gear-system"/>').addClass('dyna-list').addClass('gear-config-system').appendTo(item);
    $('<input type="text" name="location" placeholder="Location" list="gear-location"/>').addClass('gear-config-location').appendTo(item);

    $.extend(item, {delayedSave: function () { delayedSave(item, function () { saveConfigItem(item); }); } });
    
    $.extend(item, {computeWeight: function ()
        {
            let totalWeight = item.find('[name="weight"]').val () * item.find('[name="quantity"]').val ();
            
            let units = item.find('[name="unit_of_measure"]').val ();
            
            switch (units)
            {
                case 'oz':
                    
                    totalWeight *= 0.0625;
                    break;
                    
                case 'g':
                    
                    totalWeight *= 0.0022;
                    break;
                    
                case 'kg':
                    
                    totalWeight *= 2.20462;
                    break;
            }
            
            item.find('.gear-config-totalWeight').text(totalWeight.toLocaleString(undefined, {maximumFractionDigits: 4}));
        }});

    // Add event handlers

    item.find('[name="weight"]').on('input', function ()
        {
            item.computeWeight ();
        });
    
    item.find('[name="quantity"]').on('input', function ()
        {
            item.computeWeight ();
        });

    item.find('[name="unit_of_measure"]').on('input', function ()
        {
            item.computeWeight ();
        });

    item.find(':input').first().on('keydown', reverseTabEventHandler);
    
    item.find(':input').last().on('keydown', function ()
        {
            forwardTabEventHandler (event, item, function ()
            {
                let nextRow = newGearConfigItemRow(item.data('configId'));
                item.after(nextRow);
                
                return nextRow;
            });
        });
    
    item.find('.dyna-list').on('blur', updateList);
    item.find('[name]').on('input', function () { item.delayedSave (); });

    item.find('.gear-item-field').on('input', function ()
        {
            if (item.data('gearItemId') !== undefined)
            {
                let record = getNamedValues(item);
                record.id = item.data('gearItemId');
            
                $('.gear-item').trigger ('gearItemUpdated', record);
            }
        });
    
    item.on('gearItemDeleted', function (event, gearItemId)
        {
            if (item.data('gearItemId') == gearItemId)
            {
                deleteConfigItem (item);
            }
        });
    
    item.on('gearItemUpdated', function (event, gearItem)
        {
            if (gearItem.id !== undefined && gearItem.id === item.data('gearItemId'))
            {
                let entries = Object.entries(gearItem);

                for (const [prop, value] of entries)
                {
                    $(this).find('.gear-item-field[name="' + prop + '"]').val(value);
                }
            }
        });
    
    return item;
}


function getNamedValues (item)
{
    let record = {};
    
    item.find ('[name]').each (function ()
        {
            record[$(this).attr("name")] = $(this).val ();
        });
    
    return record;
}


function setNamedValues (row, item)
{
    let entries = Object.entries(item);

    for (const [prop, value] of entries)
    {
        row.find('[name="' + prop + '"]').val(value);
    }
}


function delayedSave (item, save)
{
    if (item.data('timeoutId') !== undefined)
    {
        clearTimeout (item.data('timeoutId'));
    }
    
    item.data('timeoutId', setTimeout(() => { save (); }, 3000));
}


function saveConfigItem (item)
{
    item.removeData('timeoutId');

    let options = {
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        dataType: "json"
    };
    
    if (item.data('id') === undefined)
    {
        options.url = "/gear/configuration/item";
        options.type = "POST";
    }
    else
    {
        options.url = "/gear/configuration/item/" + item.data('id');
        options.type = "PUT";
    }

    let record = getNamedValues(item);
    record.gear_configuration_id = item.data('configId');
    record.gear_item_id = item.data('gearItemId');
    options.data = JSON.stringify(record);

    console.log ('saving: ' + options.data);

    $.ajax(options)
    .done (function(result)
    {
        if (result.gear_item && result.gear_item.id)
        {
            if (item.data('gearItemId') === undefined)
            {
                // Inform all "gear-inventory" classes that the gear item has been updated.
                $('.gear-inventory').trigger ('gearItemAdded', result.gear_item);
            }
            else
            {
                // Inform all "gear-item" classes that the gear item has been updated.
                $('.gear-item').trigger ('gearItemUpdated', result.gear_item);
            }
        }

        setNamedValues (item, result);

        item.computeWeight ();

        item.data('id', result.id);
        
        if (result.gear_item_id !== undefined)
        {
            item.data('gearItemId', result.gear_item_id);
        }
        else
        {
            item.removeData('gearItemId');
        }
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


function forwardTabEventHandler (event, row, addNewRow)
{
    if (event.keyCode === 9 && !event.shiftKey)
    {
        event.preventDefault ();
        
        let nextRow = row.next ();
        
        if (nextRow.length === 0)
        {
            let currentEmpty = true;
            
            row.find ('input').each (function ()
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
                nextRow = addNewRow ();
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
                let lastInput = prevRow.find(':input').last ();
                
                if (lastInput)
                {
                    lastInput.focus ();
                }
            }
        }
    }
}


function saveGearItem (item)
{
    item.removeData('timeoutId');

    let record = getNamedValues(item);

    let options = {
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(record)
    };
    
    if (item.data('id') === undefined)
    {
        options.url = "/gear/item";
        options.type = "POST";
    }
    else
    {
        options.url = "/gear/item/" + item.data('id');
        options.type = "PUT";
    }

    console.log ('saving: ' + options.data);

    $.ajax(options)
    .done (function(result)
    {
        setNamedValues (item, result);

        if (item.data('id') === undefined)
        {
            item.data('id', result.id);
        }
        else
        {
            // Inform all "gear-item" classes that the gear item has been updated.
            $('.gear-item').not(item).trigger ('gearItemUpdated', result);
        }
    });
}


function createGearItemMenu (item)
{
    menu.empty ();
    
    addMenuItem (menu, "Add to Configuration", function ()
        {
            let gearConfig = $("#gear-kits .collapse.show");
            
            let configItem = newGearConfigItemRow (gearConfig.data('id'), undefined, item.data('id'));
            
            let values = getNamedValues(item);

            setNamedValues (configItem, values);
            
            gearConfig.append(configItem);

            menu.hide ();
            
            configItem.delayedSave ();
        });

    addMenuItem (menu, "Delete Gear", function ()
        {
            $.ajax ({
                url: "/gear/item/" + item.data('id'),
                headers:
                {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
                },
                type: "DELETE",
            })
            .done (function ()
                {
                   item.remove ();
              
                  // Inform all gear config items that this gear item has been deleted
                  $('.gear-config-item').trigger ('gearItemDeleted', item.data('id'));
                });
        });

    return menu;
}

function newGearItem ()
{
    let row = $('<div></div>').addClass('gear-item');
    
    $('<i class="fas fa-grip-lines" style="opacity:0.2">').css('align-self', 'center').addClass("drag-handle").appendTo(row);
    
    $('<i class="fas fa-caret-down"></i>')
        .css('align-self', 'center')
        .addClass('gear-menu')
        .on('click', function (event)
        {
            showMenu.call($(this), event, createGearItemMenu, row, {left: $(this).offset().left, top: $(this).offset().top + $(this).outerHeight ()});
        })
        .appendTo(row);
    
    $('<input type="text" name="name" placeholder="Name"/>').addClass('gear-item-field').addClass('gear-name').appendTo(row);
    $('<input type="text" name="description" placeholder="Description"/>').addClass('gear-item-field').addClass('gear-description').appendTo(row);
    
    let weight = $('<div></div>').addClass('gear-weight').appendTo(row);
    $('<input style="min-width:0" type="text" name="weight" placeholder="Weight"/>').addClass('gear-number gear-item-field').appendTo(weight);
    
    let select = $('<select name="unit_of_measure"></select>').addClass('gear-item-field').appendTo(weight);
    select.append('<option value="oz">oz</option>');
    select.append('<option value="lb">lb</option>');
    select.append('<option value="g">g</option>');
    select.append('<option value="kg">kg</option>');

    // Add event handlers
    
    $.extend(row, {delayedSave: function () { delayedSave(row, function () { saveGearItem (row); }); } });

    row.find('[name]').on('input', function () { row.delayedSave (); });

    row.find(':input').first().on('keydown', reverseTabEventHandler);
    
    row.find(':input').last().on('keydown', function ()
        {
            forwardTabEventHandler (event, row, function ()
            {
                let nextRow = newGearItem();
                row.after(nextRow);
                
                return nextRow;
            });
        });

    row.find('.gear-item-field').on('input', function ()
        {
            if (row.data('id') !== undefined)
            {
                let record = getNamedValues(row);
                record.id = row.data('id');
            
                $('.gear-config-item').not(row).trigger ('gearItemUpdated', record);
            }
        });

    row.on('gearItemUpdated', function (event, item)
        {
            if (item.id !== undefined && item.id === row.data('id'))
            {
                setNamedValues(row, item);
            }
        });

    row.draggable(
        {
            opacity: 0.7,
            helper: "clone",
            handle: ".drag-handle",
            zIndex: 100,
            start: function (event, ui)
            {
                ui.helper.data('id', row.data('id'));
            }
        });

    $('#gear-inventory').append(row);
    
    return row;
}


function loadGearItem (item)
{
    let row = newGearItem ();
    
    row.data('id', item.id);

    setNamedValues (row, item);
}


function loadGearConfiguration (configuration)
{
    let card = $('<div></div>').addClass('card');
    let cardHeader = $('<div style="padding:0"></div>').addClass('card-header').appendTo(card);
    let button = $('<button class="btn btn-link">' + configuration.name + '</button>').appendTo(cardHeader);
    button.attr('data-toggle', 'collapse');
    button.attr('data-target', '#gearCollapse' + configuration.id);
    
    let del = $('<i class="fas fa-trash-alt"></i>').appendTo(cardHeader);
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

    let collapse = $('<div class="collapse gear-drag-target"></div>').appendTo(card);
    collapse.attr('id', 'gearCollapse' + configuration.id);
    collapse.attr('data-parent', '#gear-kits');
    collapse.data('id', configuration.id);

    let gearItem = $('<div></div>').addClass("gear-config-item").addClass("gear-config-title-bar").appendTo(collapse);
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
            
            let row = newGearConfigItemRow(configuration.id, configItem.id, gearItemId);

            setNamedValues (row, configItem);

            if (configItem.gear_item)
            {
                setNamedValues (row, configItem.gear_item);
            }
            
            row.computeWeight ();
            
            gearItem.after(row);
        }
    }
    else
    {
        let nextRow = newGearConfigItemRow(configuration.id);
        gearItem.after(nextRow);
    }

    collapse.droppable(
        {
            accept: ".gear-item",
            drop: function (event, ui)
            {
                let row = newGearConfigItemRow(configuration.id, undefined, ui.helper.data('id'));
                let record = getNamedValues(ui.helper);

                setNamedValues (row, record);

                gearItem.after(row);
                event.stopPropagation ();
                
                row.delayedSave ();
            }
        });
    
    collapse.on('sortreceive', );
    
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
        initializeContextMenu ();

        $("[data-add='gear-config']").on('click', addGearConfiguration);
        
        $.getJSON("/gear/item")
        .done (function (items)
            {
                for (let item of items)
                {
                    loadGearItem (item);
                }
            });
        
        $('.gear-inventory').on('gearItemAdded', function (event, gearItem)
            {
                loadGearItem (gearItem);
            });

        $.getJSON("/gear/configuration")
        .done (function (configurations)
            {
                for (let configuration of configurations)
                {
                    loadGearConfiguration (configuration);
                }
            });
    });
