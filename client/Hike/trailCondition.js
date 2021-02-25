import { RouteHighlighter } from './routeHighlighter';
import { getRoute, getSchedule } from './tempstore';
import positionMapToBounds from './mapUtils';

let trailConditions = [];
let editingTrailConditionId = null;
let trailConditionMenu;
let trailConditionRouteHighlighter;

const dialogSpeed = 250;

function setRouteHighlightStartMarker(object, position) {
  trailConditionRouteHighlighter.setStartPosition({ lat: position.lat(), lng: position.lng() });
}

function setRouteHighlightEndMarker(object, position) {
  trailConditionRouteHighlighter.setEndPosition({ lat: position.lat(), lng: position.lng() });
}

function trailConditionMenuGet() {
  if (trailConditionMenu === undefined) {
    trailConditionMenu = new ContextMenu([
      { title: 'Set start marker', func: setRouteHighlightStartMarker },
      { title: 'Set end marker', func: setRouteHighlightEndMarker },
    ]);
  }

  return trailConditionMenu;
}

function closeEditTrailConditions() {
  $('#editTrailConditions').hide(dialogSpeed);

  trailConditionRouteHighlighter.end();
  trailConditionRouteHighlighter = null;

  getRoute().setContextMenu(null);
}

function insertTrailCondition() {
  const trailCondition = objectifyForm($('#trailConditionForm').serializeArray());

  trailCondition.userHikeId = userHikeId;

  trailCondition.start = trailConditionRouteHighlighter.getStartPosition();
  trailCondition.end = trailConditionRouteHighlighter.getEndPosition();

  // Both markers must be placed on the map.
  if (trailCondition.start && trailCondition.end) {
    $.post({
      url: `${sessionStorage.getItem('hikeId')}/trailCondition`,
      headers:
            {
              'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
              'Content-type': 'application/json',
            },
      data: JSON.stringify(trailCondition),
      dataType: 'json',
    })
      .done((trailCondition) => {
        trailCondition.polyLine = routeHighlightPolylineCreate(
          new google.maps.LatLng({ lat: parseFloat(trailCondition.startLat), lng: parseFloat(trailCondition.startLng) }),
          new google.maps.LatLng({ lat: parseFloat(trailCondition.endLat), lng: parseFloat(trailCondition.endLng) }),
          '#FF0000',
        );

        trailConditions.push(trailCondition);

        $('#conditionsLastRow').before(trailConditionRowGet(trailCondition));

        getSchedule().retrieve();

        closeEditTrailConditions();
      });
  }
}

function trailConditionTypeGet(type) {
  if (type === 0) {
    return 'No Camping';
  }
  if (type === 1) {
    return 'No Stealth Camping';
  }
  if (type === 2) {
    return 'Other';
  }
}

function trailConditionRowGet(trailCondition) {
  let txt = '';

  txt += `<tr id='trailCondition_${trailCondition.id}'>`;

  txt += "<td style='display:flex;justify-content:flex-start;'>";
  txt += "<span style='padding-right:15px'>";
  txt += `<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='viewTrailCondition(${trailCondition.id})'><i class='fas fas-eye'></i></a>`;
  txt += `<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editTrailCondition(${trailCondition.id})'><i class='fas fa-pencil-alt'></i></a>`;
  txt += `<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeTrailCondition(${trailCondition.id})'><i class='fas fa-trash-alt'></i></a>`;
  txt += '</span>';
  txt += `${trailConditionTypeGet(trailCondition.type)}</td>`;
  txt += `<td style='text-align:left'>${nvl(trailCondition.description, '')}</td>`;
  txt += `<td style='text-align:right'>${nvl(trailCondition.speedFactor, 100)}</td>`;

  txt += '</tr>';

  return txt;
}

function getTrailConditionColor(type) {
  if (type === 0) {
    return '#FF0000';
  }
  if (type === 1) {
    return '#FFA500'; // '#FFFF00'; //'#FFD700'
  }

  return '#FF00FF'; // '#C0C0C0'; //'#708090'
}

function retrieveTrailConditions(hikeId) {
  fetch(`/hike/${hikeId}/trailCondition`)
    .then(async (response) => {
      if (response.ok) {
        trailConditions = await response.json();
        const txt = '';

        trailConditions.forEach((t) => {
          // t.polyLine = routeHighlightPolylineCreate(
          //     new google.maps.LatLng({ lat: parseFloat(t.startLat), lng: parseFloat(t.startLng) }),
          //     new google.maps.LatLng({ lat: parseFloat(t.endLat), lng: parseFloat(t.endLng) }),
          //     getTrailConditionColor(t.type),
          // );

          // txt += trailConditionRowGet(t);
        });

        $('#conditionsLastRow').before(txt);
      }
    });
}

function findTrailConditionIndex(trailConditionId) {
  for (const t in trailConditions) {
    if (trailConditions[t].id == trailConditionId) {
      return t;
    }
  }

  return -1;
}

