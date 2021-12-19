import { vec3, mat4 } from 'gl-matrix';
import TerrainTile, { TerrainRendererInterface } from './TerrainTile';
import { HikeInterface, LatLng } from '../../state/Types';
import { Location } from './Terrain';
import {
  degToRad, latLngToTerrainTile, latOffset, terrainTileToLatLng,
} from '../../utilities';
import TerrainShader from './Shaders/TerrainShader';
import PhotoShader from './Shaders/PhotoShader';

type Tile = {
  offset: { x: number, y: number},
  tile: TerrainTile,
  order: number,
}

const cameraZOffset = 2;

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

  position: LatLng;

  cameraOffset: vec3 = [0, 0, 0];

  cameraFront: vec3 = [0, 1, 0];

  velocity = 0;

  upVelocity = 0;

  previousTimestamp: number | null = null;

  pitch = 0;

  yaw = 90;

  fogNormalizationFactor = 0;

  terrainShader: TerrainShader;

  photoShader: PhotoShader;

  startFpsTime: number | null = null;

  framesRendered = 0;

  #render = false;

  onFpsChange: (fps: number) => void;

  onLoadChange: (percentComplete: number) => void;

  hike: HikeInterface;

  constructor(
    gl: WebGL2RenderingContext,
    position: LatLng,
    hike: HikeInterface,
    tileServerUrl: string,
    pathFinderUrl: string,
    onFpsChange: (fps: number) => void,
    onLoadChange: (percentComplete: number) => void,
  ) {
    this.gl = gl;
    this.pathFinderUrl = pathFinderUrl;
    this.tileServerUrl = tileServerUrl;
    this.position = position;
    this.onFpsChange = onFpsChange;
    this.onLoadChange = onLoadChange;
    this.hike = hike;

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

    this.terrainShader = new TerrainShader(this.gl);

    this.photoShader = new PhotoShader(this.gl);

    this.loadTiles();
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

            const newCameraOffset: vec3 = [0, 0, 0];

            vec3.scaleAndAdd(
              newCameraOffset,
              this.cameraOffset,
              this.cameraFront,
              this.velocity / elapsedTime,
            );

            // this.cameraOffset[2] += this.upVelocity / elapsedTime;
            // If the camera x/y position has changed then updated the elevation (z).
            if (newCameraOffset[0] !== this.cameraOffset[0]
              || newCameraOffset[1] !== this.cameraOffset[1]) {
              [this.cameraOffset[0], this.cameraOffset[1]] = newCameraOffset;

              if (this.tiles[0]) {
                this.cameraOffset[2] = this.tiles[0].tile.getElevation(
                  this.cameraOffset[0],
                  this.cameraOffset[1],
                ) + cameraZOffset;
              }
            }
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
    const [x, y] = latLngToTerrainTile(this.position.lat, this.position.lng, zoom);
    const totalTiles = (tilePadding * 2 + 1) ** 2;
    let tilesLoaded = 0;
    const promises: Promise<void>[] = [];

    const handleTileLoaded = () => {
      tilesLoaded += 1;
      this.onLoadChange(tilesLoaded / totalTiles);
    };

    for (let y2 = -tilePadding; y2 <= tilePadding; y2 += 1) {
      for (let x2 = -tilePadding; x2 <= tilePadding; x2 += 1) {
        promises.push(
          this.addTile(
            x2 + tilePadding,
            y2 + tilePadding,
            { x: x + x2, y: y - y2, zoom },
            handleTileLoaded,
          ),
        );
      }
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

    const tileCenter = terrainTileToLatLng(x, y, zoom);
    const xOffset = -latOffset(this.position.lng, tileCenter.lng);
    const yOffset = -latOffset(this.position.lat, tileCenter.lat);
    this.cameraOffset = [
      xOffset,
      yOffset,
      this.tiles[0].tile.getElevation(xOffset, yOffset) + cameraZOffset,
    ];
  }

  async addTile(x: number, y: number, location: Location, onTileLoaded: () => void): Promise<void> {
    const tile = new TerrainTile(this, this.hike.id, location, this.photoShader);
    this.tilesMatrix[y][x] = { offset: { x: 0, y: 0 }, tile, order: 0 };
    return tile.load(this.terrainShader, onTileLoaded);
  }

  updateLookAt(yawChange: number, pitchChange: number): void {
    this.yaw += yawChange;
    this.pitch += pitchChange;

    this.pitch = Math.max(Math.min(this.pitch, 89), -89);

    const x = Math.cos(degToRad(this.yaw) * Math.cos(degToRad(this.pitch)));
    const y = Math.sin(degToRad(this.yaw) * Math.cos(degToRad(this.pitch)));
    const z = Math.sin(degToRad(this.pitch));

    const cameraFront = vec3.fromValues(x, y, z);

    vec3.normalize(this.cameraFront, cameraFront);
  }

  setVelocity(velocity: number): void {
    this.velocity = velocity;
  }

  setUpVelocity(velocity: number): void {
    this.upVelocity = velocity;
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
    if (this.tiles[0]) {
      // Clear the canvas before we start drawing on it.
      // eslint-disable-next-line no-bitwise
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
      this.gl.disable(this.gl.BLEND);

      const projectionMatrix = this.getProjectionMatrix(45); // 63.5);
      const viewMatrix = this.getViewMatrix();

      const lightVector = vec3.fromValues(0, -1, -1);
      vec3.normalize(lightVector, lightVector);

      this.tiles.forEach((tile) => {
        this.gl.useProgram(this.terrainShader.shaderProgram);

        this.gl.uniformMatrix4fv(
          this.terrainShader.uniformLocations.projectionMatrix,
          false,
          projectionMatrix,
        );

        this.gl.uniformMatrix4fv(
          this.terrainShader.uniformLocations.viewMatrix,
          false,
          viewMatrix,
        );

        this.gl.uniform3fv(this.terrainShader.uniformLocations.lightVector, lightVector);

        this.gl.uniform4fv(this.terrainShader.uniformLocations.fogColor, [1.0, 1.0, 1.0, 1.0]);
        this.gl.uniform1f(
          this.terrainShader.uniformLocations.fogNormalizationFactor, this.fogNormalizationFactor,
        );

        const modelMatrix = TerrainRenderer.getModelMatrix(
          tile.offset.x,
          tile.offset.y,
          0,
        );

        tile.tile.draw(projectionMatrix, viewMatrix, modelMatrix, this.terrainShader);
      });

      // Draw Transparent
      this.tiles.forEach((tile) => {
        this.gl.useProgram(this.terrainShader.shaderProgram);

        this.gl.uniformMatrix4fv(
          this.terrainShader.uniformLocations.projectionMatrix,
          false,
          projectionMatrix,
        );

        this.gl.uniformMatrix4fv(
          this.terrainShader.uniformLocations.viewMatrix,
          false,
          viewMatrix,
        );

        this.gl.uniform3fv(this.terrainShader.uniformLocations.lightVector, lightVector);

        this.gl.uniform4fv(this.terrainShader.uniformLocations.fogColor, [1.0, 1.0, 1.0, 1.0]);
        this.gl.uniform1f(
          this.terrainShader.uniformLocations.fogNormalizationFactor, this.fogNormalizationFactor,
        );

        const modelMatrix = TerrainRenderer.getModelMatrix(
          tile.offset.x,
          tile.offset.y,
          0,
        );

        tile.tile.drawTransparent(projectionMatrix, viewMatrix, modelMatrix, this.terrainShader);
      });
    }
  }

  getProjectionMatrix(fieldOfView: number): mat4 {
    // Set up the projection matrix
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();

    const zNear = 1;
    const zFar = 16000.0;

    mat4.perspective(projectionMatrix,
      degToRad(fieldOfView),
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
