use crate::controllers::paths::{fotonoza_import_dir, thumb_path_for_source, thumbs_dir};
use image::ImageFormat;
use rayon::prelude::*;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

/// Max edge length; `thumbnail` keeps aspect ratio (no stretch / faux “rotation”).
const THUMB_MAX: u32 = 512;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThumbPathEntry {
    source_path: String,
    thumbnail_path: String,
}

fn create_thumb_if_missing(source_path: &str, thumb_path: &Path) -> Result<(), String> {
    if thumb_path.exists() {
        return Ok(());
    }
    if !Path::new(source_path).exists() {
        return Ok(());
    }

    let img = image::open(source_path).map_err(|e| format!("thumbnail decode: {e}"))?;
    let resized = img.thumbnail(THUMB_MAX, THUMB_MAX);

    let mut tmp_name = PathBuf::from(thumb_path)
        .file_name()
        .ok_or_else(|| "Thumbnail path has no file name".to_string())?
        .to_os_string();
    tmp_name.push(".partial");
    let tmp_path = thumb_path.with_file_name(tmp_name);

    resized
        .save_with_format(&tmp_path, ImageFormat::Jpeg)
        .map_err(|e| format!("thumbnail save: {e}"))?;
    fs::rename(&tmp_path, thumb_path).map_err(|e| format!("thumbnail rename: {e}"))?;
    Ok(())
}

fn ensure_thumbnails_inner(source_paths: Vec<String>) {
    let Ok(import_dir) = fotonoza_import_dir() else {
        return;
    };
    let thumbs = thumbs_dir(&import_dir);
    if fs::create_dir_all(&thumbs).is_err() {
        return;
    }
    source_paths.par_iter().for_each(|source_path| {
        if let Ok(thumb_path) = thumb_path_for_source(&import_dir, source_path) {
            let _ = create_thumb_if_missing(source_path, &thumb_path);
        }
    });
}

#[tauri::command]
pub async fn ensure_thumbnails(source_paths: Vec<String>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || ensure_thumbnails_inner(source_paths))
        .await
        .map_err(|e| format!("thumbnail worker join: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn resolve_thumbnail_paths(source_paths: Vec<String>) -> Result<Vec<ThumbPathEntry>, String> {
    let import_dir = fotonoza_import_dir()?;
    let mut out = Vec::with_capacity(source_paths.len());
    for source_path in source_paths {
        let thumbnail_path = thumb_path_for_source(&import_dir, &source_path)?
            .to_string_lossy()
            .to_string();
        out.push(ThumbPathEntry {
            source_path,
            thumbnail_path,
        });
    }
    Ok(out)
}
