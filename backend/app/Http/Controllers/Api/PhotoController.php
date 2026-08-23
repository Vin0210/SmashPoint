<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

/**
 * Serves uploaded files (avatars, court photos) from storage/app/public
 * without requiring a public/storage symlink (which needs elevated
 * privileges on Windows).
 */
class PhotoController extends Controller
{
    private $folders = ['courts', 'avatars'];

    public function show($file)
    {
        $file = basename($file); // never allow traversal

        foreach ($this->folders as $folder) {
            $path = storage_path('app/public/'.$folder.'/'.$file);

            if (is_file($path)) {
                return response()->file($path);
            }
        }

        abort(404);
    }
}
