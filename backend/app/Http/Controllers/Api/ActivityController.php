<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
            ->withMax('reviews as latest_reviewed_at', 'updated_at')
            ->with([
                'types:id',
                'reviews:id,activity_id,activity_type_id,score_location,score_food,score_service,score_price,updated_at',
                'photos' => fn($q) => $q->orderBy('display_order'),
            ]);
    }

    private function formatActivity(Activity $activity): array
    {
        $latestReviewedAt = $activity->latest_reviewed_at;

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
            'latest_reviewed_at' => $latestReviewedAt ? Carbon::parse($latestReviewedAt)->toISOString() : null,
            'created_at'     => $activity->created_at->toISOString(),
            'updated_at'     => $activity->updated_at->toISOString(),
            'type_ids'       => $activity->types->pluck('id')->values()->toArray(),
            'is_favorite'    => (bool) ($activity->is_favorite ?? false),
            'review_summaries' => $activity->reviews->map(fn($review) => [
                'activity_type_id' => $review->activity_type_id,
                'score_location' => $review->score_location,
                'score_food' => $review->score_food,
                'score_service' => $review->score_service,
                'score_price' => $review->score_price,
                'updated_at' => $review->updated_at?->toISOString(),
            ])->values()->toArray(),
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
        $data = $request->validate([
            'offset' => ['nullable', 'integer', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $offset = (int) ($data['offset'] ?? 0);
        $limit = (int) ($data['limit'] ?? 20);

        $activities = $this->baseQuery($request->user()->id)
            ->orderBy('name')
            ->offset($offset)
            ->limit($limit + 1)
            ->get()
            ->values();

        $hasMore = $activities->count() > $limit;
        $page = $activities
            ->take($limit)
            ->map(fn($a) => $this->formatActivity($a))
            ->values();

        return response()->json([
            'data' => $page,
            'has_more' => $hasMore,
        ]);
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
