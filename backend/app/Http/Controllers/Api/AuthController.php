<?php

namespace App\Http\Controllers\Api;

use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
     * POST /api/forgot-password — email a 6-digit reset code.
     */
    public function forgotPassword(Request $request)
    {
        $this->validate($request, ['email' => 'required|email']);

        $email = $request->input('email');
        $user = \App\User::where('email', $email)->first();

        if ($user) {
            $code = (string) random_int(100000, 999999);

            DB::table('password_resets')->updateOrInsert(
                ['email' => $email],
                [
                    'token'      => Hash::make($code),
                    'created_at' => \Carbon\Carbon::now(),
                ]
            );

            try {
                Mail::to($email)->send(new \App\Mail\ResetCodeMail($user->name, $code));
            } catch (Swift_SwiftException $e) {
                Log::error('Failed to send password reset code: '.$e->getMessage());

                return response()->json(['message' => 'We could not send the email right now. Please try again later.'], 503);
            }
        }

        // Same generic reply whether or not the account exists.
        return response()->json(['message' => 'If that email address exists, we have sent a 6-digit reset code to it.']);
    }

    /**
     * POST /api/reset-password — consume a 6-digit code.
     */
    public function resetPassword(Request $request)
    {
        $this->validate($request, [
            'email'    => 'required|email',
            'code'     => 'required|digits:6',
            'password' => 'required|min:6|confirmed',
        ]);

        $email = $request->input('email');

        $row = DB::table('password_resets')->where('email', $email)->first();

        if (! $row || \Carbon\Carbon::parse($row->created_at)->diffInMinutes(\Carbon\Carbon::now()) > 60) {
            return response()->json(['message' => 'This code has expired. Please request a new one.'], 422);
        }

        if (! Hash::check($request->input('code'), $row->token)) {
            return response()->json(['message' => 'That code is not correct. Check the email and try again.'], 422);
        }

        $user = \App\User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['message' => 'No account found for that email.'], 422);
        }

        $user->password = Hash::make($request->input('password'));
        $user->api_token = null; // force re-login on other devices
        $user->setRememberToken(Str::random(60));
        $user->save();

        DB::table('password_resets')->where('email', $email)->delete();

        return response()->json(['message' => 'Your password has been reset. You can now sign in with your new password.']);
    }

    protected function broker()
    {
        return Password::broker();
    }
}
