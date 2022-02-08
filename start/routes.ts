/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes/index.ts` as follows
|
| import './cart'
| import './customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck';
import Route from '@ioc:Adonis/Core/Route';
import HikesController from 'App/Controllers/Http/HikesController';

Route.get('/', 'HomeController.index');
Route.get('/gear', 'HomeController.index');
Route.get('/food', 'HomeController.index');
Route.get('/hike/:id', 'HomeController.index');
Route.get('/blog/:id', 'HomeController.index');

Route.get('/health', async ({ response }) => {
  const report = await HealthCheck.getReport();
  return response.ok(report);
});

Route.get('/signin', 'HomeController.index');

Route.post('register', 'AuthController.register');
Route.post('/login', 'AuthController.login');
Route.post('/logout', 'AuthController.logout');

Route.get('/user/profile', 'UsersController.getProfile');
Route.put('/user/profile', 'UsersController.putProfile');

Route.post('/password/email', 'AuthController.forgotPassword');
Route.get('/password/reset/:id/:token', 'AuthController.resetPassword');
Route.post('/password/update', 'AuthController.updatePassword').as('updatePassword');
Route.post('/password/change', 'AuthController.changePassword');

Route.group(() => {
  Route.group(() => {
    Route.get('/hikes', 'HikesController.get');

    Route.group(() => {
      Route.post('/', 'HikesController.addHike');

      Route.group(() => {
        Route.get('', 'HikesController.getHike');
        Route.put('/', 'HikesController.update');
        Route.patch('/', 'HikesController.update');
        Route.delete('/', 'HikesController.delete');
        Route.get('/details', 'HikesController.getDetails');

        Route.get('/poi', 'PointsOfInterestController.get');
        Route.post('/poi', 'PointsOfInterestController.add');

        Route.post('/photo-upload', 'HikesController.uploadPhoto');
        Route.get('/photo/:photoId', 'HikesController.getPhoto');

        Route.post('/hike-leg', 'HikesController.addLeg');
      })
        .prefix('/:hikeId');
    })
      .prefix('/hike');

    Route.group(() => {
      Route.group(() => {
        Route.delete('', 'HikesController.deleteLeg');
        Route.get('/route', 'RouteController.get');
        Route.get('/schedule', 'SchedulesController.get');

        Route.group(() => {
          Route.post('/start-point', 'RouteController.addWaypoint');
          Route.post('/end-point', 'RouteController.addEndPoint');
          Route.post('/waypoint', 'RouteController.addWaypoint');
          Route.delete('/waypoint/:waypointId', 'RouteController.deleteWaypoint');
          Route.put('/waypoint/:waypointId/position', 'RouteController.updateWaypointPosition');
        })
          .prefix('/route');

        Route.group(() => {
          Route.get('', 'HikerProfilesController.get');
          Route.post('', 'HikerProfilesController.addProfile');
          Route.put('/:profileId', 'HikerProfilesController.updateProfile');
          Route.delete('/:profileId', 'HikerProfilesController.deleteProfile');
        })
          .prefix('/hiker-profile');
      })
        .prefix('/:hikeLegId');
    })
      .prefix('/hike-leg');

    Route.put('/photo/:photoId', 'HikesController.updatePhoto');

    Route.group(() => {
      Route.get('/configuration', 'GearConfigurationsController.get');
      Route.post('/configuration', 'GearConfigurationsController.add');
      Route.put('/configuration/:configId', 'GearConfigurationsController.update');
      Route.delete('/configuration/:configId', 'GearConfigurationsController.delete');
      Route.get('/configuration/:configId/items', 'GearConfigurationsController.getItems');
      Route.post('/configuration/:configId/item', 'GearConfigurationsController.addItem');
      Route.put('/configuration/:configId/item/:itemId', 'GearConfigurationsController.updateItem');
      Route.delete('/configuration/:configId/item/:itemId', 'GearConfigurationsController.deleteItem');

      Route.get('/item', 'GearItemsController.get');
      Route.put('/item/:itemId', 'GearItemsController.updateItem');
      Route.post('/item', 'GearItemsController.addItem');
      Route.delete('/item/:itemId', 'GearItemsController.deleteItem');
    })
      .prefix('/gear');

    Route.get('/poi/rv', 'PointsOfInterestController.getRvSites');
    Route.get('/campsites', 'PointsOfInterestController.getCampsites');
    Route.get('/post-offices', 'PointsOfInterestController.getPostOffices');
    Route.get('/cities', 'PointsOfInterestController.getCities');

    Route.get('/route-groups', 'RouteGroupsController.get');
  })
    .middleware('auth');

  Route.get('/poi/photos', 'PointsOfInterestController.getPhotos');

  Route.get('/blogs', 'BlogsController.get');
  Route.get('/blog/:blogId', 'BlogsController.getBlog');
  Route.get('/blog/:blogId/photos', 'BlogsController.getPhotos');
  Route.get('/blog/:blogId/photo/:photoId', 'BlogsController.getPhoto');
})
  .prefix('/api');
