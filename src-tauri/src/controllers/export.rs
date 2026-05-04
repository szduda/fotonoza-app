use crate::controllers::darktable::{output_ext, run_darktable_export};
use crate::types::{ExportJobStatus, ExportSettings, ExportTaskPhoto};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{LazyLock, Mutex};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

static EXPORT_JOBS: LazyLock<Mutex<HashMap<String, ExportJobStatus>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn next_available_output_path(dir: &Path, source_name: &str, ext: &str) -> PathBuf {
    let stem = Path::new(source_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("photo");
    let mut index = 0usize;
    loop {
        let candidate = if index == 0 {
            dir.join(format!("{stem}.{ext}"))
        } else {
            dir.join(format!("{stem}_{index}.{ext}"))
        };
        if !candidate.exists() {
            return candidate;
        }
        index += 1;
    }
}

#[tauri::command]
pub fn get_default_export_directory(collection_name: String) -> Result<String, String> {
    let base = dirs::picture_dir()
        .or_else(|| std::env::current_dir().ok())
        .ok_or_else(|| "Could not resolve base directory".to_string())?;
    Ok(base.join(collection_name).to_string_lossy().to_string())
}

#[tauri::command]
pub fn start_export_job(
    photos: Vec<ExportTaskPhoto>,
    settings: ExportSettings,
) -> Result<String, String> {
    if photos.is_empty() {
        return Err("No photos selected for export".to_string());
    }
    if settings.directory.trim().is_empty() {
        return Err("Export directory is empty".to_string());
    }

    let job_id = format!(
        "export-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let output_dir = PathBuf::from(settings.directory.clone());
    fs::create_dir_all(&output_dir).map_err(|e| format!("Could not create export directory: {e}"))?;

    let initial = ExportJobStatus {
        job_id: job_id.clone(),
        total: photos.len(),
        completed: 0,
        failed: 0,
        running: true,
        finished: false,
        output_dir: settings.directory.clone(),
        last_error: None,
    };
    {
        let mut jobs = EXPORT_JOBS
            .lock()
            .map_err(|_| "Could not lock export job store".to_string())?;
        jobs.insert(job_id.clone(), initial);
    }

    let worker_job_id = job_id.clone();
    thread::spawn(move || {
        let ext = output_ext(&settings.format).to_string();
        for photo in photos {
            let output_path = next_available_output_path(&output_dir, &photo.file_name, &ext);
            let result = run_darktable_export(&photo.source_path, &output_path, &settings);

            if let Ok(mut jobs) = EXPORT_JOBS.lock() {
                if let Some(status) = jobs.get_mut(&worker_job_id) {
                    match result {
                        Ok(()) => status.completed += 1,
                        Err(err) => {
                            status.failed += 1;
                            status.last_error = Some(err);
                        }
                    }
                }
            }
        }
        if let Ok(mut jobs) = EXPORT_JOBS.lock() {
            if let Some(status) = jobs.get_mut(&worker_job_id) {
                status.running = false;
                status.finished = true;
            }
        }
    });

    Ok(job_id)
}

#[tauri::command]
pub fn get_export_job_status(job_id: String) -> Result<Option<ExportJobStatus>, String> {
    let jobs = EXPORT_JOBS
        .lock()
        .map_err(|_| "Could not lock export job store".to_string())?;
    Ok(jobs.get(&job_id).cloned())
}
