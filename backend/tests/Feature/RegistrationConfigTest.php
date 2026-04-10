<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_auth_settings_expose_registration_flag(): void
    {
        config(['app.registration_enabled' => false]);

        $response = $this->getJson('/api/v1/auth/settings');

        $response
            ->assertOk()
            ->assertJson([
                'registration_enabled' => false,
            ]);
    }

    public function test_registration_can_be_disabled_from_configuration(): void
    {
        config(['app.registration_enabled' => false]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Registrazione disabilitata temporaneamente.',
            ]);

        $this->assertDatabaseCount((new User())->getTable(), 0);
    }

    public function test_registration_still_works_when_enabled(): void
    {
        config(['app.registration_enabled' => true]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'email', 'name'],
            ]);

        $this->assertDatabaseCount((new User())->getTable(), 1);
    }
}