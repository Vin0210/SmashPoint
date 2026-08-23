<?php

namespace App\Http\Controllers\Api;

use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use Swift_SwiftException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $this->validate($request, [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users',
            'password' => 'required|min:6',
            'phone'    => 'nullable|string|max:30',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'user'  => $user,
            'token' => $user->generateToken(),
        ], 201);
    }

    public function login(Request $request)
    {
        $this->validate($request, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }

        return response()->json([
            'user'  => $user,
            'token' => $user->generateToken(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $user->api_token = null;
        $user->save();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * PATCH /api/profile — update the signed-in user's details.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $this->validate($request, [
            'name'    => 'sometimes|required|string|max:255',
            'email'   => 'sometimes|required|email|max:255|unique:users,email,'.$user->id,
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
        ]);

        $user->fill($request->only('name', 'email', 'phone', 'address'));
        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * POST /api/profile/photo — multipart avatar upload.
     */
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();

        $this->validate($request, [
            'photo' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
        ]);

        $file = $request->file('photo');
        $name = 'avatar_'.$user->id.'_'.Str::random(10).'.'.strtolower($file->getClientOriginalExtension());

        Storage::disk('public')->putFileAs('avatars', $file, $name);

        if ($user->photo && Storage::disk('public')->exists('avatars/'.$user->photo)) {
            Storage::disk('public')->delete('avatars/'.$user->photo);
        }

        $user->photo = $name;
        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * PATCH /api/profile/password — change password while signed in.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $this->validate($request, [
            'current_password' => 'required',
            'password'         => 'required|min:6|confirmed',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Your current password is incorrect'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password updated']);
    }

    /**
     * POST /api/forgot-password — email a reset link.
     */
    public function forgotPassword(Request $request)
    {
        $this->validate($request, ['email' => 'required|email']);

        try {
            $response = $this->broker()->sendResetLink($request->only('email'));

            if ($response === Password::RESET_LINK_SENT) {
                return response()->json(['message' => 'If that email address exists, we have sent a reset link to it.']);
            }
        } catch (Swift_SwiftException $e) {
            Log::error('Failed to send password reset email: '.$e->getMessage());

            return response()->json(['message' => 'We could not send the email right now. Please try again later.'], 503);
        }

        // Same generic reply whether or not the account exists.
        return response()->json(['message' => 'If that email address exists, we have sent a reset link to it.']);
    }

    /**
     * POST /api/reset-password — consume a reset token.
     */
    public function resetPassword(Request $request)
    {
        $this->validate($request, [
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $response = $this->broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->api_token = null; // force re-login on other devices
                $user->setRememberToken(Str::random(60));
                $user->save();
            }
        );

        if ($response === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Your password has been reset. You can now sign in with your new password.']);
        }

        return response()->json(['message' => 'This reset link is invalid or has expired. Please request a new one.'], 422);
    }

    protected function broker()
    {
        return Password::broker();
    }
}
