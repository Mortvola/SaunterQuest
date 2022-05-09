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

Route.get('/', 'HomeController.index');
Route.get('/gear', 'HomeController.index');
Route.get('/food', 'HomeController.index');
Route.get('/blog', 'HomeController.index');
Route.get('/hike/:id', 'HomeController.index');
Route.get('/blog/:id', 'HomeController.blogPost');
Route.get('/photos', 'HomeController.index');

Route.get('/health', async ({ response }) => {
  const report = await HealthCheck.getReport();
  return response.ok(report);
});

Route.get('/sitemap.xml', 'BlogsController.getSitemap');

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

        Route.group(() => {
          Route.get('', 'PointsOfInterestController.get');
          Route.post('', 'PointsOfInterestController.add');
        })
          .prefix('/poi');

        Route.post('/photo-upload', 'HikesController.uploadPhoto');
        Route.get('/photo/:photoId', 'HikesController.getPhoto');

        Route.post('/hike-leg', 'HikesController.addLeg');

        Route.group(() => {
          Route.get('', 'HikesController.getBlackoutDates');
          Route.post('', 'HikesController.addBlackoutDates');
        })
          .prefix('/blackout-dates');
      })
        .prefix('/:hikeId');
    })
      .prefix('/hike');

    Route.group(() => {
      Route.patch('/:id', 'HikesController.updateBlackoutDates');
      Route.delete('/:id', 'HikesController.deleteBlackoutDates');
    })
      .prefix('/blackout-dates');

    Route.group(() => {
      Route.group(() => {
        Route.patch('', 'HikeLegsController.updateLeg');
        Route.delete('', 'HikeLegsController.deleteLeg');

        Route.group(() => {
          Route.post('/start-point', 'RouteController.addWaypoint');
          Route.post('/end-point', 'RouteController.addEndPoint');
          Route.post('/waypoint', 'RouteController.addWaypoint');
          Route.delete('/waypoint/:waypointId', 'RouteController.deleteWaypoint');
          Route.put('/waypoint/:waypointId/position', 'RouteController.updateWaypointPosition');
        })
          .prefix('/route');

        Route.group(() => {
          Route.post('', 'HikerProfilesController.addProfile');
          Route.put('/:profileId', 'HikerProfilesController.updateProfile');
          Route.delete('/:profileId', 'HikerProfilesController.deleteProfile');
        })
          .prefix('/hiker-profile');
      })
        .prefix('/:hikeLegId');
    })
      .prefix('/hike-leg');

    Route.group(() => {
      Route.post('', 'PhotosController.upload');

      Route.group(() => {
        Route.get('', 'PhotosController.getPhoto');
        Route.put('', 'HikesController.updatePhoto');
        Route.delete('', 'PhotosController.deletePhoto');
        Route.post('', 'PhotosController.process');
      })
        .prefix('/:photoId');
    })
      .prefix('/photo');

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
    Route.get('/route-group/:id', 'RouteGroupsController.getRouteGroup');

    Route.get('/photos', 'PhotosController.getPhotoList');

    Route.group(() => {
      Route.post('', 'BlogsController.create');
      Route.post('/publish', 'BlogsController.publish');
      Route.post('/unpublish/:id', 'BlogsController.unpublish');
      Route.put('', 'BlogsController.update');
      Route.post('/:blogId/photo', 'BlogsController.addPhoto');
    })
      .prefix('/blog');

    Route.group(() => {
      Route.delete('', 'BlogsController.deleteBlog');
    })
      .prefix('/blog/:blogId');
  })
    .prefix('/api');
})
  .middleware('auth');

Route.group(() => {
  Route.get('/poi/photos', 'PointsOfInterestController.getPhotos');

  Route.get('/blogs', 'BlogsController.get');

  Route.group(() => {
    Route.get('', 'BlogsController.getBlog');
    // Route.get('/blog/:blogId/photos', 'BlogsController.getPhotos');
    Route.get('/photo/:photoId', 'BlogsController.getPhoto');
    Route.post('/comment', 'BlogsController.comment');
    Route.get('/comments', 'BlogsController.getComments');
  })
    .prefix('/blog/:blogId');

  Route.group(() => {
    Route.group(() => {
      Route.get('/route', 'RouteController.get');
      Route.get('/schedule', 'SchedulesController.get');

      Route.group(() => {
        Route.get('', 'HikerProfilesController.get');
      })
        .prefix('/hiker-profile');

      Route.get('/route-group', 'RouteGroupsController.getHikeLegRouteGroup');
    })
      .prefix('/:hikeLegId');
  })
    .prefix('/hike-leg');
})
  .prefix('/api');
