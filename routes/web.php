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
use App\Http\Controllers\TileController;

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

    Route::get('/user/profile', 'UserController@getProfile');
    Route::put('/user/profile', 'UserController@putProfile');

    Route::get('/home', 'HomeController@index');

    Route::get('/gear', function ()
    {
        return view('gear');
    });

    Route::get('/hikes', function ($hikeId = null)
    {
        return (new HikeController())->get($hikeId);
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

//     Route::post('/hike/{hikeId}/pointOfInterest', function ($hikeId, Request $request)
//     {
//         return (new PointOfInterestController())->post($hikeId, $request);
//     });

    Route::put('/hike/{hikeId}/pointOfInterest/{poiId}', function ($hikeId, $poiId, Request $request)
    {
        return (new PointOfInterestController())->put($hikeId, $poiId, $request);
    });

    Route::delete('/hike/{hikeId}/pointOfInterest/{poiId}', function ($hikeId, $poiId)
    {
        return (new PointOfInterestController())->delete($hikeId, $poiId);
    });

    Route::get('/pointOfInterest', 'PointOfInterestController@get');
    Route::post('/pointOfInterest', 'PointOfInterestController@post');
    Route::delete('/pointOfInterest/{poiId}', 'PointOfInterestController@delete');

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
    Route::get('/map/whatishere', 'MapController@whatIsHere');
    Route::get('/map/trail/{lineId}', function ($lineId) { return (new MapController)->getTrailByLineId ($lineId);});

    Route::get('/tileList', 'MapController@getTileList');

    Route::get('/tile/{z}/{x}/{y}', function (Request $request, $z, $x, $y)
    {
        return (new TileController)->get ($request, 'images', $x, $y, $z);
    });

    Route::get('/terrain/{z}/{x}/{y}', function (Request $request, $z, $x, $y)
    {
        return (new TileController)->get ($request, 'terrain', $x, $y, $z);
    });
});
