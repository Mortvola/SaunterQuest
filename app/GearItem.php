<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GearItem extends Model
{
    protected $table = 'gear_items';
    public $timestamps = false;

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT, 'user_id'];

    protected $fillable = ['user_id', 'name', 'description', 'weight', 'unit_of_measure', 'system', 'consumable'];

    function user ()
    {
        return $this->belongsTo('App\User', 'user_id');
    }

//     public function gearConfigurationItems ()
//     {
//         return $this->belongsToMany('\App\GearConfigurationItem', 'gear_item_id');
//     }
}
