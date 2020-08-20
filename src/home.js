import { objectifyForm, metersToMilesRounded } from './utilities';

function deleteHike(hikeId) {
    $.ajax({
        url: `hike/${hikeId}`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
        },
        type: 'DELETE',
    })
        .done(() => {
            $(`#userHike_${hikeId}`).remove();
        });
}

function insertHike() {
    const hike = objectifyForm($('#userHikeForm').serializeArray());

    $.post({
        url: 'hike',
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        data: JSON.stringify(hike.name),
        dataType: 'json',
    })
        .done((hike) => {
            document.location.href = `/hike/${hike.id}`;
        });
}

function showHikeDialog() {
    $('#addHikeSaveButton').off('click');
    $('#addHikeSaveButton').click(insertHike);

    $('#hikeDialog').modal('show');
}

function makeEditable(element) {
    let value = element.html();
    const url = element.attr('data-url');
    const prop = element.attr('data-prop');

    element.html(`${value}<a class='btn btn-sm'><i class='fas fa-pencil-alt' style='color:rgba(0,0,0,0.4)'></i></a>`);
    element.on('click', function () {
        element.hide();

        const grid = $("<div style='width:100%;display: grid;grid-template-columns: 1fr min-content min-content;'></div");
        const edit = $("<input type='text' style='width:100%;border-width:2px; border-style:solid'/>");
        const save = $("<button class='btn btn-sm' type='button'>"
            + "<i class='fas fa-check-square'></i>"
            + '</button>');
        const cancel = $("<button class='btn btn-sm' type='button'>"
            + "<i class='fas fa-window-close'></i>"
            + '</button>');

        grid.insertAfter(element);
        grid.append(edit);
        grid.append(save);
        grid.append(cancel);

        edit.val(value);
        edit.focus();

        const label = this;

        save.on('click', () => {
            value = edit.val();

            $.ajax({
                url,
                headers:
                    {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                    },
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ [prop]: value }),
            })
                .done(() => {
                    $(label).html(`${value}<a class='btn btn-sm'><i class='fas fa-pencil-alt' style='color:rgba(0,0,0,0.4)'></i></a>`);
                    $(label).show();
                    grid.remove();
                });
        });

        cancel.on('click', () => {
            $(label).show();
            grid.remove();
        });
    });
}

function getHikes() {
    $('#pleaseWait').show();

    fetch('/hikes')
        .then(async (response) => {
            if (response.ok) {
                const json = await response.json();
                if (Array.isArray(json)) {
                    json.sort((a, b) => {
                        const nameA = a.name.toUpperCase(); // ignore upper and lowercase
                        const nameB = b.name.toUpperCase(); // ignore upper and lowercase

                        if (nameA < nameB) {
                            return -1;
                        }

                        if (nameA > nameB) {
                            return 1;
                        }

                        // names must be equal
                        return 0;
                    });

                    json.forEach((hike) => {
                        const card = $('<div></div>')
                            .addClass('card bpp-shadow mr-4 mb-4 flex-shrink-0 flex-grow-0')
                            .css('width', '250px')
                            .attr('id', `userHike_${hike.id}`);

                        const name = $('<div></div>')
                            .addClass('edit-hike-name')
                            .attr('data-url', `hike/${hike.id}`)
                            .attr('data-prop', 'name')
                            .text(hike.name);

                        makeEditable(name);

                        const header = $('<div></div>')
                            .addClass('hike-card-header card-header');

                        name.appendTo(header);
                        header.appendTo(card);

                        const body = $('<div></div>')
                            .addClass('card-body')
                            .append('<div></div>');

                        $('<div></div>')
                            .text(`Distance: ${metersToMilesRounded(hike.distance)} miles`)
                            .appendTo(body);

                        $('<div></div>')
                            .text(`Duration: ${hike.days} days`)
                            .appendTo(body);

                        const buttons = $('<div></div>')
                            .css({ display: 'flex', 'justify-content': 'space-between', 'margin-top': '14px' })
                            .appendTo(body);

                        $('<button></button>')
                            .addClass('btn btn-sm btn-outline-secondary')
                            .text('Delete')
                            .on('click', () => {
                                deleteHike(hike.id);
                            })
                            .appendTo(buttons);

                        $('<button></button>')
                            .addClass('btn btn-outline-secondary')
                            .attr('type', 'button')
                            .text('Open')
                            .on('click', () => {
                                window.location.href = `/hike/${hike.id}`;
                            })
                            .attr('href', `/hike/${hike.id}`)
                            .appendTo(buttons);

                        body.appendTo(card);

                        card.appendTo('.hikes');
                    });
                }
            }
        })
        .then(() => {
            $('#pleaseWait').hide();
        })
        .catch((error) => {
            console.log(error);
            $('#pleaseWait').hide();
        });
}

export { getHikes, showHikeDialog };

