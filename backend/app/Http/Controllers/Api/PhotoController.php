<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoController extends Controller
{
    public function store(Request $request, Activity $activity)
    {
        if ((string) $activity->user_id !== (string) $request->user()->id) {
            abort(403, 'Non autorizzato.');
        }

        $request->validate([
            'photo' => ['required', 'file', 'image', 'max:10240'], // max 10 MB
        ]);

        $userId    = $request->user()->id;
        $ext       = $request->file('photo')->getClientOriginalExtension() ?: 'jpg';
        $filename  = Str::uuid()->toString() . '.' . $ext;
        $storagePath = $userId . '/' . $filename;

        // Salva in storage/app/public/photos/{user_id}/
        $request->file('photo')->storeAs('photos/' . $userId, $filename, 'public');

        $maxOrder = ActivityPhoto::where('activity_id', $activity->id)->max('display_order') ?? -1;

        $photo = ActivityPhoto::create([
            'activity_id'   => $activity->id,
            'storage_path'  => $storagePath,
            'display_order' => $maxOrder + 1,
        ]);

        return response()->json([
            'id'            => $photo->id,
            'activity_id'   => $activity->id,
            'storage_path'  => Storage::disk('public')->url('photos/' . $photo->storage_path),
            'display_order' => $photo->display_order,
            'created_at'    => $photo->created_at->toISOString(),
        ], 201);
    }

    public function destroy(Request $request, ActivityPhoto $photo)
    {
        if ((string) $photo->activity->user_id !== (string) $request->user()->id) {
            abort(403, 'Non autorizzato.');
        }

        // Elimina file fisico
        Storage::disk('public')->delete('photos/' . $photo->storage_path);

        $photo->delete();
        return response()->json(null, 204);
    }
}
