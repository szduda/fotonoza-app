use crate::types::{ExportSettings, HistogramData};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn output_ext(format: &str) -> &'static str {
    match format.to_ascii_lowercase().as_str() {
        "png" => "png",
        _ => "jpg",
    }
}

fn histogram_temp_path() -> PathBuf {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    std::env::temp_dir().join(format!("fotonoza-histogram-{now_ms}.png"))
}

pub fn run_darktable_export(
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
pub fn run_darktable_operation(photo_path: String, xmp_path: String) -> Result<(), String> {
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
pub async fn get_photo_histogram(photo_path: String) -> Result<HistogramData, String> {
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

        histogram_from_image(Path::new(&photo_path))
    })
    .await
    .map_err(|e| format!("Histogram worker join error: {e}"))?
}
