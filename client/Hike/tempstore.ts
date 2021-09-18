// eslint-disable-next-line max-classes-per-file
class Route {
  start: unknown | null = null;

  end: unknown | null = null;

  setStart(position: unknown) {
    this.start = position;
  }

  setEnd(position: unknown) {
    this.end = position;
  }
}

const route = new Route();

class Schedule {
  retrieve() {
  }
}

const schedule = new Schedule();

// eslint-disable-next-line import/prefer-default-export
export const getRoute = (): Route => (
  route
);

export const getSchedule = (): Schedule => (
  schedule
);
