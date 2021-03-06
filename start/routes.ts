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

import Route from '@ioc:Adonis/Core/Route';

Route.get('/', 'HomeController.index');
Route.get('/gear', 'HomeController.index');
Route.get('/food', 'HomeController.index');
Route.get('/hike/:id', 'HomeController.index');

Route.post('register', 'AuthController.register');
Route.post('/login', 'AuthController.login');
Route.post('/logout', 'AuthController.logout');

Route.get('/user/profile', 'UsersController.getProfile');
Route.put('/user/profile', 'UsersController.putProfile');

Route.post('/password/email', 'AuthController.forgotPassword');
Route.get('/password/reset/:id/:token', 'AuthController.resetPassword');
Route.post('/password/update', 'AuthController.updatePassword').as('updatePassword');
Route.post('/password/change', 'AuthController.changePassword');

Route.get('/hikes', 'HikesController.get');
Route.post('/hike', 'HikesController.addHike');
Route.put('/hike/:hikeId', 'HikesController.update');
Route.delete('/hike/:hikeId', 'HikesController.delete');
Route.get('/hike/:hikeId/details', 'HikesController.getDetails');
Route.get('/hike/:hikeId/route', 'RouteController.get');
Route.post('/hike/:hikeId/route/start-point', 'RouteController.addWaypoint');
Route.post('/hike/:hikeId/route/end-point', 'RouteController.addEndPoint');
Route.post('/hike/:hikeId/route/waypoint', 'RouteController.addWaypoint');
Route.delete('/hike/:hikeId/route/waypoint/:waypointId', 'RouteController.deleteWaypoint');

Route.put('/hike/:hikeId/route/waypoint/:waypointId/position', 'RouteController.updateWaypointPosition');

Route.get('/hike/:hikeId/hiker-profile', 'HikerProfilesController.get');
Route.post('/hike/:hikeId/hiker-profile', 'HikerProfilesController.addProfile');
Route.put('/hike/:hikeId/hiker-profile/:profileId', 'HikerProfilesController.updateProfile');
Route.delete('/hike/:hikeId/hiker-profile/:profileId', 'HikerProfilesController.deleteProfile');

Route.get('/hike/:hikeId/schedule', 'SchedulesController.get');

Route.get('/gear/configuration', 'GearConfigurationsController.get');
Route.post('/gear/configuration', 'GearConfigurationsController.add');
Route.put('/gear/configuration/:configId', 'GearConfigurationsController.update');
Route.delete('/gear/configuration/:configId', 'GearConfigurationsController.delete');
Route.get('/gear/configuration/:configId/items', 'GearConfigurationsController.getItems');
Route.post('/gear/configuration/:configId/item', 'GearConfigurationsController.addItem');
Route.put('/gear/configuration/:configId/item/:itemId', 'GearConfigurationsController.updateItem');
Route.delete('/gear/configuration/:configId/item/:itemId', 'GearConfigurationsController.deleteItem');

Route.get('/gear/item', 'GearItemsController.get');
Route.put('/gear/item/:itemId', 'GearItemsController.updateItem');
Route.post('/gear/item', 'GearItemsController.addItem');
Route.delete('/gear/item/:itemId', 'GearItemsController.deleteItem');
