<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeoController extends Controller
{
    private const BASE_URL = 'https://nominatim.openstreetmap.org';
    private const PHOTON_BASE_URL = 'https://photon.komoot.io';

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
            'lang' => ['nullable', 'string', 'max:120'],
        ]);

        $query = trim($validated['q']);
        $limit = (int) ($validated['limit'] ?? 8);
        $lang = trim((string) ($validated['lang'] ?? 'it,en'));
        $candidates = array_slice($this->buildFallbackQueries($query), 0, 2);

        foreach ($candidates as $candidate) {
            $cacheKey = sprintf('geo:search:%s:%s:%d', md5($candidate), md5($lang), $limit);
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                $items = $cached;
            } else {
                $items = $this->fetchSearch($candidate, $limit, $lang);
                if (count($items) > 0) {
                    Cache::put($cacheKey, $items, now()->addMinutes(15));
                } else {
                    // Avoid hammering upstream when there are no results or temporary 429.
                    Cache::put($cacheKey, [], now()->addSeconds(45));
                }
            }

            if (count($items) > 0) {
                return response()->json([
                    'results' => $items,
                    'query_used' => $candidate,
                    'fallback_used' => $candidate !== $query,
                ]);
            }
        }

        return response()->json([
            'results' => [],
            'query_used' => $query,
            'fallback_used' => false,
        ]);
    }

    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'lang' => ['nullable', 'string', 'max:120'],
        ]);

        $lat = (float) $validated['lat'];
        $lng = (float) $validated['lng'];
        $lang = trim((string) ($validated['lang'] ?? 'it,en'));

        $cacheKey = sprintf('geo:reverse:%s:%s:%s', number_format($lat, 6, '.', ''), number_format($lng, 6, '.', ''), md5($lang));
        $result = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($lat, $lng, $lang) {
            return $this->fetchReverse($lat, $lng, $lang);
        });

        return response()->json([
            'result' => $result,
        ]);
    }

    private function buildFallbackQueries(string $query): array
    {
        $query = trim($query);
        if ($query === '') {
            return [];
        }

        $candidates = [$query];

        if (mb_strlen($query) >= 6) {
            $candidates[] = mb_substr($query, 0, mb_strlen($query) - 1);
        }

        if (mb_strlen($query) >= 8) {
            $candidates[] = mb_substr($query, 0, mb_strlen($query) - 2);
        }

        $parts = preg_split('/\s+/', $query) ?: [];
        $firstWord = $parts[0] ?? '';
        if ($firstWord !== '' && mb_strlen($firstWord) >= 4 && $firstWord !== $query) {
            $candidates[] = $firstWord;
        }

        $unique = [];
        foreach ($candidates as $candidate) {
            $candidate = trim($candidate);
            if ($candidate !== '' && mb_strlen($candidate) >= 2 && ! in_array($candidate, $unique, true)) {
                $unique[] = $candidate;
            }
        }

        return $unique;
    }

    private function fetchSearch(string $query, int $limit, string $lang): array
    {
        $response = Http::connectTimeout(1)->timeout(2)
            ->acceptJson()
            ->withHeaders($this->nominatimHeaders())
            ->get(self::BASE_URL.'/search', [
                'q' => $query,
                'format' => 'jsonv2',
                'addressdetails' => 1,
                'limit' => $limit,
                'accept-language' => $lang,
            ]);

        if ($response->status() === 429) {
            return $this->fetchPhotonSearch($query, $limit, $lang);
        }

        if (! $response->ok()) {
            return [];
        }

        $items = $response->json();
        if (! is_array($items)) {
            return [];
        }

        $results = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $lat = isset($item['lat']) ? (float) $item['lat'] : null;
            $lng = isset($item['lon']) ? (float) $item['lon'] : null;
            if (! is_float($lat) || ! is_float($lng)) {
                continue;
            }

            $displayName = trim((string) ($item['display_name'] ?? ''));
            $name = trim((string) ($item['name'] ?? ''));
            $label = $name !== '' ? $name : $this->compactPlaceLabel($displayName !== '' ? $displayName : $query);

            $results[] = [
                'id' => (string) ($item['place_id'] ?? ($lat.':'.$lng)),
                'label' => $label,
                'details' => $this->buildAddressFromNominatim(is_array($item['address'] ?? null) ? $item['address'] : null) ?? ($displayName !== '' ? $displayName : $label),
                'lat' => $lat,
                'lng' => $lng,
            ];
        }

        if (count($results) > 0) {
            return $results;
        }

        return $this->fetchPhotonSearch($query, $limit, $lang);
    }

    private function fetchPhotonSearch(string $query, int $limit, string $lang): array
    {
        unset($lang);

        $response = Http::connectTimeout(1)->timeout(2)
            ->acceptJson()
            ->withHeaders($this->nominatimHeaders())
            ->get(self::PHOTON_BASE_URL.'/api', [
                'q' => $query,
                'limit' => $limit,
            ]);

        if (! $response->ok()) {
            return [];
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            return [];
        }

        $features = $payload['features'] ?? null;
        if (! is_array($features)) {
            return [];
        }

        $results = [];
        foreach ($features as $feature) {
            if (! is_array($feature)) {
                continue;
            }

            $geometry = is_array($feature['geometry'] ?? null) ? $feature['geometry'] : null;
            $coordinates = is_array($geometry['coordinates'] ?? null) ? $geometry['coordinates'] : null;
            if (! is_array($coordinates) || count($coordinates) < 2) {
                continue;
            }

            $lng = is_numeric($coordinates[0]) ? (float) $coordinates[0] : null;
            $lat = is_numeric($coordinates[1]) ? (float) $coordinates[1] : null;
            if (! is_float($lat) || ! is_float($lng)) {
                continue;
            }

            $props = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
            $label = $this->firstNonEmptyString([
                $props['name'] ?? null,
                $props['street'] ?? null,
                $query,
            ]) ?? $query;
            $details = $this->buildAddressFromPhoton($props) ?? $label;

            $idValue = $props['osm_id'] ?? ($lat.':'.$lng);

            $results[] = [
                'id' => (string) $idValue,
                'label' => $label,
                'details' => $details,
                'lat' => $lat,
                'lng' => $lng,
            ];
        }

        return $results;
    }

    private function fetchReverse(float $lat, float $lng, string $lang): ?array
    {
        $response = Http::connectTimeout(1)->timeout(2)
            ->acceptJson()
            ->withHeaders($this->nominatimHeaders())
            ->get(self::BASE_URL.'/reverse', [
                'format' => 'jsonv2',
                'lat' => $lat,
                'lon' => $lng,
                'zoom' => 18,
                'accept-language' => $lang,
            ]);

        if (! $response->ok()) {
            return null;
        }

        $item = $response->json();
        if (! is_array($item)) {
            return null;
        }

        $displayName = trim((string) ($item['display_name'] ?? ''));
        $address = is_array($item['address'] ?? null) ? $item['address'] : null;
        $details = $this->buildAddressFromNominatim($address) ?? ($displayName !== '' ? $displayName : null);
        $label = trim((string) ($item['name'] ?? ''));

        if ($label === '') {
            $label = trim((string) (($address['road'] ?? $address['neighbourhood'] ?? $address['suburb'] ?? '')));
        }

        if ($label === '') {
            $label = $details !== null ? $this->compactPlaceLabel($details) : 'Punto selezionato';
        }

        return [
            'id' => sprintf('reverse:%s:%s', $lat, $lng),
            'label' => $label,
            'details' => $details ?? $label,
            'lat' => $lat,
            'lng' => $lng,
        ];
    }

    private function compactPlaceLabel(string $value): string
    {
        $parts = array_values(array_filter(array_map(static fn ($part) => trim((string) $part), explode(',', $value)), static fn ($part) => $part !== ''));

        if (count($parts) <= 1) {
            return $parts[0] ?? $value;
        }

        return $parts[0].', '.$parts[1];
    }

    private function buildAddressFromNominatim(?array $address): ?string
    {
        if ($address === null) {
            return null;
        }

        $street = $this->firstNonEmptyString([
            $address['road'] ?? null,
            $address['pedestrian'] ?? null,
            $address['cycleway'] ?? null,
            $address['footway'] ?? null,
            $address['path'] ?? null,
            $address['residential'] ?? null,
        ]);
        $number = $this->firstNonEmptyString([$address['house_number'] ?? null]);
        $streetLine = trim(implode(' ', array_filter([$street, $number], static fn ($entry) => $entry !== null)));

        $district = $this->firstNonEmptyString([$address['neighbourhood'] ?? null, $address['suburb'] ?? null, $address['city_district'] ?? null]);
        $locality = $this->firstNonEmptyString([$address['city'] ?? null, $address['town'] ?? null, $address['village'] ?? null, $address['hamlet'] ?? null, $address['municipality'] ?? null]);
        $region = $this->firstNonEmptyString([$address['county'] ?? null, $address['state_district'] ?? null, $address['state'] ?? null, $address['region'] ?? null, $address['province'] ?? null]);
        $postcode = $this->firstNonEmptyString([$address['postcode'] ?? null]);
        $country = $this->firstNonEmptyString([$address['country'] ?? null]);

        $parts = array_values(array_filter([$streetLine, $district, $locality, $region, $postcode, $country], static fn ($entry) => is_string($entry) && trim($entry) !== ''));

        return count($parts) > 0 ? implode(', ', $parts) : null;
    }

    private function buildAddressFromPhoton(array $properties): ?string
    {
        $street = $this->firstNonEmptyString([$properties['street'] ?? null]);
        $number = $this->firstNonEmptyString([$properties['housenumber'] ?? null]);
        $streetLine = trim(implode(' ', array_filter([$street, $number], static fn ($entry) => $entry !== null)));

        $district = $this->firstNonEmptyString([$properties['district'] ?? null, $properties['suburb'] ?? null]);
        $locality = $this->firstNonEmptyString([$properties['city'] ?? null, $properties['town'] ?? null, $properties['village'] ?? null]);
        $region = $this->firstNonEmptyString([$properties['state'] ?? null, $properties['county'] ?? null]);
        $postcode = $this->firstNonEmptyString([$properties['postcode'] ?? null]);
        $country = $this->firstNonEmptyString([$properties['country'] ?? null]);

        $parts = array_values(array_filter([$streetLine, $district, $locality, $region, $postcode, $country], static fn ($entry) => is_string($entry) && trim($entry) !== ''));

        return count($parts) > 0 ? implode(', ', $parts) : null;
    }

    private function firstNonEmptyString(array $values): ?string
    {
        foreach ($values as $value) {
            if (! is_string($value)) {
                continue;
            }

            $trimmed = trim($value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return null;
    }

    private function nominatimHeaders(): array
    {
        return [
            'User-Agent' => 'TasteSpot/1.0 (+https://tastespot.crointhemorning.com)',
            'Referer' => config('app.url', 'http://localhost'),
        ];
    }
}
