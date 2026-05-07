use crate::controllers::paths::{fotonoza_import_dir, photo_state_path};
use crate::types::{PhotoState, StoreSnapshot};
use std::fs;
use std::path::PathBuf;

fn app_state_path() -> PathBuf {
    PathBuf::from(".fotonoza")
}

#[tauri::command]
pub fn save_app_state(snapshot: StoreSnapshot) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(&snapshot).map_err(|e| e.to_string())?;
    fs::write(app_state_path(), serialized).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_app_state() -> Result<Option<StoreSnapshot>, String> {
    if !app_state_path().exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(app_state_path()).map_err(|e| e.to_string())?;
    let snap = serde_json::from_str::<StoreSnapshot>(&content).map_err(|e| e.to_string())?;
    Ok(Some(snap))
}

#[tauri::command]
pub fn save_photo_state(photo: PhotoState) -> Result<(), String> {
    let import = fotonoza_import_dir()?;
    fs::create_dir_all(&import).map_err(|e| e.to_string())?;
    let path = photo_state_path(&import, &photo.file_name);
    let serialized = serde_json::to_string_pretty(&photo).map_err(|e| e.to_string())?;
    fs::write(path, serialized).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_photo_state(file_name: String) -> Result<Option<String>, String> {
    let import = fotonoza_import_dir()?;
    let path = photo_state_path(&import, &file_name);
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(Some(content))
}
