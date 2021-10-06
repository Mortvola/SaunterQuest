import Http from '@mortvola/http';

const resupplyLocationCM = {};
const resupplyUrl = 'https://maps.google.com/mapfiles/ms/micons/postoffice-us.png';

let resupplyLocations = [];

async function loadResupply(hikeId) {
  const response = await Http.get(`/api/hike/${hikeId}/resupplyPlan`);

  if (response.ok) {
    const resupplyPlan = JSON.parse(this.responseText);

    let txt = '';

    resupplyPlan.forEach((i) => {
      txt += "<div class='panel panel-default'>";

      txt += "<div class='panel-heading' style='padding:5px 5px 5px 5px'>";
      if (i === 0) {
        txt += '<div>Initial packed items</div>';
      }
      else {
        txt += '<div>Resupply</div>';
      }

      txt += '</div>';

      txt += '<div>Items</div>';

      resupplyPlan[i].items.sort((a, b) => a.name.localeCompare(b.name));

      resupplyPlan[i].items.forEach((j) => {
        let servingSize = 0;
        const words = resupplyPlan[i].items[j].servingDescription.split(' ');
        const r = /\d+\/\d+/;
        if (r.test(words[0])) {
          const ints = words[0].split('/');
          servingSize = parseFloat(ints[0]) / parseFloat(ints[1]);
        }
        else {
          servingSize = parseInt(words[0], 10);
        }
        words.splice(0, 1);
        const servingDescription = words.join(' ');

        txt += "<div class='resupply-grid' style='border-top:1px solid #f0f0f0'>";
        txt += `<div class='resupply-grid-item' style='padding-left:2px;padding-right:5px'>${resupplyPlan[i].items[j].name}</div>`;
        txt += `<div class='resupply-grid-item' style='padding-right:2px'>${parseInt(resupplyPlan[i].items[j].totalServings, 10) * servingSize} ${servingDescription}</div>`;
        txt += `<div class='resupply-grid-item' style='font-size:11px;padding-left:2px;padding-bottom:5px'>${resupplyPlan[i].items[j].manufacturer}</div>`;
        txt += '</div>';
      });

      txt += '</div>';
    });

    $('#resupply').html(txt);
  }
}

function insertResupplyLocation(position) {
  const resupplyLocation = objectifyForm($('#resupplyLocationForm').serializeArray());

  resupplyLocation.lat = position.lat();
  resupplyLocation.lng = position.lng();

  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      resupplyLocation.shippingLocationId = JSON.parse(this.responseText);

      resupplyLocation.marker = new google.maps.Marker({
        position: {
          lat: parseFloat(resupplyLocation.lat),
          lng: parseFloat(resupplyLocation.lng),
        },
        map,
        icon: {
          url: resupplyUrl,
        },
      });

      const markerIndex = 0; // todo: fix this, it shouldn't be zero.
      resupplyLocation.marker.addListener('rightclick', (event) => {
        resupplyLocationCM.open(map, event, markerIndex);
      });

      resupplyLocations.push(resupplyLocation);
    }
  };

  xmlhttp.open('POST', '/resupplyLocation.php', true);
  xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xmlhttp.send(`userHikeId=${userHikeId}\&resupplyLocation=${JSON.stringify(resupplyLocation)}`);
}

function addResupplyLocation(object, position) {
  $('#resupplyLocationSaveButton').off('click');
  $('#resupplyLocationSaveButton').click(() => {
    insertResupplyLocation(position);
  });

  $('#addResupplyLocation').modal('show');
}

async function retrieveResupplyLocations(hikeId, map) {
  const response = await Http.get(`/api/hike/${hikeId}/resupplyLocation`);
  if (response.ok) {
    resupplyLocations = await response.body();
    if (map) {
      resupplyLocations.forEach((r) => {
        // resupplyLocations[r].marker = new google.maps.Marker({
        //     position: {
        //         lat: parseFloat(r.lat),
        //         lng: parseFloat(r.lng),
        //     },
        //     map,
        //     icon: {
        //         url: resupplyUrl,
        //     },
        // });

        const { shippingLocationId } = r.id;
        r.marker.addListener('rightclick', (event) => {
          resupplyLocationCM.open(map, event, shippingLocationId);
        });

        if (r.address2 == null) {
          r.address2 = '';
        }

        // r.listener = attachInfoWindowMessage(resupplyLocations[r],
        //     `<div>${ resupplyLocations[r].name }</div>`
        //     + `<div>${ resupplyLocations[r].address1 }</div>`
        //     + `<div>${ resupplyLocations[r].address2 }</div>`
        //     + `<div>${ resupplyLocations[r].city }, ${ resupplyLocations[r].state } ${ resupplyLocations[r].zip }</div>`);
      });
    }
  }
}

function resupplyFromLocation(object, position) {
  const resupplyEvent = { userHikeId, shippingLocationId: object.shippingLocationId };

  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
    }
  };

  xmlhttp.open('POST', '/resupplyEvent.php', true);
  xmlhttp.setRequestHeader('Content-type', 'application/json');
  xmlhttp.send(JSON.stringify(resupplyEvent));
}

function findResupplyLocationIndex(shippingLocationId) {
  resupplyLocations.findIndex((h) => (
    resupplyLocations[h].shippingLocationId === shippingLocationId
  ));

  return -1;
}

function editResupplyLocation(object, position) {
  //
  // Find the resupply location using the shippingLocationId.
  //
  const h = findResupplyLocationIndex(object.shippingLocationId);

  if (h > -1) {
    $("input[name='name']").val(resupplyLocations[h].name);
    $("input[name='inCareOf']").val(resupplyLocations[h].inCareOf);
    $("input[name='address1']").val(resupplyLocations[h].address1);
    $("input[name='address2']").val(resupplyLocations[h].address2);
    $("input[name='city']").val(resupplyLocations[h].city);
    $("input[name='state']").val(resupplyLocations[h].state);
    $("input[name='zip']").val(resupplyLocations[h].zip);

    $('#resupplyLocationSaveButton').off('click');
    $('#resupplyLocationSaveButton').click(() => {
      updateResupplyLocation(shippingLocationId);
    });

    $('#addResupplyLocation').modal('show');
  }
}

function updateResupplyLocation(shippingLocationId) {
  const resupplyLocation = objectifyForm($('#resupplyLocationForm').serializeArray());
  resupplyLocation.shippingLocationId = shippingLocationId;

  const h = findResupplyLocationIndex(shippingLocationId);

  resupplyLocation.lat = resupplyLocations[h].lat;
  resupplyLocation.lng = resupplyLocations[h].lng;

  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const h = findResupplyLocationIndex(shippingLocationId);
      resupplyLocations[h] = resupplyLocation;
    }
  };

  xmlhttp.open('PUT', '/resupplyLocation.php', true);
  xmlhttp.setRequestHeader('Content-type', 'application/json');
  xmlhttp.send(JSON.stringify(resupplyLocation));
}

function deleteResupplyLocation(object, position) {
}

export { loadResupply, retrieveResupplyLocations, addResupplyLocation };
