use crate::controllers::paths::{fotonoza_import_dir, preview_dir};
use image::{DynamicImage, GenericImageView, RgbImage, imageops::FilterType};
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

fn smoothstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Fast shared live look for JPG/PNG preview and export.
#[allow(clippy::too_many_arguments)]
fn apply_live_effects_rgb(
    r: f32,
    g: f32,
    b: f32,
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
) -> (f32, f32, f32) {
    let lin = 2_f32.powf(exposure_ev);
    let mut r = r * lin;
    let mut g = g * lin;
    let mut b = b * lin;

    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let pivot = (0.5 + contrast_balance * 0.25).clamp(0.2, 0.8);
    r = (r - pivot) * contrast + pivot;
    g = (g - pivot) * contrast + pivot;
    b = (b - pivot) * contrast + pivot;

    let sh = smoothstep(0.0, 0.45, 1.0 - lum);
    let dk = smoothstep(0.15, 0.6, 1.0 - lum);
    let lt = smoothstep(0.4, 0.85, lum);
    let hi = smoothstep(0.65, 1.0, lum);
    r += shadows * 0.25 * sh + darks * 0.2 * dk + lights * 0.2 * lt + highlights * 0.25 * hi;
    g += shadows * 0.25 * sh + darks * 0.2 * dk + lights * 0.2 * lt + highlights * 0.25 * hi;
    b += shadows * 0.25 * sh + darks * 0.2 * dk + lights * 0.2 * lt + highlights * 0.25 * hi;

    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let micro = (r + g + b - 3.0 * lum) / 3.0;
    r += micro * clarity * 0.7;
    g += micro * clarity * 0.7;
    b += micro * clarity * 0.7;

    let mx = r.max(g).max(b);
    let mn = r.min(g).min(b);
    let ch = (mx - mn).clamp(0.0, 1.0);
    let vib_t = (1.0 - ch).powf(1.35).clamp(0.0, 1.0);
    let sat_gain = saturation + vibrance * vib_t;
    r = mix(lum, r, sat_gain);
    g = mix(lum, g, sat_gain);
    b = mix(lum, b, sat_gain);

    (clamp01(r), clamp01(g), clamp01(b))
}

pub fn render_basic_effects_image(
    source_path: &str,
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
    max_width: u32,
    max_height: u32,
    dont_enlarge: bool,
) -> Result<DynamicImage, String> {
    if !Path::new(source_path).exists() {
        return Err("Source image does not exist".to_string());
    }
    let img = image::open(source_path).map_err(|e| e.to_string())?;
    let resized = resize_to_settings(img, max_width, max_height, dont_enlarge);
    let rgb = resized.to_rgb8();
    let (w, h) = rgb.dimensions();
    let mut out = RgbImage::new(w, h);

    for (x, y, px) in rgb.enumerate_pixels() {
        let r = px[0] as f32 / 255.0;
        let g = px[1] as f32 / 255.0;
        let b = px[2] as f32 / 255.0;
        let (nr, ng, nb) = apply_live_effects_rgb(
            r,
            g,
            b,
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
        );
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

    Ok(DynamicImage::ImageRgb8(out))
}

fn resize_to_settings(
    img: DynamicImage,
    max_width: u32,
    max_height: u32,
    dont_enlarge: bool,
) -> DynamicImage {
    let (w, h) = img.dimensions();
    if w == 0 || h == 0 || max_width == 0 || max_height == 0 {
        return img;
    }
    if dont_enlarge && w <= max_width && h <= max_height {
        return img;
    }
    if w <= max_width && h <= max_height {
        return img;
    }
    img.resize(max_width, max_height, FilterType::Lanczos3)
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
    let out = render_basic_effects_image(
        &source_path,
        exposure_ev,
        contrast,
        0.0,
        0.0,
        0.0,
        saturation,
        0.0,
        0.0,
        0.0,
        0.0,
        2048,
        2048,
        true,
    )?;

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
