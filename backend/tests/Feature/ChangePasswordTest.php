<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => 'old-password',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/change-password', [
            'old_password' => 'old-password',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'message' => 'Password aggiornata.',
            ]);

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_change_password_requires_the_correct_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'old-password',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/change-password', [
            'old_password' => 'wrong-password',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['old_password']);

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }
}