<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityType;
use Illuminate\Http\Request;

class ActivityTypeController extends Controller
{
    public function index(Request $request)
    {
        $types = ActivityType::where('user_id', $request->user()->id)
            ->orderBy('display_order')
            ->get(['id', 'name', 'description', 'icon_key', 'display_order', 'created_at']);

        return response()->json(['data' => $types]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'icon_key' => ['required', 'string', 'max:100'],
        ]);

        $maxOrder = ActivityType::where('user_id', $request->user()->id)->max('display_order') ?? -1;

        $type = ActivityType::create([
            'user_id'       => $request->user()->id,
            'name'          => $data['name'],
            'icon_key'      => $data['icon_key'],
            'display_order' => $maxOrder + 1,
        ]);

        return response()->json($type, 201);
    }

    public function update(Request $request, ActivityType $type)
    {
        $this->authorizeOwner($type, $request->user()->id);

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'icon_key' => ['sometimes', 'string', 'max:100'],
        ]);

        $type->update($data);
        return response()->json($type);
    }

    public function destroy(Request $request, ActivityType $type)
    {
        $this->authorizeOwner($type, $request->user()->id);
        $type->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['required', 'string'],
        ]);

        foreach ($data['ids'] as $order => $id) {
            ActivityType::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->update(['display_order' => $order]);
        }

        return response()->json(['message' => 'Ordine aggiornato.']);
    }

    private function authorizeOwner(ActivityType $type, int|string $userId): void
    {
        if ((string) $type->user_id !== (string) $userId) {
            abort(403, 'Non autorizzato.');
        }
    }
}
