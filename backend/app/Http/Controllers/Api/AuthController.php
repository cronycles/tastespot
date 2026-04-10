<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function settings()
    {
        return response()->json([
            'registration_enabled' => (bool) config('app.registration_enabled'),
        ]);
    }

    public function register(Request $request)
    {
        if (! config('app.registration_enabled')) {
            return response()->json([
                'message' => 'Registrazione disabilitata temporaneamente.',
            ], 403);
        }

        $data = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'unique:users'],
            'password'              => ['required', 'string', 'min:6', 'confirmed'],
            'password_confirmation' => ['required'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'email' => $user->email, 'name' => $user->name],
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenziali non valide.'],
            ]);
        }

        // Revoca tutti i token precedenti e ne emette uno nuovo
        $user->tokens()->delete();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'email' => $user->email, 'name' => $user->name],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Disconnesso.']);
    }

    public function me(Request $request)
    {
        $u = $request->user();
        return response()->json(['id' => $u->id, 'email' => $u->email, 'name' => $u->name]);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'old_password'              => ['required', 'string'],
            'new_password'              => ['required', 'string', 'min:8', 'confirmed'],
            'new_password_confirmation' => ['required'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['old_password'], $user->password)) {
            throw ValidationException::withMessages([
                'old_password' => ['La password attuale non e\' corretta.'],
            ]);
        }

        $user->forceFill([
            'password' => $data['new_password'],
        ])->save();

        return response()->json(['message' => 'Password aggiornata.']);
    }
}
