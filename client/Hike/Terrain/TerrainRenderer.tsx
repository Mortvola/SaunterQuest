import { vec3, mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import TerrainTile, { TerrainRendererInterface } from './TerrainTile';
import { LatLng } from '../../state/Types';
import { Location } from './Terrain';
import { isElevationResponse } from '../../../common/ResponseTypes';
import { lat2tile, lng2tile } from '../../utilities';
import Shader from './Shader';

const zNear = 1;
const zFar = 16000.0;

type Tile = {
  offset: { x: number, y: number},
  tile: TerrainTile,
  order: number,
}

const tilePadding = 3;

class TerrainRenderer implements TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;

  pathFinderUrl: string;

  tilesMatrix: Tile[][];

  tiles: Tile[] = [];

  tilePadding = 3;

  position: LatLng;

  elevation: number | null = null;

  pitch = 0;

  yaw = 90;

  shader: Shader;

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
    this.gl.enable(this.gl.CULL_FACE);

    this.tilesMatrix = new Array(tilePadding * 2 + 1);
    for (let y = 0; y < this.tilesMatrix.length; y += 1) {
      this.tilesMatrix[y] = new Array(tilePadding * 2 + 1);
    }

    this.shader = new Shader(this.gl);

    this.loadTiles();

    this.loadElevation();
  }

  async loadTiles(): Promise<void> {
    const zoom = 13;
    const x = lng2tile(this.position.lng, zoom);
    const y = lat2tile(this.position.lat, zoom);

    const promises: Promise<void>[] = [];

    for (let y2 = -tilePadding; y2 <= tilePadding; y2 += 1) {
      for (let x2 = -tilePadding; x2 <= tilePadding; x2 += 1) {
        promises.push(
          this.addTile(x2 + tilePadding, y2 + tilePadding, { x: x + x2, y: y + y2, zoom }),
        );
      }
    }

    await Promise.all(promises);

    this.tiles.push(this.tilesMatrix[tilePadding][tilePadding]);

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
        this.elevation = body.ele;
        this.requestRender();
      }
    }
    else {
      throw new Error('invalid response');
    }
  }

  requestRender(): void {
    this.drawScene();
  }

  async addTile(x: number, y: number, location: Location): Promise<void> {
    const tile = new TerrainTile(this, location);
    this.tilesMatrix[y][x] = { offset: { x: 0, y: 0 }, tile, order: 0 };
    return tile.loadTerrain();
  }

  updateLookAt(yawChange: number, pitchChange: number): void {
    this.yaw += yawChange;
    this.pitch += pitchChange;

    this.pitch = Math.max(Math.min(this.pitch, 89), -89);

    this.drawScene();
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
    if (this.elevation !== null) {
      // Clear the canvas before we start drawing on it.
      // eslint-disable-next-line no-bitwise
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

      // Set up the normal matrix
      // const normalMatrix = mat4.create();
      // mat4.invert(normalMatrix, modelViewMatrix);
      // mat4.transpose(normalMatrix, normalMatrix);

      // this.checkPoints();

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
      this.gl.uniform1f(this.shader.uniformLocations.fogNear, 8000.0);
      this.gl.uniform1f(this.shader.uniformLocations.fogFar, 16000.0);

      this.tiles.forEach((tile) => {
        const modelMatrix = TerrainRenderer.getModelMatrix(tile.offset.x, tile.offset.y);
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
    // Set up the view matrix
    if (this.elevation === null) {
      throw new Error('elevation is null');
    }

    // const { startLatOffset, startLngOffset } = getStartOffset(this.position);

    const viewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(0, 0, this.elevation + 100);

    const x = Math.cos((this.yaw * Math.PI) / 180.0) * Math.cos((this.pitch * Math.PI) / 180.0);
    const y = Math.sin((this.yaw * Math.PI) / 180.0) * Math.cos((this.pitch * Math.PI) / 180.0);
    const z = Math.sin((this.pitch * Math.PI) / 180.0);

    const cameraTarget = vec3.fromValues(x, y, z);

    vec3.normalize(cameraTarget, cameraTarget);

    cameraTarget[0] += cameraPos[0];
    cameraTarget[1] += cameraPos[1];
    cameraTarget[2] += cameraPos[2];

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    mat4.lookAt(viewMatrix, cameraPos, cameraTarget, cameraUp);

    return viewMatrix;
  }

  static getModelMatrix(xOffset: number, yOffset: number): mat4 {
    // const { startLatOffset, startLngOffset } = getStartOffset(this.position);

    const modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(xOffset, yOffset, 0));

    return modelMatrix;
  }
}

export default TerrainRenderer;
