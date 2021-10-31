import { vec3, mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import { getStartOffset } from './TerrainCommon';
import TerrainTile, { TerrainRendererInterface } from './TerrainTile';
import { LatLng } from '../state/Types';
import { Location } from './Terrain';
import { isElevationResponse } from '../ResponseTypes';

const lng2tile = (lon:number, zoom: number) => (
  Math.floor(((lon + 180) / 360) * 2 ** zoom)
);

const lat2tile = (lat: number, zoom: number) => (
  Math.floor(
    ((1 - Math.log(Math.tan(lat * (Math.PI / 180)) + 1 / Math.cos(lat * (Math.PI / 180))) / Math.PI)
      / 2) * 2 ** zoom,
  )
);

class TerrainRenderer implements TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;

  pathFinderUrl: string;

  tiles: TerrainTile[] = [];

  position: LatLng;

  elevation: number | null = null;

  pitch = 0;

  yaw = 90;

  constructor(
    gl: WebGL2RenderingContext,
    position: LatLng,
    tileServerUrl: string,
    pathFinderUrl: string,
  ) {
    this.gl = gl;
    this.pathFinderUrl = pathFinderUrl;
    this.tileServerUrl = tileServerUrl;
    this.position = position;

    // Only continue if WebGL is available and working
    // Set clear color to black, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    const zoom = 13;
    const x = lng2tile(position.lng, zoom);
    const y = lat2tile(position.lat, zoom);

    const tilePadding = 3;
    for (let y2 = -tilePadding; y2 <= tilePadding; y2 += 1) {
      for (let x2 = -tilePadding; x2 <= tilePadding; x2 += 1) {
        this.addTile({ x: x + x2, y: y + y2, zoom });
      }
    }

    this.loadElevation();
  }

  async loadElevation(): Promise<void> {
    const response = await Http.get(`${this.pathFinderUrl}/elevation/point?lat=${this.position.lat}&lng=${this.position.lng}`);

    if (response.ok) {
      const body = await response.body();
      if (isElevationResponse(body)) {
        this.elevation = body.ele;
      }
    }
    else {
      throw new Error('invalid response');
    }
  }

  requestRender(): void {
    this.drawScene();
  }

  addTile(location: Location): void {
    const tile = new TerrainTile(this, location);
    this.tiles.push(tile);
  }

  updateLookAt(yawChange: number, pitchChange: number): void {
    this.yaw += yawChange;
    this.pitch += pitchChange;

    this.pitch = Math.max(Math.min(this.pitch, 89), -89);

    this.drawScene();
  }

  checkPoints(): void {
    if (this.tiles[0] && this.tiles[0].positions.length > 0
      && this.tiles[1] && this.tiles[1].positions.length > 0) {
      const tile0 = this.tiles[0];
      const tile1 = this.tiles[1];

      if (tile0.numPointsX !== tile1.numPointsX) {
        console.log('tile widths differ');
      }
      else {
        for (let x = 0; x < tile0.numPointsX; x += 1) {
          [0, 2, 4].forEach((j) => {
            const tile1Value = tile1.positions[x * 5 + j];
            const tile0Value = tile0.positions[
              x * 2 * 5 + j
                + (tile0.numPointsY - 3) * (2 * tile0.numPointsX - 1) * 5
                + tile0.numPointsX * 5
            ];
            if (tile1Value !== tile0Value) {
              console.log(`tile edges differ at ${x}, ${j}: ${tile1Value} ${tile0Value}`);
            }
          });

          [0, 2, 4].forEach((j) => {
            const tile1Value = tile1.positions[
              x * 2 * 5 + j + tile1.numPointsX * 5
            ];
            const tile0Value = tile0.positions[
              x * 2 * 5 + j
                + (tile0.numPointsY - 2) * (2 * tile0.numPointsX - 1) * 5
                + tile0.numPointsX * 5
            ];
            if (tile0Value !== tile1Value) {
              console.log(`tile edges differ at ${x}, ${j}: ${tile0Value} ${tile1Value}`);
            }
          });
        }
      }
    }
  }

  drawScene(): void {
    if (this.elevation !== null) {
    // Clear the canvas before we start drawing on it.
    // eslint-disable-next-line no-bitwise
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      const projectionMatrix = this.getProjectionMatrix();
      const modelViewMatrix = this.getModelViewMatrix();

      // Set up the normal matrix
      const normalMatrix = mat4.create();
      mat4.invert(normalMatrix, modelViewMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      // this.checkPoints();

      this.gl.enable(this.gl.CULL_FACE);

      this.tiles.forEach((tile) => {
        tile.drawTerrain(projectionMatrix, modelViewMatrix);
      });
    }
  }

  getProjectionMatrix(): mat4 {
    // Set up the projection matrix
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 32000.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    return projectionMatrix;
  }

  getModelViewMatrix(): mat4 {
    // Set up the view matrix
    if (this.elevation === null) {
      throw new Error('elevation is null');
    }

    const { startLatOffset, startLngOffset } = getStartOffset(this.position);

    const modelViewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(startLngOffset, startLatOffset, this.elevation + 2);

    const cameraTarget = vec3.fromValues(
      Math.cos((this.yaw * Math.PI) / 180) * Math.cos((this.pitch * Math.PI) / 180),
      Math.sin((this.yaw * Math.PI) / 180) * Math.cos((this.pitch * Math.PI) / 180),
      Math.sin((this.pitch * Math.PI) / 180),
    );

    vec3.normalize(cameraTarget, cameraTarget);
    cameraTarget[0] += cameraPos[0];
    cameraTarget[1] += cameraPos[1];
    cameraTarget[2] += cameraPos[2];

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    mat4.lookAt(modelViewMatrix, cameraPos, cameraTarget, cameraUp);

    return modelViewMatrix;
  }
}

export default TerrainRenderer;
