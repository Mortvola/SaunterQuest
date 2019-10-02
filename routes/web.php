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
use App\Http\Controllers\ExportController;

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

Route::post('/hike', 'HikeController@post');

Route::get('/hike/{hikeId}', function ($hikeId = null)
{
    return (new HikeController())->get($hikeId);
});

Route::delete('/hike/{hikeId}', function ($hikeId)
{
    return (new HikeController())->delete($hikeId);
});

Route::get('/hike/{hikeId}/route', function ($hikeId)
{
    return (new RouteController())->get($hikeId);
});

Route::put('/hike/{hikeId}/route/startPoint', function ($hikeId, Request $request)
{
    return (new RouteController())->setStartPoint($hikeId, $request);
});

Route::put('/hike/{hikeId}/route/endPoint', function ($hikeId, Request $request)
{
    return (new RouteController())->setEndPoint($hikeId, $request);
});

Route::get('/hike/{hikeId}/schedule', function ($hikeId)
{
    return (new ScheduleController())->get($hikeId);
});

// Point of Interest operations
Route::get('/hike/{hikeId}/pointOfInterest', function ($hikeId)
{
    return (new PointOfInterestController())->get($hikeId);
});

Route::post('/hike/{hikeId}/pointOfInterest', function ($hikeId, Request $request)
{
    return (new PointOfInterestController())->post($hikeId, $request);
});

Route::put('/hike/{hikeId}/pointOfInterest/{poiId}', function ($hikeId, $poiId, Request $request)
{
    return (new PointOfInterestController())->put($hikeId, $poiId, $request);
});

Route::delete('/hike/{hikeId}/pointOfInterest/{poiId}', function ($hikeId, $poiId)
{
    return (new PointOfInterestController())->delete($hikeId, $poiId);
});

Route::get('/hike/{hikeId}/resupplyLocation', function ($hikeId)
{
    return (new ResupplyLocationController())->get($hikeId);
});

Route::get('/hike/{hikeId}/hikerProfile', function ($hikeId)
{
    return (new HikerProfileController())->get($hikeId);
});

Route::post('/hike/{hikeId}/hikerProfile', function ($hikeId, Request $request)
{
    return (new HikerProfileController())->post($hikeId, $request);
});

Route::put('/hike/{hikeId}/hikerProfile/{hikerProfileId}', function ($hikeId, $hikerProfileId, Request $request)
{
    return (new HikerProfileController())->put($hikeId, $hikerProfileId, $request);
});

Route::delete('/hike/{hikeId}/hikerProfile/{hikerProfileId}', function ($hikeId, $hikerProfileId)
{
    return (new HikerProfileController())->delete($hikeId, $hikerProfileId);
});

Route::get('/hike/{hikeId}/trailCondition', function ($hikeId)
{
    return (new TrailConditionController())->get($hikeId);
});

Route::get('/hike/{hikeId}/resupplyPlan', function ($hikeId)
{
    return (new ResupplyPlanController())->get($hikeId);
});

Route::get('/hike/{hikeId}/export', function ($hikeId, Request $request)
{
    return (new ExportController())->get($hikeId, $request);
});

Route::get('/elevation', 'ElevationController@get');

Route::get('/map/intersections', 'MapController@getIntersections');
Route::get('/tileList', 'MapController@getTileList');
Route::get('/tile', 'TileController@get');

