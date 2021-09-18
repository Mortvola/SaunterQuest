'use strict';

function selectGearConfigDialog(gearConfigId, save) {
  $.getJSON('/gear/configuration')
    .done((configurations)
        => {
      let form = $('#changeGearDialog form');

      form.empty();

      let container = $('<div></div>').appendTo(form);

      for (const configuration of configurations) {
        let label = $('<label></label>')
          .css('display', 'block')
          .text(configuration.name)
          .appendTo(container);

        let radio = $('<input></input>')
          .attr('type', 'radio')
          .attr('name', 'config')
          .attr('value', configuration.id)
          .css('vertical-align', 'bottom')
          .css('margin-right', '4px')
          .prependTo(label);

        if (configuration.id == gearConfigId) {
          radio.prop('checked', true);
        }
      }
    });

  $('#changeGearDialog form').off('submit');
  $('#changeGearDialog form').submit(function (event) {
    event.preventDefault();

    let data = new FormData(this);

    for (const entry of data) {
      if (entry[0] == 'config') {
        save(parseInt(entry[1]));

        break;
      }
    }

    $('#changeGearDialog').modal('hide');
  });

  $('#changeGearDialog').modal('show');
}

function addConfigCard(config, container) {
  let card = $('<div></div>').addClass('card').appendTo(container);

  $('<div></div>').addClass('card-header').text(config.name).appendTo(card);

  let body = $('<div></div>').addClass('gear-card-body').appendTo(card);

  for (const configItem of config.gear_configuration_items) {
    $('<div></div>').text(configItem.gear_item.name).appendTo(body);
  }
}

function getGearConfiguration(gearConfigId, container) {
  $.getJSON('/gear/configuration/' + gearConfigId)
    .done((config)
    => {
      config.gear_configuration_items = config.gear_configuration_items.sort((a, b) => {
 return a.gear_item.name.localeCompare(b.gear_item.name)
});

      addConfigCard(config, container);
    });
}

$().ready(()
=> {
  if (hike.gearConfigId !== undefined) {
    $('#setInitialGearConfig').text('Change');
  }

  $('#setInitialGearConfig').on('click', ()
    => {
    selectGearConfigDialog(hike.gearConfigId, (gearConfigId)
        => {
            $.ajax({
        url: hike.id,
        contentType: 'application/json',
        type: 'PUT',
        data: JSON.stringify({ gearConfigId: gearConfigId }),
      })
        .done(()
            => {
          hike.gearConfigId = gearConfigId;

          $('#initialGearConfig').empty();

          getGearConfiguration(hike.gearConfigId, '#initialGearConfig');
        });
    });
  });

  $('a[data-toggle="tab"][href="#equipment"]').on('click', function () {
    $(this).off('click');

    if (hike.gearConfigId) {
      getGearConfiguration(hike.gearConfigId, '#initialGearConfig');
    }
  });

  $(document).on('routeUpdated', ()
        => {
    $('#gearConfigChanges').empty();

    for (const w of route.waypoints) {
      getGearConfiguration(w.gearConfigId, '#gearConfigChanges');
    }
  });
});
