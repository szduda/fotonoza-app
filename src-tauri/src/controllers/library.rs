use crate::controllers::paths::{fotonoza_import_dir, library_dir, library_path_for_source};
use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryPathEntry {
    source_path: String,
    library_path: String,
}

fn ensure_library_file(source_path: &str, library_path: &Path) -> Result<(), String> {
    if library_path.exists() {
        return Ok(());
    }
    if !Path::new(source_path).exists() {
        return Ok(());
    }
    fs::copy(source_path, library_path).map_err(|e| format!("library copy: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn ensure_library_sources(source_paths: Vec<String>) -> Result<Vec<LibraryPathEntry>, String> {
    let import_dir = fotonoza_import_dir()?;
    let library = library_dir(&import_dir);
    fs::create_dir_all(&library).map_err(|e| format!("library mkdir: {e}"))?;

    let mut out = Vec::with_capacity(source_paths.len());
    for source_path in source_paths {
        let library_path = library_path_for_source(&import_dir, &source_path)?;
        ensure_library_file(&source_path, &library_path)?;
        out.push(LibraryPathEntry {
            source_path,
            library_path: library_path.to_string_lossy().to_string(),
        });
    }
    Ok(out)
}
