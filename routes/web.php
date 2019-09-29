<?php

use Illuminate\Http\Request;
use App\Http\Controllers\HikeController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\PointOfInterestController;
use App\Http\Controllers\ResupplyLocationController;
use App\Http\Controllers\HikerProfileController;
use App\Http\Controllers\TrailConditionController;
use App\Http\Controllers\ResupplyPlanController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::view ('/', 'welcome');

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');

Route::get('/hike/{hikeId}', function ($hikeId)
{
    $c = new HikeController();

    return $c->get($hikeId);
});

Route::get('/map/intersections', 'MapController@getIntersections');
Route::get('/tileList', 'MapController@getTileList');
Route::get('/tile', 'TileController@get');

Route::post('/hike', 'HikeController@post');
Route::delete('/hike/{hikeId}', function ($hikeId)
{
    $c = new HikeController();

    return $c->delete($hikeId);
});

Route::get('/hike/{hikeId}/route', function ($hikeId)
{
    $r = new RouteController();

    return $r->get($hikeId);
});

Route::put('/hike/{hikeId}/route/startPoint', function ($hikeId, Request $request)
{
    $c = new RouteController();

    return $c->setStartPoint($hikeId, $request);
});

Route::put('/hike/{hikeId}/route/endPoint', function ($hikeId, Request $request)
{
    $c = new RouteController();

    return $c->setEndPoint($hikeId, $request);
});

Route::get('/hike/{hikeId}/schedule', function ($hikeId)
{
    $c = new ScheduleController();

    return $c->get($hikeId);
});

// Point of Interest operations
Route::get('/hike/{hikeId}/pointOfInterest', function ($hikeId)
{
    $c = new PointOfInterestController();

    return $c->get($hikeId);
});

Route::post('/pointOfInterest', 'PointOfInterestController@post');
Route::put('/pointOfInterest', 'PointOfInterestController@put');
Route::delete('/pointOfInterest', 'PointOfInterestController@delete');

Route::get('/hike/{hikeId}/resupplyLocation', function ($hikeId)
{
    $c = new ResupplyLocationController();

    return $c->get($hikeId);
});

Route::get('/hike/{hikeId}/hikerProfile', function ($hikeId)
{
    $c = new HikerProfileController();

    return $c->get($hikeId);
});

Route::post('/hikerProfile', 'HikerProfileController@post');
Route::put('/hikerProfile', 'HikerProfileController@put');
Route::delete('/hikerProfile', 'HikerProfileController@delete');

Route::get('/hike/{hikeId}/trailCondition', function ($hikeId)
{
    $c = new TrailConditionController();

    return $c->get($hikeId);
});

Route::get('/hike/{hikeId}/resupplyPlan', function ($hikeId)
{
    $c = new ResupplyPlanController();

    return $c->get($hikeId);
});

Route::get('/exportTrail', 'ExportController@get');

Route::get('/elevation', 'ElevationController@get');

