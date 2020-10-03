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

Route.post('register', 'AuthController.register');
Route.post('/login', 'AuthController.login');

Route.post('/password/email', 'AuthController.forgotPassword');
Route.get('/password/reset/:id/:token', 'AuthController.resetPassword');
Route.post('/password/update', 'AuthController.updatePassword').as('updatePassword');

Route.get('/hikes', 'HikesController.get');
Route.post('/hike', 'HikesController.addHike');
Route.get('/hike/:hikeId/details', 'HikesController.getDetails');
Route.get('/hike/:hikeId/route', 'RouteController.get');
Route.post('/hike/:hikeId/route/start-point', 'RouteController.addStartPoint');
Route.post('/hike/:hikeId/route/end-point', 'RouteController.addEndPoint');
Route.post('/hike/:hikeId/route/waypoint', 'RouteController.addWaypoint');

Route.put('/hike/:hikeId/route/waypoint/:waypointId/position', 'RouteController.updateWaypointPosition');
