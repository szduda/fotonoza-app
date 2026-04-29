use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PhotoState {
    id: String,
    file_name: String,
    source_path: String,
    working_path: Option<String>,
    selected: bool,
    approved: bool,
    adjustments: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppState {
    mode: String,
    photos: Vec<PhotoState>,
    selected_photo_id: Option<String>,
    history: serde_json::Value,
    history_cursor: usize,
    export_settings: serde_json::Value,
    locale: String,
}

fn app_state_path() -> PathBuf {
    PathBuf::from(".fotonoza")
}

fn photo_state_path(file_name: &str) -> PathBuf {
    PathBuf::from(format!(".{}.fotonoza", file_name))
}

#[tauri::command]
fn save_app_state(state: AppState) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(app_state_path(), serialized).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_app_state() -> Result<Option<AppState>, String> {
    if !app_state_path().exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(app_state_path()).map_err(|e| e.to_string())?;
    let state = serde_json::from_str::<AppState>(&content).map_err(|e| e.to_string())?;
    Ok(Some(state))
}

#[tauri::command]
fn save_photo_state(photo: PhotoState) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(&photo).map_err(|e| e.to_string())?;
    fs::write(photo_state_path(&photo.file_name), serialized).map_err(|e| e.to_string())
}

#[tauri::command]
fn run_darktable_operation(photo_path: String, xmp_path: String) -> Result<(), String> {
    if !Path::new(&photo_path).exists() {
        return Err("Photo path does not exist".to_string());
    }

    let status = Command::new("darktable-cli")
        .arg(&photo_path)
        .arg("output.jpg")
        .arg(&xmp_path)
        .status()
        .map_err(|e| format!("Failed to spawn darktable-cli: {e}"))?;

    if !status.success() {
        return Err(format!(
            "darktable-cli exited with non-zero status: {:?}",
            status.code()
        ));
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_app_state,
            load_app_state,
            save_photo_state,
            run_darktable_operation
        ])
        .run(tauri::generate_context!())
        .expect("error while running fotonoza");
}
