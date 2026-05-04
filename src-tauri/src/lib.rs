use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{LazyLock, Mutex};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

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

fn default_layout_width() -> u32 {
    300
}

fn default_timeline_height() -> u32 {
    200
}

fn default_top_bar_height() -> u32 {
    100
}

fn default_false() -> bool {
    false
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LayoutState {
    #[serde(default = "default_layout_width")]
    left_sidebar_width_px: u32,
    #[serde(default = "default_layout_width")]
    right_sidebar_width_px: u32,
    #[serde(default = "default_timeline_height")]
    timeline_height_px: u32,
    #[serde(default = "default_top_bar_height")]
    top_bar_height_px: u32,
    #[serde(default = "default_false")]
    left_sidebar_collapsed: bool,
    #[serde(default = "default_false")]
    right_sidebar_collapsed: bool,
    #[serde(default = "default_false")]
    timeline_collapsed: bool,
    #[serde(default = "default_false")]
    top_bar_collapsed: bool,
}

impl Default for LayoutState {
    fn default() -> Self {
        Self {
            left_sidebar_width_px: default_layout_width(),
            right_sidebar_width_px: default_layout_width(),
            timeline_height_px: default_timeline_height(),
            top_bar_height_px: default_top_bar_height(),
            left_sidebar_collapsed: false,
            right_sidebar_collapsed: false,
            timeline_collapsed: false,
            top_bar_collapsed: false,
        }
    }
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppState {
    mode: String,
    photos: Vec<PhotoState>,
    #[serde(alias = "selectedPhotoId")]
    current_photo_id: Option<String>,
    history: serde_json::Value,
    history_cursor: usize,
    #[serde(default)]
    toggle_panel_expanded: std::collections::HashMap<String, bool>,
    export_settings: serde_json::Value,
    locale: String,
    #[serde(default)]
    layout: LayoutState,
}

/// Full disk root: app fields at top level plus optional undo stacks (camelCase from TS).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoreSnapshot {
    #[serde(flatten)]
    present: AppState,
    #[serde(default)]
    undo_past: Vec<AppState>,
    #[serde(default)]
    undo_future: Vec<AppState>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct HistogramData {
    red: Vec<u32>,
    green: Vec<u32>,
    blue: Vec<u32>,
    luma: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportSettings {
    directory: String,
    format: String,
    quality: u8,
    max_width: u32,
    max_height: u32,
    dont_enlarge: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportTaskPhoto {
    source_path: String,
    file_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportJobStatus {
    job_id: String,
    total: usize,
    completed: usize,
    failed: usize,
    running: bool,
    finished: bool,
    output_dir: String,
    last_error: Option<String>,
}

static EXPORT_JOBS: LazyLock<Mutex<HashMap<String, ExportJobStatus>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn app_state_path() -> PathBuf {
    PathBuf::from(".fotonoza")
}

fn photo_state_path(file_name: &str) -> PathBuf {
    PathBuf::from(format!(".{}.fotonoza", file_name))
}

fn histogram_temp_path() -> PathBuf {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    std::env::temp_dir().join(format!("fotonoza-histogram-{now_ms}.png"))
}

fn output_ext(format: &str) -> &'static str {
    match format.to_ascii_lowercase().as_str() {
        "png" => "png",
        _ => "jpg",
    }
}

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

fn run_darktable_export(
    source_path: &str,
    output_path: &Path,
    settings: &ExportSettings,
) -> Result<(), String> {
    let mut command = Command::new("darktable-cli");
    command.arg(source_path).arg(output_path);
    command
        .arg("--width")
        .arg(settings.max_width.to_string())
        .arg("--height")
        .arg(settings.max_height.to_string())
        .arg("--upscale")
        .arg(if settings.dont_enlarge { "false" } else { "true" });

    if output_ext(&settings.format) == "jpg" {
        command
            .arg("--core")
            .arg("--conf")
            .arg(format!(
                "plugins/imageio/format/jpeg/quality={}",
                settings.quality
            ));
    }

    let status = command
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

fn run_darktable_render(photo_path: &str, output_path: &Path) -> Result<(), String> {
    let status = Command::new("darktable-cli")
        .arg(photo_path)
        .arg(output_path)
        .status()
        .map_err(|e| format!("Failed to spawn darktable-cli: {e}"))?;

    if !status.success() {
        return Err(format!(
            "darktable-cli exited with non-zero status while rendering histogram source: {:?}",
            status.code()
        ));
    }
    Ok(())
}

fn histogram_from_image(path: &Path) -> Result<HistogramData, String> {
    let img = image::open(path)
        .map_err(|e| format!("Unable to open rendered image for histogram: {e}"))?;
    let rgb = img.to_rgb8();

    let mut red = vec![0_u32; 256];
    let mut green = vec![0_u32; 256];
    let mut blue = vec![0_u32; 256];
    let mut luma = vec![0_u32; 256];

    for px in rgb.pixels() {
        let r = px[0] as usize;
        let g = px[1] as usize;
        let b = px[2] as usize;
        red[r] += 1;
        green[g] += 1;
        blue[b] += 1;
        let y = (0.2126 * r as f32 + 0.7152 * g as f32 + 0.0722 * b as f32)
            .round()
            .clamp(0.0, 255.0) as usize;
        luma[y] += 1;
    }

    Ok(HistogramData {
        red,
        green,
        blue,
        luma,
    })
}

#[tauri::command]
fn save_app_state(snapshot: StoreSnapshot) -> Result<(), String> {
    let serialized = serde_json::to_string_pretty(&snapshot).map_err(|e| e.to_string())?;
    fs::write(app_state_path(), serialized).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_app_state() -> Result<Option<StoreSnapshot>, String> {
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

#[tauri::command]
async fn get_photo_histogram(photo_path: String) -> Result<HistogramData, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !Path::new(&photo_path).exists() {
            return Err("Photo path does not exist".to_string());
        }
        let rendered_path = histogram_temp_path();
        match run_darktable_render(&photo_path, &rendered_path) {
            Ok(()) => {
                let hist = histogram_from_image(&rendered_path);
                let _ = fs::remove_file(&rendered_path);
                if hist.is_ok() {
                    return hist;
                }
            }
            Err(_e) => {
                // Fall through to direct decode fallback.
            }
        }

        // Fallback: decode source image directly when darktable-cli is unavailable/fails.
        histogram_from_image(Path::new(&photo_path))
    })
    .await
    .map_err(|e| format!("Histogram worker join error: {e}"))?
}

#[tauri::command]
fn get_default_export_directory(collection_name: String) -> Result<String, String> {
    let base = dirs::picture_dir()
        .or_else(|| std::env::current_dir().ok())
        .ok_or_else(|| "Could not resolve base directory".to_string())?;
    Ok(base.join(collection_name).to_string_lossy().to_string())
}

#[tauri::command]
fn start_export_job(photos: Vec<ExportTaskPhoto>, settings: ExportSettings) -> Result<String, String> {
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
fn get_export_job_status(job_id: String) -> Result<Option<ExportJobStatus>, String> {
    let jobs = EXPORT_JOBS
        .lock()
        .map_err(|_| "Could not lock export job store".to_string())?;
    Ok(jobs.get(&job_id).cloned())
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
            run_darktable_operation,
            get_photo_histogram,
            get_default_export_directory,
            start_export_job,
            get_export_job_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running fotonoza");
}
