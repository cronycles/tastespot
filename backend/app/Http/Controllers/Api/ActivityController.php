<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ActivityController extends Controller
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function baseQuery(string $userId)
    {
        return Activity::where('activities.user_id', $userId)
            ->withExists([
                'favorites as is_favorite' => fn($q) => $q->where('user_id', $userId),
            ])
            ->with([
                'types:id',
                'photos' => fn($q) => $q->orderBy('display_order'),
            ]);
    }

    private function formatActivity(Activity $activity): array
    {
        return [
            'id'             => $activity->id,
            'user_id'        => (string) $activity->user_id,
            'name'           => $activity->name,
            'address'        => $activity->address,
            'lat'            => $activity->lat,
            'lng'            => $activity->lng,
            'phone'          => $activity->phone,
            'notes'          => $activity->notes,
            'tags'           => $activity->tags ?? [],
            'last_viewed_at' => $activity->last_viewed_at?->toISOString(),
            'created_at'     => $activity->created_at->toISOString(),
            'updated_at'     => $activity->updated_at->toISOString(),
            'type_ids'       => $activity->types->pluck('id')->values()->toArray(),
            'is_favorite'    => (bool) ($activity->is_favorite ?? false),
            'photos'         => $activity->photos->map(fn($p) => [
                'id'            => $p->id,
                'activity_id'   => $activity->id,
                'storage_path'  => Storage::url('public/photos/' . $p->storage_path),
                'display_order' => $p->display_order,
                'created_at'    => $p->created_at->toISOString(),
            ])->toArray(),
        ];
    }

    // ─── Endpoints ────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $activities = $this->baseQuery($request->user()->id)
            ->orderBy('name')
            ->get()
            ->map(fn($a) => $this->formatActivity($a));

        return response()->json(['data' => $activities, 'has_more' => false]);
    }

    public function show(Request $request, Activity $activity)
    {
        $this->authorize($activity, $request->user()->id);

        $full = $this->baseQuery($request->user()->id)
            ->where('activities.id', $activity->id)
            ->firstOrFail();

        return response()->json($this->formatActivity($full));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'address'    => ['nullable', 'string'],
            'lat'        => ['nullable', 'numeric'],
            'lng'        => ['nullable', 'numeric'],
            'phone'      => ['nullable', 'string', 'max:50'],
            'notes'      => ['nullable', 'string'],
            'tags'       => ['nullable', 'array'],
            'tags.*'     => ['string'],
            'type_ids'   => ['nullable', 'array'],
            'type_ids.*' => ['string', 'exists:activity_types,id'],
        ]);

        $activity = Activity::create([
            'user_id' => $request->user()->id,
            'name'    => $data['name'],
            'address' => $data['address'] ?? null,
            'lat'     => $data['lat'] ?? null,
            'lng'     => $data['lng'] ?? null,
            'phone'   => $data['phone'] ?? null,
            'notes'   => $data['notes'] ?? null,
            'tags'    => $data['tags'] ?? [],
        ]);

        $activity->types()->sync($data['type_ids'] ?? []);

        $full = $this->baseQuery($request->user()->id)
            ->where('activities.id', $activity->id)
            ->first();

        return response()->json($this->formatActivity($full), 201);
    }

    public function update(Request $request, Activity $activity)
    {
        $this->authorize($activity, $request->user()->id);

        $data = $request->validate([
            'name'       => ['sometimes', 'string', 'max:255'],
            'address'    => ['nullable', 'string'],
            'lat'        => ['nullable', 'numeric'],
            'lng'        => ['nullable', 'numeric'],
            'phone'      => ['nullable', 'string', 'max:50'],
            'notes'      => ['nullable', 'string'],
            'tags'       => ['nullable', 'array'],
            'tags.*'     => ['string'],
            'type_ids'   => ['sometimes', 'array'],
            'type_ids.*' => ['string', 'exists:activity_types,id'],
        ]);

        $fields = array_diff_key($data, ['type_ids' => true]);
        $activity->update($fields);

        if (isset($data['type_ids'])) {
            $activity->types()->sync($data['type_ids']);
        }

        $full = $this->baseQuery($request->user()->id)
            ->where('activities.id', $activity->id)
            ->first();

        return response()->json($this->formatActivity($full));
    }

    public function destroy(Request $request, Activity $activity)
    {
        $this->authorize($activity, $request->user()->id);
        $activity->delete();
        return response()->json(null, 204);
    }

    public function toggleFavorite(Request $request, Activity $activity)
    {
        $this->authorize($activity, $request->user()->id);

        $userId = $request->user()->id;
        $exists = DB::table('favorites')
            ->where('user_id', $userId)
            ->where('activity_id', $activity->id)
            ->exists();

        if ($exists) {
            DB::table('favorites')
                ->where('user_id', $userId)
                ->where('activity_id', $activity->id)
                ->delete();
            return response()->json(['is_favorite' => false]);
        }

        DB::table('favorites')->insert([
            'user_id'     => $userId,
            'activity_id' => $activity->id,
            'created_at'  => now(),
        ]);
        return response()->json(['is_favorite' => true]);
    }

    public function markViewed(Request $request, Activity $activity)
    {
        $this->authorize($activity, $request->user()->id);
        $activity->update(['last_viewed_at' => now()]);
        return response()->json(['last_viewed_at' => $activity->last_viewed_at->toISOString()]);
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    private function authorize(Activity $activity, int|string $userId): void
    {
        if ((string) $activity->user_id !== (string) $userId) {
            abort(403, 'Non autorizzato.');
        }
    }
}
