let menu = {};
let subMenu = {};

function initializeContextMenu() {
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

    $(window).on('click', () => {
        if (menu.is(':visible')) {
            menu.hide();
        }

        if (subMenu.is(':visible')) {
            subMenu.hide();
        }
    });
}

function addMenuItem(menu, text, func) {
    const menuItem = $('<div></div>')
        .addClass('gear-select-item')
        .css('user-select', 'none')
        .text(text);

    menuItem.on('click', (event) => {
        func.call(menuItem, event);
    });

    menuItem.appendTo(menu);

    return menuItem;
}

function addSubMenuItem(menu, text, func, context) {
    return addMenuItem(menu, text, function (event) {
        showMenu.call(
            $(this), event, func, context,
            { left: $(this).offset().left + $(this).outerWidth(), top: $(this).offset().top },
            $(this),
        );
    });
}

function showMenu(event, createMenu, context, offset, parentMenuItem) {
    if (parentMenuItem === undefined) {
        if (menu && menu.is(':visible')) {
            menu.hide();
        }
    }

    if (subMenu.is(':visible')) {
        subMenu.hide();
    }

    createMenu(context)
        .css('left', offset.left)
        .css('top', offset.top)
        .show();

    event.stopPropagation();
}

function createGearListMenu(item, insert) {
    subMenu.empty();

    addMenuItem(subMenu, 'Add new gear inline', () => {
        item.find('input[name="name"]').val('');
        item.find('input[name="description"]').val('');
        item.find('input[name="weight"]').val('');
        item.find('input[name="unitOfMeasure"]').val('oz');

        item.removeData('gearItemId');

        subMenu.hide();

        item.delayedSave();
    });

    const gearList = $('#gear-inventory').children();

    gearList.forEach((gear) => {
        const values = getNamedValues($(gear));

        let itemText = values.name;

        if (values.description) {
            itemText += `, ${values.description}`;
        }

        if (values.weight) {
            itemText += `, ${values.weight}`;

            if (values.unitOfMeasure) {
                itemText += ` ${values.unitOfMeasure}`;
            }
        }

        addMenuItem(subMenu, itemText, () => {
            let row = item;
            if (insert) {
                row = newGearConfigItemRow(item.data('configId'), undefined, $(gear).data('id'));
                item.after(row);
            }

            setNamedValues(row, values);

            row.data('gearItemId', $(gear).data('id'));

            subMenu.hide();

            row.delayedSave();
        });
    });

    return subMenu;
}

function createConfigItemMenu(item) {
    menu.empty();

    addSubMenuItem(menu, 'Insert row', (item) => createGearListMenu(item, true),
        item);

    addSubMenuItem(menu, 'Change gear', (item) => createGearListMenu(item, false),
        item);

    addMenuItem(menu, 'Delete row', () => {
        if (item.data('timeoutId') !== undefined) {
            clearTimeout(item.data('timeoutId'));
            item.removeData('timeoutId');
        }

        if (item.data('id') !== undefined) {
            deleteConfigItem(item);
        }
        else {
            // Clear each of the input elements.
            item.find('input[name]').each(function () {
                $(this).val('');
            });
        }
    });

    return menu;
}

function deleteConfigItem(item) {
    $.ajax({
        url: `/gear/configuration/item/${item.data('id')}`,
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        type: 'DELETE',
        context: item,
    })
        .done(function () {
            const parent = $(this).parent();

            $(this).remove();

            // If there are no gear config items left then
            // add an empty one.
            // (a count of one means only the title row is left)
            if (parent.children().length === 1) {
                const nextRow = newGearConfigItemRow(item.data('configId'));
                parent.append(nextRow);
            }
        });
}

function newGearConfigItemRow(configId, itemId, gearItemId) {
}

function getNamedValues(item) {
    const record = {};

    item.find('[name]').each(function () {
        if ($(this).is(':checkbox')) {
            record[$(this).attr('name')] = $(this).prop('checked');
        }
        else {
            record[$(this).attr('name')] = $(this).val();
        }
    });

    return record;
}

function setNamedValues(row, item) {
    const entries = Object.entries(item);

    for (const [prop, value] of entries) {
        const element = row.find(`[name="${prop}"]`);

        if ($(element).is(':checkbox')) {
            element.prop('checked', value);
        }
        else {
            element.val(value);
        }
    }
}

function delayedSave(item, save) {
    if (item.data('timeoutId') !== undefined) {
        clearTimeout(item.data('timeoutId'));
    }

    item.data('timeoutId', setTimeout(() => {
        save();
    }, 3000));
}

