mod controllers;
mod types;

use controllers::app_state::{load_app_state, load_photo_state, save_app_state, save_photo_state};
use controllers::darktable::{get_photo_histogram, render_darktable_fx_preview, run_darktable_operation};
use controllers::exif::get_photo_exif;
use controllers::export::{get_default_export_directory, get_export_job_status, start_export_job};
use controllers::library::ensure_library_sources;
use controllers::preview::render_basic_effects_preview;
use controllers::thumbnails::{ensure_thumbnails, repair_thumbnail, resolve_thumbnail_paths};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_app_state,
            load_app_state,
            save_photo_state,
            load_photo_state,
            run_darktable_operation,
            render_darktable_fx_preview,
            get_photo_histogram,
            render_basic_effects_preview,
            ensure_library_sources,
            ensure_thumbnails,
            repair_thumbnail,
            resolve_thumbnail_paths,
            get_default_export_directory,
            start_export_job,
            get_export_job_status,
            get_photo_exif
        ])
        .run(tauri::generate_context!())
        .expect("error while running fotonoza");
}
