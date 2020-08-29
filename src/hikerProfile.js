import { formatTime } from './utilities';

let hikerProfiles = [];

function hikerProfileRowGet(profile) {
    let txt = '';

    txt += `<tr id='hikerProfile_${profile.id}'>`;

    txt += "<td style='display:flex;justify-content:space-between;'>";
    txt += '<span>';
    txt += `<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='editHikerProfile(${profile.id})'><i class='fas fa-pencil-alt'></i></a>`;
    txt += `<a class='btn btn-sm' style='padding:5px 5px 5px 5px' onclick='removeHikerProfile(${profile.id})'><i class='fas fa-trash-alt'></i></a>`;
    txt += '</span>';

    // fixup start day.
    let startDay = nvl(profile.startDay, '');

    if (startDay !== '') {
        startDay = parseInt(startDay, 10) + 1;
    }

    txt += `${startDay}</td>`;

    // fixup end day
    let endDay = nvl(profile.endDay, '');

    if (endDay !== '') {
        endDay = parseInt(endDay) + 1;
    }

    txt += `<td style='text-align:right'>${endDay}</td>`;

    txt += `<td style='text-align:right'>${nvl(profile.speedFactor, '')}</td>`;
    txt += `<td style='text-align:right'>${formatTime(nvl(profile.startTime * 60, ''))}</td>`;
    txt += `<td style='text-align:right'>${formatTime(nvl(profile.endTime * 60, ''))}</td>`;
    txt += `<td style='text-align:right'>${nvl(profile.breakDuration, '')}</td>`;

    txt += '</tr>';

    return txt;
}

function retrieveHikerProfiles() {
    $.getJSON({
        url: `${sessionStorage.getItem('hikeId')}/hikerProfile`,
    })
        .done((responseText) => {
            hikerProfiles = responseText;

            let txt = '';

            for (const d in hikerProfiles) {
                txt += hikerProfileRowGet(hikerProfiles[d]);
            }

            $('#hikerProfileLastRow').before(txt);
        });
}

function addHikerProfile() {
    $('#hikerProfileSaveButton').off('click');
    $('#hikerProfileSaveButton').click(insertHikerProfile);

    $('#hikerProfileDialog').modal('show');
}

function findHikerProfileIndex(hikerProfileId) {
    for (const h in hikerProfiles) {
        if (hikerProfiles[h].id == hikerProfileId) {
            return h;
        }
    }

    return -1;
}

function toTimeString(time) {
    if (time !== undefined) {
        let hour = Math.floor(time);
        if (hour < 10) {
            hour = `0${ hour}`;
        }

        let minutes = Math.floor((time - Math.floor(time)) * 60);
        if (minutes < 10) {
            minutes = `0${ minutes}`;
        }

        return `${hour}:${minutes}`;
    }
}

function editHikerProfile(hikerProfileId) {
    //
    // Find the hiker profile using the hikerProfileId.
    //
    const h = findHikerProfileIndex(hikerProfileId);

    if (h > -1) {
        $("input[name='startDay']").val(hikerProfiles[h].startDay == '' ? hikerProfiles[h].startDay : parseInt(hikerProfiles[h].startDay) + 1);
        $("input[name='endDay']").val(hikerProfiles[h].endDay == '' ? hikerProfiles[h].endDay : parseInt(hikerProfiles[h].endDay) + 1);

        $("input[name='speedFactor']").val(hikerProfiles[h].speedFactor);
        $("input[name='startTime']").val(toTimeString(hikerProfiles[h].startTime));
        $("input[name='endTime']").val(toTimeString(hikerProfiles[h].endTime));
        $("input[name='breakDuration']").val(hikerProfiles[h].breakDuration);

        $('#hikerProfileSaveButton').off('click');
        $('#hikerProfileSaveButton').click(() => {
            updateHikerProfile(hikerProfileId);
        });

        $('#hikerProfileDialog').modal('show');
    }
}

function toTimeFloat(time) {
    return parseInt(time.substring(0, 2)) + parseInt(time.substring(3)) / 60.0;
}

function updateHikerProfile(hikerProfileId) {
    const profile = objectifyForm($('#hikerProfileForm').serializeArray());

    if (profile.startDay !== '') {
        profile.startDay = parseInt(profile.startDay) - 1;
    }

    if (profile.endDay !== '') {
        profile.endDay = parseInt(profile.endDay) - 1;
    }

    profile.startTime = toTimeFloat(profile.startTime);
    profile.endTime = toTimeFloat(profile.endTime);

    if (profile.breakDuration !== '') {
        profile.breakDuration = parseInt(profile.breakDuration);
    }

    $.ajax({
        url: `${sessionStorage.getItem('hikeId')}/hikerProfile/${hikerProfileId}`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        type: 'PUT',
        data: JSON.stringify(profile),
        dataType: 'json',
    })
        .done((responseText) => {
            const profile = responseText;

            const h = findHikerProfileIndex(hikerProfileId);
            hikerProfiles[h] = profile;

            $(`#hikerProfile_${ hikerProfileId}`).replaceWith(hikerProfileRowGet(profile));

            schedule.retrieve();
        });
}

function insertHikerProfile() {
    let profile = objectifyForm($('#hikerProfileForm').serializeArray());

    if (profile.startDay !== '') {
        profile.startDay = parseInt(profile.startDay) - 1;
    }

    if (profile.endDay !== '') {
        profile.endDay = parseInt(profile.endDay) - 1;
    }

    profile.startTime = toTimeFloat(profile.startTime);
    profile.endTime = toTimeFloat(profile.endTime);

    if (profile.breakDuration !== '') {
        profile.breakDuration = parseInt(profile.breakDuration);
    }

    profile.userHikeId = userHikeId;

    $.post({
        url: `${sessionStorage.getItem('hikeId')}/hikerProfile`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        data: JSON.stringify(profile),
        dataType: 'json',
    })
        .done((responseText) => {
            profile = responseText;
            hikerProfiles.push(profile);

            $('#hikerProfileLastRow').before(hikerProfileRowGet(profile));

            schedule.retrieve();
        });
}

function removeHikerProfile(hikerProfileId) {
    $.ajax({
        url: `${sessionStorage.getItem('hikeId')}/hikerProfile/${hikerProfileId}`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
        },
        type: 'DELETE',
    })
        .done((responseText) => {
            $(`#hikerProfile_${ hikerProfileId}`).remove();
            schedule.retrieve();
        });
}

export { addHikerProfile, retrieveHikerProfiles };
