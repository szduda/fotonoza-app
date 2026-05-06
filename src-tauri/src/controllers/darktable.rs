use crate::controllers::paths::{fotonoza_import_dir, preview_dir};
use crate::controllers::preview::render_basic_effects_image;
use crate::types::{ExportSettings, HistogramData};
use std::fs;
use std::hash::{Hash, Hasher};
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

fn hash_preview_key(path: &str, filmic_rgb: bool, profiled_denoise: bool) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut h);
    filmic_rgb.hash(&mut h);
    profiled_denoise.hash(&mut h);
    h.finish()
}

fn darktable_preview_path(
    source_path: &str,
    filmic_rgb: bool,
    profiled_denoise: bool,
) -> Result<PathBuf, String> {
    let import = fotonoza_import_dir()?;
    let prev = preview_dir(&import);
    fs::create_dir_all(&prev).map_err(|e| e.to_string())?;
    let stem = Path::new(source_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("preview");
    let h = hash_preview_key(source_path, filmic_rgb, profiled_denoise);
    Ok(prev.join(format!("{stem}-dt-{h:016x}.jpg")))
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

fn run_darktable_preview_inner(
    source_path: String,
    filmic_rgb: bool,
    profiled_denoise: bool,
) -> Result<String, String> {
    if !Path::new(&source_path).exists() {
        return Err("Photo path does not exist".to_string());
    }
    let out_path = darktable_preview_path(&source_path, filmic_rgb, profiled_denoise)?;
    let mut command = Command::new("darktable-cli");
    command.arg(&source_path).arg(&out_path);
    if filmic_rgb {
        command
            .arg("--core")
            .arg("--conf")
            .arg("plugins/darkroom/filmicrgb/enable=true");
    }
    if profiled_denoise {
        command
            .arg("--core")
            .arg("--conf")
            .arg("plugins/darkroom/denoiseprofile/enable=true");
    }
    let status = command
        .status()
        .map_err(|e| format!("Failed to spawn darktable-cli: {e}"))?;
    if !status.success() {
        return Err(format!(
            "darktable-cli preview exited with non-zero status: {:?}",
            status.code()
        ));
    }
    Ok(out_path.to_string_lossy().to_string())
}

#[allow(clippy::too_many_arguments)]
fn run_darktable_render(
    photo_path: &str,
    output_path: &Path,
    filmic_rgb: bool,
    profiled_denoise: bool,
) -> Result<(), String> {
    let mut command = Command::new("darktable-cli");
    command.arg(photo_path).arg(output_path);
    if filmic_rgb {
        command
            .arg("--core")
            .arg("--conf")
            .arg("plugins/darkroom/filmicrgb/enable=true");
    }
    if profiled_denoise {
        command
            .arg("--core")
            .arg("--conf")
            .arg("plugins/darkroom/denoiseprofile/enable=true");
    }
    let status = command
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

fn run_darktable_operation_inner(
    photo_path: String,
    xmp_path: String,
    output_path: String,
) -> Result<(), String> {
    if !Path::new(&photo_path).exists() {
        return Err("Photo path does not exist".to_string());
    }

    let status = Command::new("darktable-cli")
        .arg(&photo_path)
        .arg(&xmp_path)
        .arg(&output_path)
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

/// `darktable-cli <input> [<xmp>] <output>` — applies sidecar stack to export.
#[tauri::command]
pub async fn run_darktable_operation(
    photo_path: String,
    xmp_path: String,
    output_path: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        run_darktable_operation_inner(photo_path, xmp_path, output_path)
    })
    .await
    .map_err(|e| format!("darktable worker join: {e}"))?
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn get_photo_histogram(
    photo_path: String,
    exposure_ev: f32,
    contrast: f32,
    contrast_balance: f32,
    clarity: f32,
    vibrance: f32,
    saturation: f32,
    shadows: f32,
    darks: f32,
    lights: f32,
    highlights: f32,
    filmic_rgb: bool,
    profiled_denoise: bool,
) -> Result<HistogramData, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !Path::new(&photo_path).exists() {
            return Err("Photo path does not exist".to_string());
        }
        let rendered_path = histogram_temp_path();

        let darktable_source = if filmic_rgb || profiled_denoise {
            match run_darktable_render(&photo_path, &rendered_path, filmic_rgb, profiled_denoise) {
                Ok(()) => rendered_path.clone(),
                Err(_) => PathBuf::from(&photo_path),
            }
        } else {
            PathBuf::from(&photo_path)
        };

        let live_hist = render_basic_effects_image(
            darktable_source.to_string_lossy().as_ref(),
            exposure_ev,
            contrast,
            contrast_balance,
            clarity,
            vibrance,
            saturation,
            shadows,
            darks,
            lights,
            highlights,
            2048,
            2048,
            true,
        )
        .map(|img| {
            let mut tmp = histogram_temp_path();
            tmp.set_extension("jpg");
            (img, tmp)
        })
        .and_then(|(img, out_path)| {
            img.save(&out_path).map_err(|e| e.to_string())?;
            let hist = histogram_from_image(&out_path);
            let _ = fs::remove_file(&out_path);
            hist
        });

        if darktable_source == rendered_path {
            let _ = fs::remove_file(&rendered_path);
        }

        if live_hist.is_ok() {
            return live_hist;
        }

        match run_darktable_render(&photo_path, &rendered_path, filmic_rgb, profiled_denoise) {
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

#[tauri::command]
pub async fn render_darktable_fx_preview(
    source_path: String,
    filmic_rgb: bool,
    profiled_denoise: bool,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        run_darktable_preview_inner(source_path, filmic_rgb, profiled_denoise)
    })
    .await
    .map_err(|e| format!("darktable fx preview worker join: {e}"))?
}
