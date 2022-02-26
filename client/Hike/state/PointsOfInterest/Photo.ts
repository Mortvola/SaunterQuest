import L from 'leaflet';
import { PhotoProps } from '../../../../common/ResponseTypes';
import { MapInterface, PointOfInterestInterface } from '../Types';
import PointOfInterest from './PointOfInterset';
import PhotoData from '../../../welcome/state/Photo';

class PhotoPoi extends PointOfInterest implements PointOfInterestInterface {
  photo: PhotoData;

  constructor(props: PhotoProps, map: MapInterface) {
    super(props.id, null, 'photo', new L.LatLng(props.location[1], props.location[0]), false, false, map);

    this.photo = new PhotoData(props);
  }
}

export default PhotoPoi;