function saveConfigItem(item) {
    item.removeData('timeoutId');

    const options = {
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        contentType: 'application/json',
        dataType: 'json',
    };

    if (item.data('id') === undefined) {
        options.url = '/gear/configuration/item';
        options.type = 'POST';
    }
    else {
        options.url = `/gear/configuration/item/${item.data('id')}`;
        options.type = 'PUT';
    }

    const record = getNamedValues(item);
    record.gear_configuration_id = item.data('configId');
    record.gear_item_id = item.data('gearItemId');
    options.data = JSON.stringify(record);

    console.log(`saving: ${options.data}`);

    $.ajax(options)
        .done((result) => {
            if (result.gear_item && result.gear_item.id) {
                if (item.data('gearItemId') === undefined) {
                // Inform all "gear-inventory" classes that the gear item has been updated.
                    $('.gear-inventory').trigger('gearItemAdded', result.gear_item);
                }
                else {
                // Inform all "gear-item" classes that the gear item has been updated.
                    $('.gear-item').trigger('gearItemUpdated', result.gear_item);
                }
            }

            setNamedValues(item, result);

            item.computeWeight();

            item.data('id', result.id);

            if (result.gear_item_id !== undefined) {
                item.data('gearItemId', result.gear_item_id);
            }
            else {
                item.removeData('gearItemId');
            }
        });
}

function updateList() {
    const listName = $(this).attr('list');

    if (listName) {
        const value = $(this).val();

        if (value !== '') {
            let found = false;

            $(`#${listName} option`).each(function () {
                if ($(this).attr('value') === value) {
                    found = true;

                    return false;
                }
            });

            if (!found) {
                $(`#${listName}`).append(`<option value = ${value}>`);
            }
        }
    }
}

function forwardTabEventHandler(event, row, addNewRow) {
    if (event.keyCode === 9 && !event.shiftKey) {
        event.preventDefault();

        let nextRow = row.next();

        if (nextRow.length === 0) {
            let currentEmpty = true;

            row.find('input').each(function () {
                const value = $(this).val();

                if (value !== '') {
                    currentEmpty = false;

                    return false;
                }
            });

            if (!currentEmpty) {
                nextRow = addNewRow();
            }
        }

        if (nextRow.length !== 0) {
            const firstInput = nextRow.find('input:first-of-type');

            if (firstInput.length > 0) {
                firstInput[0].focus();
            }
        }
    }
}

function reverseTabEventHandler(event) {
    if (event.keyCode === 9 && event.shiftKey) {
        const prev = $(this).prev();

        if (prev.length === 0) {
            event.preventDefault();

            const prevRow = $(this).parent().prev();

            if (prevRow.length !== 0) {
                const lastInput = prevRow.find(':input').last();

                if (lastInput) {
                    lastInput.focus();
                }
            }
        }
    }
}

function saveGearItem(item) {
    item.removeData('timeoutId');

    const record = getNamedValues(item);

    const options = {
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(record),
    };

    if (item.data('id') === undefined) {
        options.url = '/gear/item';
        options.type = 'POST';
    }
    else {
        options.url = `/gear/item/${item.data('id')}`;
        options.type = 'PUT';
    }

    console.log(`saving: ${options.data}`);

    $.ajax(options)
        .done((result) => {
            setNamedValues(item, result);

            if (item.data('id') === undefined) {
                item.data('id', result.id);
            }
            else {
            // Inform all "gear-item" classes that the gear item has been updated.
                $('.gear-item').not(item).trigger('gearItemUpdated', result);
            }
        });
}

