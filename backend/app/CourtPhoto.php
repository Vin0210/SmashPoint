<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CourtPhoto extends Model
{
    protected $fillable = ['court_id', 'filename', 'sort_order'];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return url('/photos/'.$this->filename);
    }

    public function court()
    {
        return $this->belongsTo(Court::class);
    }
}
