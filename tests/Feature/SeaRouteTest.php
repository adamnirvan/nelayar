<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class SeaRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_request_a_route()
    {
        $response = $this->getJson(route('api.map.route', [
            'start_lat' => -6.1, 'start_lng' => 106.8,
            'end_lat' => -6.5, 'end_lng' => 107.5,
        ]));

        $response->assertUnauthorized();
    }

    public function test_invalid_coordinates_are_rejected()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson(route('api.map.route', [
            'start_lat' => 999, 'start_lng' => 106.8,
            'end_lat' => -6.5, 'end_lng' => 107.5,
        ]));

        $response->assertStatus(422)->assertJsonValidationErrors('start_lat');
    }

    public function test_route_endpoint_returns_searoute_linestring()
    {
        $user = User::factory()->create();

        $fakeRoute = [
            'ok' => true,
            'distance' => 42.5,
            'units' => 'km',
            'route' => [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'LineString',
                    'coordinates' => [[106.8, -6.1], [107.5, -6.5]],
                ],
                'properties' => ['length' => 42.5, 'units' => 'km'],
            ],
        ];

        // searoute-py tidak perlu terpasang di CI: palsukan output Python.
        Process::fake([
            '*route_sea.py*' => Process::result(json_encode($fakeRoute)),
        ]);

        $response = $this->actingAs($user)->getJson(route('api.map.route', [
            'start_lat' => -6.1, 'start_lng' => 106.8,
            'end_lat' => -6.5, 'end_lng' => 107.5,
        ]));

        $response->assertOk()
            ->assertJsonPath('route.geometry.type', 'LineString')
            ->assertJsonPath('distance', 42.5);
    }
}
