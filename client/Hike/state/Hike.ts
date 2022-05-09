import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import L, { LatLng } from 'leaflet';
import Map from './Map';
import {
  HikeInterface, MarkerType,
} from './Types';
import { createIcon } from '../mapUtils';
import { redCircle } from './PointsOfInterest/Icons';
import { HikeLegProps, HikeProps } from '../../../common/ResponseTypes';
import Marker from './Marker';
import HikeLeg from './HikeLeg';

class Hike implements HikeInterface {
  id: number;

  name: string;

  duration: number | null = null;

  distance: number | null = null;

  routeGroupId: number | null = null;

  routeGroupTrail: L.LatLng[][] | null = null;

  requesting = false;

  hikeLegs: HikeLeg[] = [];

  currentLeg: HikeLeg | null = null;

  camps: Marker[] = [];

  pointsOfInterest: Marker[] = [];

  // map: Map;

  elevationMarkerIcon = createIcon(redCircle);

  constructor(props: HikeProps) {
    // this.map = new Map();

    this.id = props.id;

    this.name = props.name;

    this.routeGroupId = props.routeGroupId;

    this.hikeLegs = props.hikeLegs.map((hl) => new HikeLeg(hl, new Map()));

    this.setCurrentLeg(this.hikeLegs[0]);

    this.requestPointsOfInterest();

    this.requestRouteGroup();

    makeAutoObservable(this);
  }

  async updateSettings(name: string, routeGroupId: number | null): Promise<void> {
    const response = await Http.patch(`/api/hike/${this.id}`, { name, routeGroupId });

    if (response.ok) {
      this.name = name;
      this.routeGroupId = routeGroupId;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  requestPointsOfInterest = async (): Promise<void> => {
    // const response = await Http.get<PointOfInterestProps[]>(`/api/hike/${this.id}/poi`);

    // if (response.ok) {
    //   const body = await response.body();

    //   runInAction(() => {
    //     body.forEach((poi) => this.map.addMarker(new Marker(
    //       poi.type,
    //       { lat: poi.lat, lng: poi.lng },
    //       true,
    //       false,
    //       this.map,
    //     )));
    //   });
    // }
  };

  // eslint-disable-next-line class-methods-use-this
  addCamp(latLng: L.LatLng): void {
    // const campsite = new Marker('campsite', latLng, true, true, this.map);
    // this.camps.push(campsite);
    // this.map.addMarker(campsite);
  }

  // eslint-disable-next-line class-methods-use-this
  private async addPOI(latLng: L.LatLng, type: MarkerType): Promise<void> {
    // const response = await Http.post(`/api/hike/${this.id}/poi`, {
    //   name: null,
    //   description: null,
    //   lat: latLng.lat,
    //   lng: latLng.lng,
    //   type,
    // });

    // if (response.ok) {
    //   const poi = new Marker(type, latLng, true, false, this.map);
    //   this.map.addMarker(poi);
    // }
  }

  addWater = async (latLng: L.LatLng): Promise<void> => {
    this.addPOI(latLng, 'water');
  };

  addResupply = async (latLng: L.LatLng): Promise<void> => {
    this.addPOI(latLng, 'resupply');
  };

  async addLeg(): Promise<void> {
    const response = await Http.post<void, HikeLegProps>(`/api/hike/${this.id}/hike-leg`);

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        const newLeg = new HikeLeg(body, new Map());
        this.hikeLegs = [
          ...this.hikeLegs.slice(),
          newLeg,
        ];

        this.setCurrentLeg(newLeg);
      });
    }
  }

  setCurrentLeg(leg: number | HikeLeg | null): void {
    runInAction(() => {
      if (leg === null) {
        if (this.currentLeg) {
          this.currentLeg.unload();
        }

        this.currentLeg = null;
      }
      else {
        let newLeg: number | HikeLeg | undefined = leg;
        if (typeof leg === 'number') {
          newLeg = this.hikeLegs.find((l) => l.id === leg);
        }

        if (newLeg) {
          if (typeof newLeg === 'number') {
            throw new Error('newLeg is a number');
          }

          if (this.currentLeg) {
            this.currentLeg.unload();
          }

          this.currentLeg = newLeg;
          this.currentLeg.load(true);
        }
      }
    });
  }

  async deleteLeg(leg: HikeLeg): Promise<void> {
    const index = this.hikeLegs.findIndex((l) => l === leg);

    if (index !== -1) {
      const response = await Http.delete(`/api/hike-leg/${leg.id}`);

      if (response.ok) {
        runInAction(() => {
          this.hikeLegs = [
            ...this.hikeLegs.slice(0, index),
            ...this.hikeLegs.slice(index + 1),
          ];

          if (index > this.hikeLegs.length - 1) {
            this.setCurrentLeg(this.hikeLegs[this.hikeLegs.length - 1]);
          }
          else {
            this.setCurrentLeg(this.hikeLegs[index]);
          }
        });
      }
    }
  }

  async requestRouteGroup(): Promise<void> {
    if (this.routeGroupId) {
      const response = await Http.get<[number, number][][]>(`/api/route-group/${this.routeGroupId}`);

      if (response.ok) {
        const body = await response.body();

        runInAction(() => {
          this.routeGroupTrail = body.map((t) => t.map((t2) => new LatLng(t2[0], t2[1])));
        });
      }
    }
  }
}

export default Hike;
