<?php

namespace App;

use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable;

    protected $table = 'users';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'username', 'email', 'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function hikes ()
    {
        return $this->hasMany('\App\Hike', 'user_id');
    }

    public function endHikeDayExtension ()
    {
        return $this->end_hike_day_extension;
    }

    public function profile ()
    {
        return (object)[
            "paceFactor" => $this->pace_factor,
            "startTime" => $this->start_time,
            "endTime" => $this->end_time,
            "breakDuration" => $this->break_duration,
            "endDayExtension" => $this->end_day_extension,
            "endHikeDayExtension" => $this->end_hike_day_extension
        ];
    }

    public function gearItems ()
    {
        return $this->hasMany('\App\GearItem', 'user_id');
    }

    public function gearConfigurations ()
    {
        return $this->hasMany('\App\GearConfiguration', 'user_id');
    }
}
