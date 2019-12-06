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
use App\Http\Controllers\MapController;
use App\Http\Controllers\GearController;
use App\Http\Controllers\GearConfigurationController;
use App\Http\Controllers\GearConfigurationItemController;
use App\Http\Controllers\GearItemController;

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

Route::view ('/', 'welcome')->name('welcome');

Auth::routes();

Route::middleware(['auth'])->group(function () {

    Route::get('/home', 'HomeController@index')->name('home');

    Route::get('/gear', 'GearController@index');

    Route::post('/gear', 'GearController@post');

    // Gear item interface

    Route::get('/gear/item', 'GearItemController@get');

    Route::post('/gear/item', 'GearItemController@post');

    Route::put('/gear/item/{itemId}', function ($itemId, Request $request)
    {
        return (new GearItemController())->put($itemId, $request);
    });

    Route::delete('/gear/item/{itemId}', function ($itemId)
    {
        return (new GearItemController())->delete($itemId);
    });

    // Gear configuration interface

    Route::get('/gear/configuration', 'GearConfigurationController@get');
    Route::post('/gear/configuration', 'GearConfigurationController@post');
    Route::delete('/gear/configuration/{gearConfigId}', function ($gearConfigId)
    {
        return (new GearConfigurationController())->delete($gearConfigId);
    });

    // Gear configuration item interface

    Route::post('/gear/configuration/item', 'GearConfigurationItemController@post');
    Route::put('/gear/configuration/item/{itemId}', function ($itemId, Request $request)
    {
        return (new GearConfigurationItemController())->put($itemId, $request);
    });

    Route::delete('/gear/configuration/item/{itemId}', function ($itemId)
    {
        return (new GearConfigurationItemController())->delete($itemId);
    });

    Route::post('/hike', 'HikeController@post');

    Route::get('/hike/{hikeId}', function ($hikeId = null)
    {
        return (new HikeController())->get($hikeId);
    });

    Route::put('/hike/{hikeId}', function ($hikeId, Request $request)
    {
        return (new HikeController())->put($hikeId, $request);
    });

    Route::delete('/hike/{hikeId}', function ($hikeId)
    {
        return (new HikeController())->delete($hikeId);
    });

    Route::get('/hike/{hikeId}/route', function ($hikeId)
    {
        return (new RouteController())->get($hikeId);
    });

    // Start point operations

    Route::put('/hike/{hikeId}/route/startPoint', function ($hikeId, Request $request)
    {
        return (new RouteController())->setStartPoint($hikeId, $request);
    });

    Route::post('/hike/{hikeId}/route/startPoint', function ($hikeId, Request $request)
    {
        return (new RouteController())->addStartPoint($hikeId, $request);
    });

    // End point operations

    Route::put('/hike/{hikeId}/route/endPoint', function ($hikeId, Request $request)
    {
        return (new RouteController())->setEndPoint($hikeId, $request);
    });

    Route::post('/hike/{hikeId}/route/endPoint', function ($hikeId, Request $request)
    {
        return (new RouteController())->addEndPoint($hikeId, $request);
    });

    // Waypoint operations

    Route::post('/hike/{hikeId}/route/waypoint', function ($hikeId, Request $request)
    {
        return (new RouteController())->addWaypoint($hikeId, $request);
    });

    Route::put('/hike/{hikeId}/route/waypoint/order', function ($hikeId, Request $request)
    {
        return (new RouteController())->updateWaypoints($hikeId, $request);
    });

    Route::put('/hike/{hikeId}/route/waypoint/{waypointId}/position', function ($hikeId, $waypointId, Request $request)
    {
        return (new RouteController())->updateWaypointPosition ($hikeId, $waypointId, $request);
    });

    Route::put('/hike/{hikeId}/route/waypoint/{waypointId}/details', function ($hikeId, $waypointId, Request $request)
    {
        return (new RouteController())->updateWaypointDetails($hikeId, $waypointId, $request);
    });

    Route::delete('/hike/{hikeId}/route/waypoint/{waypointId}', function ($hikeId, $waypointId)
    {
        return (new RouteController())->deleteWaypoint($hikeId, $waypointId);
    });

    // Schedule operations

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

    Route::get('/elevation/point', 'ElevationController@get');
    Route::put('/elevation/file', 'ElevationController@downloadElevations');

    Route::get('/map/intersections', 'MapController@getIntersections');
    Route::get('/map/nearestTrail', 'MapController@getNearestTrail');
    Route::get('/map/nearestGraph', 'MapController@getNearestGraph');
    Route::get('/map/trail/{lineId}', function ($lineId) { return (new MapController)->getTrailByLineId ($lineId);});

    Route::get('/tileList', 'MapController@getTileList');
    Route::get('/tile', 'TileController@get');
});
