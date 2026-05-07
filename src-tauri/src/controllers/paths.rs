use std::path::{Path, PathBuf};
use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

pub const FOTONOZA_IMPORT_DIR_NAME: &str = ".import.fotonoza";

pub fn fotonoza_import_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|h| h.join(FOTONOZA_IMPORT_DIR_NAME))
        .ok_or_else(|| "Could not resolve home directory".to_string())
}

pub fn photo_state_path(import_dir: &Path, file_name: &str) -> PathBuf {
    import_dir.join(format!(".{}.fotonoza", file_name))
}

pub fn preview_dir(import_dir: &Path) -> PathBuf {
    import_dir.join("previews")
}

pub fn thumbs_dir(import_dir: &Path) -> PathBuf {
    import_dir.join("thumbs")
}

pub fn library_dir(import_dir: &Path) -> PathBuf {
    import_dir.join("library")
}

pub fn thumb_path_for_source(import_dir: &Path, source_path: &str) -> Result<PathBuf, String> {
    let source = Path::new(source_path);
    let stem = source
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("thumb")
        .replace(' ', "_");
    let mut hasher = DefaultHasher::new();
    source_path.hash(&mut hasher);
    let hash = hasher.finish();
    Ok(thumbs_dir(import_dir).join(format!("{stem}-{hash:016x}.jpg")))
}

pub fn library_path_for_source(import_dir: &Path, source_path: &str) -> Result<PathBuf, String> {
    let source = Path::new(source_path);
    let file_name = source
        .file_name()
        .ok_or_else(|| "Source path has no file name".to_string())?;
    Ok(library_dir(import_dir).join(file_name))
}
