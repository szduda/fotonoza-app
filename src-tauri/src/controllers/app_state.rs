use crate::controllers::paths::{fotonoza_import_dir, photo_state_path};
use crate::types::{PhotoState, StoreSnapshot};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn app_state_path() -> PathBuf {
    PathBuf::from(".fotonoza")
}

fn migrate_layout_json(layout: &mut serde_json::Map<String, serde_json::Value>) {
    let pairs = [
        ("leftSidebarVisible", "leftSidebarCollapsed"),
        ("rightSidebarVisible", "rightSidebarCollapsed"),
        ("timelineVisible", "timelineCollapsed"),
        ("topBarVisible", "topBarCollapsed"),
    ];
    for (vis_key, col_key) in pairs {
        if !layout.contains_key(col_key) {
            if let Some(Value::Bool(vis)) = layout.get(vis_key).cloned() {
                layout.insert(col_key.to_string(), Value::Bool(!vis));
            }
        }
    }
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
    let mut root: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;
    if let Some(obj) = root.as_object_mut() {
        if let Some(layout_val) = obj.get_mut("layout") {
            if let Value::Object(ref mut layout) = layout_val {
                migrate_layout_json(layout);
            }
        }
    }
    let snap = serde_json::from_value::<StoreSnapshot>(root).map_err(|e| e.to_string())?;
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
