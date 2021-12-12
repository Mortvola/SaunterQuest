import { vec3, mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import TerrainTile, { TerrainRendererInterface } from './TerrainTile';
import { LatLng } from '../../state/Types';
import { Location } from './Terrain';
import { isElevationResponse } from '../../../common/ResponseTypes';
import { latLng2terrainTile, latOffset, terrainTile2LatLng } from '../../utilities';
import Shader from './Shader';

const zNear = 1;
const zFar = 16000.0;

type Tile = {
  offset: { x: number, y: number},
  tile: TerrainTile,
  order: number,
}

const requestPostAnimationFrame = (task: any) => {
  requestAnimationFrame((timestamp: number) => {
    setTimeout(() => {
      task(timestamp);
    }, 0);
  });
};

const tilePadding = 2;

class TerrainRenderer implements TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;

  pathFinderUrl: string;

  tilesMatrix: Tile[][];

  tiles: Tile[] = [];

  tileCenter: LatLng | null = null;

  position: LatLng;

  cameraOffset: vec3 = [0, 0, 0];

  cameraFront: vec3 = [0, 1, 0];

  velocity = 0;

  previousTimestamp: number | null = null;

  pitch = 0;

  yaw = 90;

  fogNormalizationFactor = 0;

  shader: Shader;

  startFpsTime: number | null = null;

  framesRendered = 0;

  #render = false;

  onFpsChange: (fps: number) => void;

  constructor(
    gl: WebGL2RenderingContext,
    position: LatLng,
    tileServerUrl: string,
    pathFinderUrl: string,
    onFpsChange: (fps: number) => void,
  ) {
    this.gl = gl;
    this.pathFinderUrl = pathFinderUrl;
    this.tileServerUrl = tileServerUrl;
    this.position = position;
    this.onFpsChange = onFpsChange;

    // Only continue if WebGL is available and working
    // Set clear color to black, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clearDepth(1.0); // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
    this.gl.enable(this.gl.CULL_FACE);

    this.tilesMatrix = new Array(tilePadding * 2 + 1);
    for (let y = 0; y < this.tilesMatrix.length; y += 1) {
      this.tilesMatrix[y] = new Array(tilePadding * 2 + 1);
    }

    this.shader = new Shader(this.gl);

    this.loadTiles();

    this.loadElevation();
  }

  start(): void {
    const draw = (timestamp: number) => {
      if (this.#render) {
        if (timestamp !== this.previousTimestamp) {
          if (this.startFpsTime === null) {
            this.startFpsTime = timestamp;
          }

          // Update the fps display every second.
          const fpsElapsedTime = timestamp - this.startFpsTime;

          if (fpsElapsedTime > 1000) {
            const fps = this.framesRendered / (fpsElapsedTime * 0.001);
            this.onFpsChange(fps);
            this.framesRendered = 0;
            this.startFpsTime = timestamp;
          }

          // Move the camera using the set velocity.
          if (this.previousTimestamp !== null) {
            const elapsedTime = (timestamp - this.previousTimestamp) * 0.001;

            vec3.scaleAndAdd(
              this.cameraOffset,
              this.cameraOffset,
              this.cameraFront,
              this.velocity / elapsedTime,
            );
          }

          this.previousTimestamp = timestamp;

          this.drawScene();

          this.framesRendered += 1;
        }

        requestPostAnimationFrame(draw);
      }
    };

    if (!this.#render) {
      requestPostAnimationFrame(draw);
      this.#render = true;
    }
  }

  stop(): void {
    this.#render = false;
  }

  async loadTiles(): Promise<void> {
    const zoom = 4;
    const [x, y] = latLng2terrainTile(this.position.lat, this.position.lng, zoom);

    const promises: Promise<void>[] = [];

    for (let y2 = -tilePadding; y2 <= tilePadding; y2 += 1) {
      for (let x2 = -tilePadding; x2 <= tilePadding; x2 += 1) {
        promises.push(
          this.addTile(x2 + tilePadding, y2 + tilePadding, { x: x + x2, y: y - y2, zoom }),
        );
      }
    }

    this.tileCenter = terrainTile2LatLng(x, y, zoom);

    if (this.tileCenter !== null) {
      this.cameraOffset = [
        -latOffset(this.position.lng, this.tileCenter.lng),
        -latOffset(this.position.lat, this.tileCenter.lat),
        0,
      ];
    }

    await Promise.all(promises);

    this.tiles.push(this.tilesMatrix[tilePadding][tilePadding]);

    // Use the padding width to set the fog normalization factor
    // so that the far edge of the tiled area is completely occluded by
    // the fog.
    const fogFar = this.tilesMatrix[tilePadding][tilePadding].tile.xLength * tilePadding;
    this.fogNormalizationFactor = 1 / (2 ** (fogFar * (Math.LOG2E / 4096.0)) - 1.0);

    // Set offsets
    for (let x2 = 1; x2 <= tilePadding; x2 += 1) {
      let prevTile = this.tilesMatrix[tilePadding][tilePadding + x2 - 1];
      let tile = this.tilesMatrix[tilePadding][tilePadding + x2];
      tile.offset = {
        x: prevTile.offset.x + (prevTile.tile.xLength / 2) + (tile.tile.xLength / 2),
        y: prevTile.offset.y,
      };
      tile.order = x2;
      this.tiles.push(tile);

      prevTile = this.tilesMatrix[tilePadding][tilePadding - x2 + 1];
      tile = this.tilesMatrix[tilePadding][tilePadding - x2];
      tile.offset = {
        x: prevTile.offset.x - (prevTile.tile.xLength / 2) - (tile.tile.xLength / 2),
        y: prevTile.offset.y,
      };
      tile.order = x2;
      this.tiles.push(tile);
    }

    for (let y2 = 1; y2 <= tilePadding; y2 += 1) {
      let prevTile = this.tilesMatrix[tilePadding + y2 - 1][tilePadding];
      let tile = this.tilesMatrix[tilePadding + y2][tilePadding];
      tile.offset = {
        x: prevTile.offset.x,
        y: prevTile.offset.y - (prevTile.tile.yLength / 2) - (tile.tile.yLength / 2),
      };
      tile.order = y2;
      this.tiles.push(tile);

      prevTile = this.tilesMatrix[tilePadding - y2 + 1][tilePadding];
      tile = this.tilesMatrix[tilePadding - y2][tilePadding];
      tile.offset = {
        x: prevTile.offset.x,
        y: prevTile.offset.y + (prevTile.tile.yLength / 2) + (tile.tile.yLength / 2),
      };
      tile.order = y2;
      this.tiles.push(tile);

      for (let x2 = 1; x2 <= tilePadding; x2 += 1) {
        prevTile = this.tilesMatrix[tilePadding + y2][tilePadding + x2 - 1];
        tile = this.tilesMatrix[tilePadding + y2][tilePadding + x2];
        tile.offset = {
          x: prevTile.offset.x + (prevTile.tile.xLength / 2) + (tile.tile.xLength / 2),
          y: prevTile.offset.y,
        };
        tile.order = x2 + y2;
        this.tiles.push(tile);

        prevTile = this.tilesMatrix[tilePadding + y2][tilePadding - x2 + 1];
        tile = this.tilesMatrix[tilePadding + y2][tilePadding - x2];
        tile.offset = {
          x: prevTile.offset.x - (prevTile.tile.xLength / 2) - (tile.tile.xLength / 2),
          y: prevTile.offset.y,
        };
        tile.order = x2 + y2;
        this.tiles.push(tile);

        prevTile = this.tilesMatrix[tilePadding - y2][tilePadding + x2 - 1];
        tile = this.tilesMatrix[tilePadding - y2][tilePadding + x2];
        tile.offset = {
          x: prevTile.offset.x + (prevTile.tile.xLength / 2) + (tile.tile.xLength / 2),
          y: prevTile.offset.y,
        };
        tile.order = x2 + y2;
        this.tiles.push(tile);

        prevTile = this.tilesMatrix[tilePadding - y2][tilePadding - x2 + 1];
        tile = this.tilesMatrix[tilePadding - y2][tilePadding - x2];
        tile.offset = {
          x: prevTile.offset.x - (prevTile.tile.xLength / 2) - (tile.tile.xLength / 2),
          y: prevTile.offset.y,
        };
        tile.order = x2 + y2;
        this.tiles.push(tile);
      }
    }

    this.tiles.sort((a, b) => a.order - b.order);
  }

  async loadElevation(): Promise<void> {
    const response = await Http.get(`${this.pathFinderUrl}/elevation/point?lat=${this.position.lat}&lng=${this.position.lng}`);

    if (response.ok) {
      const body = await response.body();
      if (isElevationResponse(body)) {
        this.cameraOffset[2] = body.ele + 2;
      }
    }
    else {
      throw new Error('invalid response');
    }
  }

  async addTile(x: number, y: number, location: Location): Promise<void> {
    const tile = new TerrainTile(this, location);
    this.tilesMatrix[y][x] = { offset: { x: 0, y: 0 }, tile, order: 0 };
    return tile.loadTerrain(this.shader);
  }

  updateLookAt(yawChange: number, pitchChange: number): void {
    this.yaw += yawChange;
    this.pitch += pitchChange;

    this.pitch = Math.max(Math.min(this.pitch, 89), -89);

    const x = Math.cos((this.yaw * Math.PI) / 180.0) * Math.cos((this.pitch * Math.PI) / 180.0);
    const y = Math.sin((this.yaw * Math.PI) / 180.0) * Math.cos((this.pitch * Math.PI) / 180.0);
    const z = Math.sin((this.pitch * Math.PI) / 180.0);

    const cameraFront = vec3.fromValues(x, y, z);

    vec3.normalize(this.cameraFront, cameraFront);
  }

  setVelocity(velocity: number): void {
    this.velocity = velocity;
  }

  // checkPoints(): void {
  //   if (this.tiles[0] && this.tiles[0].positions.length > 0
  //     && this.tiles[1] && this.tiles[1].positions.length > 0) {
  //     const tile0 = this.tiles[0];
  //     const tile1 = this.tiles[1];

  //     if (tile0.numPointsX !== tile1.numPointsX) {
  //       console.log('tile widths differ');
  //     }
  //     else {
  //       for (let x = 0; x < tile0.numPointsX; x += 1) {
  //         [0, 2, 4].forEach((j) => {
  //           const tile1Value = tile1.positions[x * 5 + j];
  //           const tile0Value = tile0.positions[
  //             x * 2 * 5 + j
  //               + (tile0.numPointsY - 3) * (2 * tile0.numPointsX - 1) * 5
  //               + tile0.numPointsX * 5
  //           ];
  //           if (tile1Value !== tile0Value) {
  //             console.log(`tile edges differ at ${x}, ${j}: ${tile1Value} ${tile0Value}`);
  //           }
  //         });

  //         [0, 2, 4].forEach((j) => {
  //           const tile1Value = tile1.positions[
  //             x * 2 * 5 + j + tile1.numPointsX * 5
  //           ];
  //           const tile0Value = tile0.positions[
  //             x * 2 * 5 + j
  //               + (tile0.numPointsY - 2) * (2 * tile0.numPointsX - 1) * 5
  //               + tile0.numPointsX * 5
  //           ];
  //           if (tile0Value !== tile1Value) {
  //             console.log(`tile edges differ at ${x}, ${j}: ${tile0Value} ${tile1Value}`);
  //           }
  //         });
  //       }
  //     }
  //   }
  // }

  drawScene(): void {
    if (this.cameraOffset[2] !== 0) {
      // Clear the canvas before we start drawing on it.
      // eslint-disable-next-line no-bitwise
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      this.gl.useProgram(this.shader.shaderProgram);

      const projectionMatrix = this.getProjectionMatrix();
      const viewMatrix = this.getViewMatrix();

      this.gl.uniformMatrix4fv(
        this.shader.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
      );

      this.gl.uniformMatrix4fv(
        this.shader.uniformLocations.viewMatrix,
        false,
        viewMatrix,
      );

      this.gl.uniform4fv(this.shader.uniformLocations.fogColor, [1.0, 1.0, 1.0, 1.0]);
      this.gl.uniform1f(
        this.shader.uniformLocations.fogNormalizationFactor, this.fogNormalizationFactor,
      );

      this.tiles.forEach((tile) => {
        const modelMatrix = TerrainRenderer.getModelMatrix(
          tile.offset.x,
          tile.offset.y,
          0,
        );
        tile.tile.draw(modelMatrix, this.shader);
      });
    }
  }

  getProjectionMatrix(): mat4 {
    // Set up the projection matrix
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    return projectionMatrix;
  }

  getViewMatrix(): mat4 {
    const cameraTarget = vec3.fromValues(
      this.cameraFront[0] + this.cameraOffset[0],
      this.cameraFront[1] + this.cameraOffset[1],
      this.cameraFront[2] + this.cameraOffset[2],
    );

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, this.cameraOffset, cameraTarget, cameraUp);

    return viewMatrix;
  }

  static getModelMatrix(xOffset: number, yOffset: number, zOffset: number): mat4 {
    // const { startLatOffset, startLngOffset } = getStartOffset(this.position);

    const modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(xOffset, yOffset, zOffset));

    return modelMatrix;
  }
}

export default TerrainRenderer;
