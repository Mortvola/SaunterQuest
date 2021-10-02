import { vec3, mat4 } from 'gl-matrix';
import { getStartOffset } from './TerrainCommon';
import TerrainTile, { TerrainRendererInterface } from './TerrainTile';
import { LatLng } from '../state/Types';
import { Location } from './Terrain';

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
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things

    const zoom = 13;
    const x = lng2tile(position.lng, zoom);
    const y = lat2tile(position.lat, zoom);

    this.addTile({ x: x + 1, y, zoom });
    this.addTile({ x, y, zoom });
    this.addTile({ x: x - 1, y, zoom });

    this.addTile({ x: x + 1, y: y + 1, zoom });
    this.addTile({ x, y: y + 1, zoom });
    this.addTile({ x: x - 1, y: y + 1, zoom });

    this.addTile({ x: x + 1, y: y - 1, zoom });
    this.addTile({ x, y: y - 1, zoom });
    this.addTile({ x: x - 1, y: y - 1, zoom });

    this.loadElevation();
  }

  async loadElevation(): Promise<void> {
    const response = await fetch(`${this.pathFinderUrl}/elevation/point?lat=${this.position.lat}&lng=${this.position.lng}`);

    if (response.ok) {
      const body = await response.json();
      this.elevation = body.ele;
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
    const zFar = 8000.0;
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
