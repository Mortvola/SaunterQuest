import { getSchedule } from './tempstore';

const pointOfInterestCM = {};
const pointOfInterestUrl = 'https://maps.google.com/mapfiles/ms/micons/blue.png';
const pointsOfInterest = [];

function findPointOfInterestIndex(poiId) {
  for (const p in pointsOfInterest) {
    if (pointsOfInterest[p].id == poiId) {
      return p;
    }
  }

  return -1;
}

function removePointOfInterest(object, position) {
  $.ajax({
    url: `${sessionStorage.getItem('hikeId')}/pointOfInterest/${object.id}`,
    type: 'DELETE',
  })
    .done(() => {
      const index = findPointOfInterestIndex(object.id);
      pointsOfInterest[index].marker.setMap(null);
      removeContextMenu(pointsOfInterest[index].marker);

      pointsOfInterest.splice(index);

      getSchedule().retrieve();
    });
}

function updatePointOfInterest(poiId) {
  const pointOfInterest = objectifyForm($('#pointOfInterestForm').serializeArray());

  pointOfInterest.id = poiId;

  const index = findPointOfInterestIndex(poiId);

  pointOfInterest.lat = pointsOfInterest[index].lat;
  pointOfInterest.lng = pointsOfInterest[index].lng;
  pointOfInterest.constraints = pointsOfInterest[index].constraints;

  if (pointOfInterest.hangOut !== undefined && pointOfInterest.hangOut != '') {
    if (pointOfInterest.constraints == undefined || pointOfInterest.constraints.length == 0) {
      pointOfInterest.constraints = [];
      pointOfInterest.constraints.push({ type: 'linger', time: pointOfInterest.hangOut });
    }
    else {
      for (const c in pointOfInterest.constraints) {
        if (pointOfInterest.constraints[c].type == 'linger') {
          pointOfInterest.constraints[c].time = pointOfInterest.hangOut;

          break;
        }
      }
    }
  }
  else {
    for (const c in pointOfInterest.constraints) {
      if (pointOfInterest.constraints[c].type == 'linger') {
        pointOfInterest.constraints[c].remove = true;

        break;
      }
    }
  }

  delete pointOfInterest.hangOut;

  $.ajax({
    url: `${sessionStorage.getItem('hikeId')}/pointOfInterest/${poiId}`,
    headers:
        {
          'Content-type': 'application/json',
        },
    type: 'PUT',
    data: JSON.stringify(pointOfInterest),
    dataType: 'json',
  })
    .done((responseText) => {
      const poi = responseText;

      pointsOfInterest[index].lat = poi.lat;
      pointsOfInterest[index].lng = poi.lng;
      pointsOfInterest[index].name = poi.name;
      pointsOfInterest[index].description = poi.description;
      pointsOfInterest[index].constraints = poi.constraints;

      pointsOfInterest[index].message = getInfoWindowMessage(poi);
    });
}

function editPointOfInterest(object, position) {
  const index = findPointOfInterestIndex(object.id);

  $("input[name='name']").val(pointsOfInterest[index].name);
  $("input[name='description']").val(pointsOfInterest[index].description);

  if (pointsOfInterest[index].constraints != undefined) {
    for (const c in pointsOfInterest[index].constraints) {
      if (pointsOfInterest[index].constraints[c].type == 'linger') {
        $("input[name='hangOut']").val(pointsOfInterest[index].constraints[c].time);
        break;
      }
    }
  }

  $('#pointOfInterestSaveButton').off('click');
  $('#pointOfInterestSaveButton').click(() => {
    updatePointOfInterest(object.id);
  });

  $('#addPointOfInterest').modal('show');
}

function getInfoWindowMessage(poi) {
  return `<div>${poi.name}</div>`
	+ `<div>${poi.description}</div>`;
}

function addPointOfInterest(poi) {
  poi.marker = new google.maps.Marker({
    position: { lat: parseFloat(poi.lat), lng: parseFloat(poi.lng) },
    map,
    icon: {
      url: pointOfInterestUrl,
    },
  });

  poi.marker.id = poi.id;

  setContextMenu(poi.marker, pointOfInterestCM);

  poi.listener = attachInfoWindowMessage(poi,
    getInfoWindowMessage(poi));

  pointsOfInterest.push(poi);
}

function insertPointOfInterest(position) {
  const pointOfInterest = objectifyForm($('#pointOfInterestForm').serializeArray());

  pointOfInterest.lat = position.lat();
  pointOfInterest.lng = position.lng();
  pointOfInterest.userHikeId = userHikeId;

  if (pointOfInterest.hangOut != '') {
    pointOfInterest.constraints = [];
    pointOfInterest.constraints.push({ type: 'linger', time: pointOfInterest.hangOut });
    delete pointOfInterest.hangOut;
  }

  $.post({
    url: `${sessionStorage.getItem('hikeId')}/pointOfInterest`,
    headers:
        {
          'Content-type': 'application/json',
        },
    data: JSON.stringify(pointOfInterest),
    dataType: 'json',
  })
    .done((responseText) => {
      const poi = responseText;

      addPointOfInterest(poi);

      getSchedule().retrieve();
    });
}

function showAddPointOfInterest(object, position) {
  $('#pointOfInterestSaveButton').off('click');
  $('#pointOfInterestSaveButton').click(() => {
    insertPointOfInterest(position);
  });

  $('#addPointOfInterest').modal('show');
}

function retrievePointsOfInterest(hikeId, map) {
  fetch(`/api/hike/${hikeId}/pointOfInterest`)
    .then(async (response) => {
      if (response.ok) {
        const poi = await response.json();

        if (map) {
          poi.forEach((p) => {
            addPointOfInterest(p);
          });
        }
      }
    });
}

export { showAddPointOfInterest, retrievePointsOfInterest };