function trailConditionMarkerSet(highlighter) {
  const startPosition = highlighter.getStartPosition();
  const endPosition = highlighter.getEndPosition();

  if (startPosition && endPosition) {
    measureRouteDistance(startPosition, endPosition);
    displayRouteElevations(startPosition.segment, endPosition.segment);
  }
}

function addTrailCondition() {
  trailConditionRouteHighlighter = new RouteHighlighter(
    getRoute(), null, trailConditionMarkerSet,
  );

  getRoute().setContextMenu(trailConditionMenuGet());

  $('#trailConditionSaveButton').off('click');
  $('#trailConditionSaveButton').click(() => {
    insertTrailCondition();
  });

  $('#editTrailConditions').show(dialogSpeed);
}

function viewTrailCondition(trailConditionId) {
  const t = findTrailConditionIndex(trailConditionId);

  if (t > -1) {
    const startPosition = { lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng) };
    const endPosition = { lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng) };

    positionMapToBounds(startPosition, endPosition);
  }
}

function editTrailCondition(trailConditionId) {
  const t = findTrailConditionIndex(trailConditionId);

  if (t > -1) {
    const startPosition = { lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng) };
    const endPosition = { lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng) };

    markerSetup(0, startPosition);
    markerSetup(1, endPosition);

    positionMapToBounds(startPosition, endPosition);

    highlightBetweenMarkers();

    //
    // If we were editing another trail condition polyline then restore it
    //
    if (editingTrailConditionId != null && trailConditionId != editingTrailConditionId) {
      const previous = findTrailConditionIndex(editingTrailConditionId);

      trailConditions[previous].polyLine.setMap(map);
    }

    editingTrailConditionId = trailConditionId;

    trailConditions[t].polyLine.setMap(null);

    setContextMenu(actualRoutePolyline, trailConditionMenuGet());

    $("#trailConditionForm select[name='type']").val(trailConditions[t].type);
    $("#trailConditionForm input[name='description']").val(trailConditions[t].description);
    $("#trailConditionForm input[name='speedFactor']").val(nvl(trailConditions[t].speedFactor, 100));

    $('#trailConditionSaveButton').off('click');
    $('#trailConditionSaveButton').click(() => {
      updateTrailCondition(trailConditionId);
    });

    $('#editTrailConditions').show(dialogSpeed);
  }
}

function cancelEditTrailConditions() {
  // If we were editing a trail condition then restore its polyline.
  if (editingTrailConditionId != null) {
    const t = findTrailConditionIndex(editingTrailConditionId);

    if (t > -1) {
      trailConditions[t].polyLine.setMap(map);
    }

    editingTrailConditionId = null;
  }

  closeEditTrailConditions();
}

function updateTrailCondition(trailConditionId) {
  const trailCondition = objectifyForm($('#trailConditionForm').serializeArray());

  trailCondition.start = trailConditionRouteHighlighter.getStartPosition();
  trailCondition.end = trailConditionRouteHighlighter.getEndPosition();

  $.ajax({
    url: `${sessionStorage.getItem('hikeId')}/trailCondition/${trailConditionId}`,
    headers:
        {
          'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
          'Content-type': 'application/json',
        },
    type: 'PUT',
    data: JSON.stringify(trailCondition),
    dataType: 'json',
  })
    .done((trailCondition) => {
      const t = findTrailConditionIndex(trailConditionId);

      // If there is an existing polyline then remove it from the map.
      if (trailConditions[t].polyLine) {
        trailConditions[t].polyLine.setMap(null);
      }

      trailConditions[t] = trailCondition;

      trailConditions[t].polyLine = routeHighlightPolylineCreate(
        new google.maps.LatLng({ lat: parseFloat(trailConditions[t].startLat), lng: parseFloat(trailConditions[t].startLng) }),
        new google.maps.LatLng({ lat: parseFloat(trailConditions[t].endLat), lng: parseFloat(trailConditions[t].endLng) }),
        '#FF0000',
      );

      $(`#trailCondition_${trailConditionId}`).replaceWith(trailConditionRowGet(trailCondition));

      getSchedule().retrieve();

      closeEditTrailConditions();
    });
}

function removeTrailCondition(trailConditionId) {
  $.ajax({
    url: `${sessionStorage.getItem('hikeId')}/trailCondition/${trailConditionId}`,
    headers:
        {
          'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
        },
    type: 'DELETE',
  })
    .done((trailCondition) => {
      const t = findTrailConditionIndex(trailConditionId);

      // If there is an existing polyline then remove it from the map.
      if (trailConditions[t].polyLine) {
        trailConditions[t].polyLine.setMap(null);
      }

      trailConditions.splice(t, 1);

      $(`#trailCondition_${trailConditionId}`).remove();
      getSchedule().retrieve();
    });
}

export { addTrailCondition, retrieveTrailConditions };
