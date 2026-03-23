<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Non autenticato.'], 401);
        });
        // Catches "Route [login] not defined" thrown when Sanctum tries to redirect unauthenticated API requests
        $exceptions->render(function (\Symfony\Component\Routing\Exception\RouteNotFoundException $e, Request $request) {
            return response()->json(['message' => 'Non autenticato.'], 401);
        });
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
            return response()->json(['message' => 'Risorsa non trovata.'], 404);
        });
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            $first = array_values($e->errors())[0][0] ?? 'Dati non validi.';
            return response()->json(['message' => $first, 'errors' => $e->errors()], 422);
        });
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, Request $request) {
            return response()->json(['message' => $e->getMessage() ?: 'Errore.'], $e->getStatusCode());
        });
    })->create();
