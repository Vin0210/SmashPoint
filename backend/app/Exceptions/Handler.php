<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Auth\Access\AuthorizationException::class,
        \Symfony\Component\HttpKernel\Exception\HttpException::class,
        \Illuminate\Database\Eloquent\ModelNotFoundException::class,
        \Illuminate\Session\TokenMismatchException::class,
        \Illuminate\Validation\ValidationException::class,
    ];

    /**
     * Report or log an exception.
     *
     * @param  \Exception  $exception
     * @return void
     */
    public function report(Exception $exception)
    {
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $exception
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $exception)
    {
        // Always answer API requests with JSON - never HTML error pages.
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderApiException($exception);
        }

        return parent::render($request, $exception);
    }

    protected function renderApiException(Exception $exception)
    {
        if ($exception instanceof ValidationException) {
            $errors = [];
            if (method_exists($exception, 'errors')) {
                $errors = $exception->errors();
            } elseif ($exception->validator) {
                $errors = $exception->validator->errors()->getMessages();
            }

            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => $errors,
            ], 422);
        }

        if ($exception instanceof AuthenticationException) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($exception instanceof ModelNotFoundException) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        $status = $exception instanceof HttpException ? $exception->getStatusCode() : 500;

        $message = $exception->getMessage();
        if (! $message || ($status >= 500 && ! config('app.debug'))) {
            $message = $status >= 500 ? 'Server Error' : 'Error';
        }

        return response()->json(['message' => $message], $status);
    }

    /**
     * Convert an authentication exception into an unauthenticated response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Auth\AuthenticationException  $exception
     * @return \Illuminate\Http\Response
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return redirect()->guest(route('login'));
    }
}
