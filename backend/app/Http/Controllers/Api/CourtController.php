<?php

namespace App\Http\Controllers\Api;

use App\Court;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CourtController extends Controller
{
    public function index()
    {
        return response()->json(Court::with('photos')->orderBy('id')->get());
    }

    public function show(Court $court)
    {
        return response()->json($court->load('photos'));
    }
}
