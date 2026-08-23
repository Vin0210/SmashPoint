<?php

namespace App\Http\Middleware;

use Closure;

class CheckAdmin
{
    /**
     * Ensure the authenticated user has the admin role.
     */
    public function handle($request, Closure $next)
    {
        if (! $request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Admin access required'], 403);
        }

        return $next($request);
    }
}
