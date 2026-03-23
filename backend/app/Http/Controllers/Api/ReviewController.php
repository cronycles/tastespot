<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function formatReview(Review $review): array
    {
        return [
            'id'               => $review->id,
            'activity_id'      => $review->activity_id,
            'user_id'          => (string) $review->user_id,
            'activity_type_id' => $review->activity_type_id,
            'score_location'   => $review->score_location,
            'score_food'       => $review->score_food,
            'score_service'    => $review->score_service,
            'score_price'      => $review->score_price,
            'cost_per_person'  => $review->cost_per_person,
            'liked'            => $review->liked,
            'disliked'         => $review->disliked,
            'notes'            => $review->notes,
            'created_at'       => $review->created_at->toISOString(),
            'updated_at'       => $review->updated_at->toISOString(),
            'type_name'        => $review->activityType?->name ?? '',
            'type_icon_key'    => $review->activityType?->icon_key ?? 'restaurant-outline',
        ];
    }

    public function forActivity(Request $request, Activity $activity)
    {
        if ((string) $activity->user_id !== (string) $request->user()->id) {
            abort(403, 'Non autorizzato.');
        }

        $reviews = Review::where('activity_id', $activity->id)
            ->where('user_id', $request->user()->id)
            ->with('activityType:id,name,icon_key')
            ->get()
            ->map(fn($r) => $this->formatReview($r));

        return response()->json(['data' => $reviews]);
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'activity_id'      => ['required', 'string', 'exists:activities,id'],
            'activity_type_id' => ['required', 'string', 'exists:activity_types,id'],
            'score_location'   => ['nullable', 'numeric', 'min:0', 'max:10'],
            'score_food'       => ['nullable', 'numeric', 'min:0', 'max:10'],
            'score_service'    => ['nullable', 'numeric', 'min:0', 'max:10'],
            'score_price'      => ['nullable', 'numeric', 'min:0', 'max:10'],
            'cost_per_person'  => ['nullable', 'numeric', 'min:0'],
            'liked'            => ['nullable', 'string'],
            'disliked'         => ['nullable', 'string'],
            'notes'            => ['nullable', 'string'],
        ]);

        $review = Review::updateOrCreate(
            [
                'activity_id'      => $data['activity_id'],
                'user_id'          => $request->user()->id,
                'activity_type_id' => $data['activity_type_id'],
            ],
            [
                'score_location'  => $data['score_location'] ?? null,
                'score_food'      => $data['score_food'] ?? null,
                'score_service'   => $data['score_service'] ?? null,
                'score_price'     => $data['score_price'] ?? null,
                'cost_per_person' => $data['cost_per_person'] ?? null,
                'liked'           => $data['liked'] ?? null,
                'disliked'        => $data['disliked'] ?? null,
                'notes'           => $data['notes'] ?? null,
            ]
        );

        $review->load('activityType:id,name,icon_key');
        return response()->json($this->formatReview($review));
    }
}
