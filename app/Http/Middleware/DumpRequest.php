<?php

namespace App\Http\Middleware;

use Closure;

class DumpRequest
{
    public function handle($request, Closure $next)
    {
        // Perform action

        error_log ($request);

        return $next($request);
    }
}
