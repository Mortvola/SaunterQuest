<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GearConfigurationItem extends Model
{
    protected $table = 'gear_configuration_items';
    public $timestamps = false;

    protected $hidden = [Hike::CREATED_AT, Hike::UPDATED_AT];

    protected $fillable = ['gear_item_id', 'quantity', 'worn'];

    public function gearItem ()
    {
        return $this->belongsTo('App\GearItem');
    }
}
