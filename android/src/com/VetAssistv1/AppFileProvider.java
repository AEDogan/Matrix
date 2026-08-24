package com.VetAssistv1;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

public class AppFileProvider extends ContentProvider {
    public static final String AUTHORITY = "com.VetAssistv1.fileprovider";

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File cacheDir = getContext() != null ? getContext().getCacheDir() : null;
        if (cacheDir == null) {
            throw new FileNotFoundException("Cache directory not available");
        }
        
        String path = uri.getPath();
        if (path == null) {
            throw new FileNotFoundException("Invalid URI path");
        }
        
        // Remove leading slash if present
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        
        File file = new File(cacheDir, path);
        if (file.exists()) {
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        }
        throw new FileNotFoundException("File not found: " + file.getAbsolutePath());
    }

    @Override
    public String getType(Uri uri) {
        String path = uri.getPath();
        if (path != null && path.endsWith(".png")) {
            return "image/png";
        }
        return "image/jpeg";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File cacheDir = getContext() != null ? getContext().getCacheDir() : null;
        String path = uri.getPath();
        if (path != null && path.startsWith("/")) {
            path = path.substring(1);
        }
        File file = cacheDir != null ? new File(cacheDir, path != null ? path : "") : null;
        
        MatrixCursor cursor = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        if (file != null && file.exists()) {
            cursor.addRow(new Object[]{file.getName(), file.length()});
        }
        return cursor;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
