use crate::controllers::paths::{fotonoza_import_dir, preview_dir};
use image::RgbImage;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;
use std::path::PathBuf;

fn hash_path_key(path: &str) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut h);
    h.finish()
}

fn clamp01(x: f32) -> f32 {
    x.clamp(0.0, 1.0)
}

fn mix(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// sRGB-ish preview (not full darktable raw pipeline). Fast for slider drags.
fn apply_basic_effects_rgb(r: f32, g: f32, b: f32, exposure_ev: f32, contrast: f32, sat: f32) -> (f32, f32, f32) {
    let lin = 2_f32.powf(exposure_ev);
    let mut r = r * lin;
    let mut g = g * lin;
    let mut b = b * lin;

    r = (r - 0.5) * contrast + 0.5;
    g = (g - 0.5) * contrast + 0.5;
    b = (b - 0.5) * contrast + 0.5;

    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = mix(lum, r, sat);
    g = mix(lum, g, sat);
    b = mix(lum, b, sat);

    (clamp01(r), clamp01(g), clamp01(b))
}

fn preview_output_path(source_path: &str) -> Result<PathBuf, String> {
    let import = fotonoza_import_dir()?;
    let prev = preview_dir(&import);
    fs::create_dir_all(&prev).map_err(|e| e.to_string())?;
    let stem = Path::new(source_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("preview");
    let h = hash_path_key(source_path);
    Ok(prev.join(format!("{stem}-{h:016x}.jpg")))
}

fn render_basic_effects_preview_inner(
    source_path: String,
    exposure_ev: f32,
    contrast: f32,
    saturation: f32,
) -> Result<String, String> {
    if !Path::new(&source_path).exists() {
        return Err("Source image does not exist".to_string());
    }
    let img = image::open(&source_path).map_err(|e| e.to_string())?;
    let max_side = 2048u32;
    let img = if img.width() > max_side || img.height() > max_side {
        img.thumbnail(max_side, max_side)
    } else {
        img
    };
    let rgb = img.to_rgb8();
    let (w, h) = (rgb.width(), rgb.height());
    let mut out = RgbImage::new(w, h);

    for (x, y, px) in rgb.enumerate_pixels() {
        let r = px[0] as f32 / 255.0;
        let g = px[1] as f32 / 255.0;
        let b = px[2] as f32 / 255.0;
        let (nr, ng, nb) = apply_basic_effects_rgb(r, g, b, exposure_ev, contrast, saturation);
        out.put_pixel(
            x,
            y,
            image::Rgb([
                (nr * 255.0).round() as u8,
                (ng * 255.0).round() as u8,
                (nb * 255.0).round() as u8,
            ]),
        );
    }

    let out_path = preview_output_path(&source_path)?;
    let mut tmp_name = out_path
        .file_name()
        .ok_or_else(|| "preview path has no file name".to_string())?
        .to_os_string();
    tmp_name.push(".partial");
    let tmp_path = out_path.with_file_name(tmp_name);
    out.save(&tmp_path).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, &out_path).map_err(|e| format!("atomic preview rename: {e}"))?;
    Ok(out_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn render_basic_effects_preview(
    source_path: String,
    exposure_ev: f32,
    contrast: f32,
    saturation: f32,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        render_basic_effects_preview_inner(source_path, exposure_ev, contrast, saturation)
    })
    .await
    .map_err(|e| format!("preview worker join: {e}"))?
}
