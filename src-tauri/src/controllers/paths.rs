use std::path::{Path, PathBuf};

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
