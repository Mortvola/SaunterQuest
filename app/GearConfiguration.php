<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GearConfiguration extends Model
{
    protected $table = 'gear_configurations';
    public $timestamps = false;

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT, 'user_id'];

    protected $fillable = ['user_id', 'name'];

    function user ()
    {
        return $this->belongsTo('App\User', 'user_id');
    }

    public function gearConfigurationItems ()
    {
        return $this->hasMany('\App\GearConfigurationItem', 'gear_configuration_id');
    }
}
