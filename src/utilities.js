function nvl(value, replacement) {
    if (value == null) {
        return replacement;
    }

    return value;
}

function objectifyForm(formArray) {
    const returnObject = {};

    formArray.forEach((i) => {
        returnObject[formArray[i].name] = formArray[i].value;
    });

    return returnObject;
}

function metersToMilesRounded(meters) {
    return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
}

function metersToMiles(meters) {
    return parseFloat(meters) / 1609.34;
}

function metersToFeet(meters) {
    return Math.round(parseFloat(meters) * 3.281);
}

function gramsToOunces(grams) {
    return grams * 0.035274;
}

function gramsToPoundsAndOunces(grams) {
    let ounces = gramsToOunces(grams);
    const pounds = Math.floor(ounces / 16.0);
    ounces = Math.round(ounces % 16.0);

    return `${pounds.toString()} lb ${ounces} oz`;
}

// Format time
// Parameter t is in minutes from midnight
function formatTime(t) {
    const h = Math.floor(t / 60.0);
    const m = Math.floor((t % 60));

    let formattedTime = '';

    if (h < 10) {
        formattedTime = `0${h}`;
    }
    else {
        formattedTime = h;
    }

    if (m < 10) {
        formattedTime += `:0${m}`;
    }
    else {
        formattedTime += `:${m}`;
    }

    return formattedTime;
}

// Parameter t is a string in the form of HH:MM.
function unformatTime(t) {
    const time = t.split(':');

    return parseInt(time[0], 10) * 60 + parseInt(time[1], 10);
}

function toTimeString(time) {
    if (time !== undefined) {
        let hour = Math.floor(time);
        if (hour < 10) {
            hour = `0${hour}`;
        }

        let minutes = Math.floor((time - Math.floor(time)) * 60);
        if (minutes < 10) {
            minutes = `0${minutes}`;
        }

        return `${hour}:${minutes}`;
    }

    return null;
}

function toTimeFloat(time) {
    return parseInt(time.substring(0, 2), 10) + parseInt(time.substring(3), 10) / 60.0;
}

export {
    objectifyForm,
    metersToMilesRounded,
    toTimeString,
    toTimeFloat,
};
