import { makeAutoObservable, runInAction } from 'mobx';
import xml2js from 'xml2js';

type GpxLatLng = {
  $: { lat: string; lon: string; };
}

type GpxTrkSeg = {
  trkpt: GpxLatLng[];
}

type GpxTrack = {
  trkseg: GpxTrkSeg[];
}

class Gpx {
  tracks: Array<Array<[number, number]>> = [];

  constructor() {
    makeAutoObservable(this);
  }

  loadGpxData = async (file: File): Promise<void> => {
    let text = null;

    text = await file.text();

    const data = await xml2js.parseStringPromise(text);

    runInAction(() => {
      this.tracks = data.gpx.trk.map((trk: GpxTrack) => (
        trk.trkseg.map((trkseg: GpxTrkSeg) => (
          trkseg.trkpt.map((trkpt: GpxLatLng) => (
            [parseFloat(trkpt.$.lat), parseFloat(trkpt.$.lon)]
          ))
        ))
      ));
    });
  }
}

export default Gpx;
