function nvl(value: unknown, replacement: unknown): unknown {
  if (value == null) {
    return replacement;
  }

  return value;
}

function objectifyForm(formArray: Record<string, {name: string, value: string}>): unknown {
  const returnObject: Record<string, string> = {};

  Object.keys(formArray).forEach((i) => {
    returnObject[formArray[i].name] = formArray[i].value;
  });

  return returnObject;
}

function metersToMilesRounded(meters: number | string | null): number {
  if (meters !== null) {
    if (typeof meters === 'string') {
      return Math.round((parseFloat(meters) / 1609.34) * 10) / 10;
    }

    return Math.round((meters / 1609.34) * 10) / 10;
  }

  return 0;
}

function metersToMiles(meters: number | string): number {
  if (typeof meters === 'string') {
    return parseFloat(meters) / 1609.34;
  }

  return meters / 1609.34;
}

function metersToFeet(meters: number | string): number {
  if (typeof meters === 'string') {
    return Math.round(parseFloat(meters) * 3.281);
  }

  return Math.round(meters * 3.281);
}

function gramsToOunces(grams: number): number {
  return grams * 0.035274;
}

function gramsToPoundsAndOunces(grams: number): string {
  let ounces = gramsToOunces(grams);
  const pounds = Math.floor(ounces / 16.0);
  ounces = Math.round(ounces % 16.0);

  return `${pounds.toString()} lb ${ounces} oz`;
}

// Format time
// Parameter t is in minutes from midnight
function formatTime(t: number): string {
  const h = Math.floor(t / 60.0);
  const m = Math.floor((t % 60));

  let formattedTime = '';

  if (h < 10) {
    formattedTime = `0${h}`;
  }
  else {
    formattedTime = h.toString();
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
function unformatTime(t: string): number {
  const time = t.split(':');

  return parseInt(time[0], 10) * 60 + parseInt(time[1], 10);
}

function toTimeString(time: number | undefined): string | null {
  if (time !== undefined) {
    let hour = Math.floor(time).toString();
    if (time < 10) {
      hour = `0${hour}`;
    }

    const minutes = Math.floor((time - Math.floor(time)) * 60);
    if (minutes < 10) {
      return `${hour}:0${minutes}`;
    }

    return `${hour}:${minutes}`;
  }

  return null;
}

function toTimeFloat(time: string): number {
  return parseInt(time.substring(0, 2), 10) + parseInt(time.substring(3), 10) / 60.0;
}

function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineGreatCircleDistance(
  latitudeFrom: number,
  longitudeFrom: number,
  latitudeTo: number,
  longitudeTo: number,
  earthRadius = 6378137,
): number {
  // convert from degrees to radians
  const latFrom = degToRad(latitudeFrom);
  const lonFrom = degToRad(longitudeFrom);
  const latTo = degToRad(latitudeTo);
  const lonTo = degToRad(longitudeTo);

  const latDelta = latTo - latFrom;
  const lonDelta = lonTo - lonFrom;

  const a = (Math.sin(latDelta / 2) ** 2)
    + Math.cos(latFrom) * Math.cos(latTo) * (Math.sin(lonDelta / 2) ** 2);

  const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return angle * earthRadius;
}

function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  objectifyForm,
  metersToMilesRounded,
  toTimeString,
  toTimeFloat,
  metersToFeet,
  metersToMiles,
  gramsToPoundsAndOunces,
  formatTime,
  nvl,
  haversineGreatCircleDistance,
  sleep,
};