function createGearItemMenu(item) {
    menu.empty();

    addMenuItem(menu, 'Add to Configuration', () => {
        const gearConfig = $('#gear-kits .collapse.show');

        const configItem = newGearConfigItemRow(gearConfig.data('id'), undefined, item.data('id'));

        const values = getNamedValues(item);

        setNamedValues(configItem, values);

        gearConfig.append(configItem);

        menu.hide();

        configItem.delayedSave();
    });

    addMenuItem(menu, 'Delete Gear', () => {
        $.ajax({
            url: `/gear/item/${item.data('id')}`,
            headers:
                {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            type: 'DELETE',
        })
            .done(() => {
                item.remove();

                // Inform all gear config items that this gear item has been deleted
                $('.gear-config-item').trigger('gearItemDeleted', item.data('id'));
            });
    });

    return menu;
}

function newGearItem() {
    const row = $('<div></div>').addClass('gear-item').addClass('bpp-shadow');

    $('<i class="fas fa-grip-lines" style="opacity:0.2">').css('align-self', 'center').addClass('drag-handle').appendTo(row);

    $('<i class="fas fa-caret-down"></i>')
        .css('align-self', 'center')
        .addClass('gear-menu')
        .on('click', function (event) {
            showMenu.call(
                $(this), event, createGearItemMenu, row,
                { left: $(this).offset().left, top: $(this).offset().top + $(this).outerHeight() }
            );
        })
        .appendTo(row);

    // Name
    const name = $('<div></div>').addClass('gear-name gear-config-group').appendTo(row);
    $('<label></label>').text('Name').addClass('gear-config-label').appendTo(name);
    $('<input type="text" name="name" placeholder="Name"/>').addClass('gear-item-field').appendTo(name);

    // Description
    const description = $('<div></div>').addClass('gear-config-description gear-config-group').appendTo(row);
    $('<label></label>').text('Description').addClass('gear-config-label').appendTo(description);
    $('<input type="text" name="description" placeholder="Description"/>').addClass('gear-item-field').addClass('gear-description').appendTo(description);

    // Consumable
    const consumable = $('<div></div>').addClass('gear-config-consumable gear-config-check-group').appendTo(row);
    $('<label></label>').html('<i class="fas fa-utensils">').addClass('gear-config-label').appendTo(consumable);
    $('<input type="checkbox" name="consumable"/>').appendTo(consumable);

    // System
    const system = $('<div></div>').addClass('gear-system gear-config-group').appendTo(row);
    $('<label></label>').text('System').addClass('gear-config-label').appendTo(system);
    $('<input type="text" name="system" placeholder="System" list="gear-system"/>').addClass('dyna-list').appendTo(system);

    // Weight
    const weight = $('<div></div>').addClass('gear-weight').appendTo(row);
    $('<label></label>').text('Weight').addClass('gear-weight-label gear-config-label').addClass('gear-number')
        .appendTo(weight);
    $('<input style="min-width:0" type="text" name="weight" placeholder="Weight"/>').addClass('gear-number gear-item-field').appendTo(weight);

    const select = $('<select name="unitOfMeasure"></select>').addClass('gear-item-field').appendTo(weight);
    select.append('<option value="oz">oz</option>');
    select.append('<option value="lb">lb</option>');
    select.append('<option value="g">g</option>');
    select.append('<option value="kg">kg</option>');

    // Days
    const days = $('<div></div>').addClass('gear-days gear-config-group').appendTo(row);
    $('<label></label>').text('Days').addClass('gear-config-label gear-number').appendTo(days);
    $('<div/>').addClass('gear-item-field gear-number').appendTo(days);

    // Distance
    const distance = $('<div></div>').addClass('gear-distance gear-config-group').appendTo(row);
    $('<label></label>').text('Distance').addClass('gear-config-label gear-number').appendTo(distance);
    $('<div/>').addClass('gear-item-field gear-number').appendTo(distance);

    // Add event handlers

    $.extend(row, {
        delayedSave() {
            delayedSave(row, () => {
                saveGearItem(row);
            });
        },
    });

    row.find('[name]').on('input', () => {
        row.delayedSave();
    });

    row.find(':input').first().on('keydown', reverseTabEventHandler);

    row.find(':input').last().on('keydown', () => {
        forwardTabEventHandler(event, row, () => {
            const nextRow = newGearItem();
            row.after(nextRow);

            return nextRow;
        });
    });

    row.find('.gear-item-field').on('input', () => {
        if (row.data('id') !== undefined) {
            const record = getNamedValues(row);
            record.id = row.data('id');

            $('.gear-config-item').not(row).trigger('gearItemUpdated', record);
        }
    });

    row.on('gearItemUpdated', (_event, item) => {
        if (item.id !== undefined && item.id === row.data('id')) {
            setNamedValues(row, item);
        }
    });

    row.draggable(
        {
            opacity: 0.7,
            helper: 'clone',
            handle: '.drag-handle',
            zIndex: 100,
            start(_event, ui) {
                ui.helper.data('id', row.data('id'));
            },
        },
    );

    $('#gear-inventory').append(row);

    return row;
}

function loadGearItem(item) {
    const row = newGearItem();

    row.data('id', item.id);

    setNamedValues(row, item);
}

function addGearConfiguration() {
    $.ajax({
        url: '/gear/configuration',
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json',
    })
        .done((configuration) => {
            $('#gear-kits .collapse').collapse('hide');

            const card = loadGearConfiguration(configuration);

            card.find('.collapse').addClass('show');
        });
}

export {
    initializeContextMenu,
    addGearConfiguration,
    loadGearItem,
    showMenu,
    createConfigItemMenu,
};
