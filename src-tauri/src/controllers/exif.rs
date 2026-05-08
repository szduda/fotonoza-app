use crate::types::PhotoExifSummary;
use exif::{Exif, Field, Reader, Tag, Value};
use std::fs::File;
use std::io::BufReader;

fn field_by_tag<'a>(exif: &'a Exif, tag: Tag) -> Option<&'a Field> {
    exif.fields().find(|f| f.tag == tag)
}

fn ascii_field(field: &Field) -> Option<String> {
    match &field.value {
        Value::Ascii(parts) if !parts.is_empty() => {
            let s = String::from_utf8_lossy(&parts[0]).trim().to_string();
            if s.is_empty() {
                None
            } else {
                Some(s)
            }
        }
        _ => None,
    }
}

fn fmt_exif_datetime(raw: &str) -> String {
    let mut parts = raw.split_whitespace();
    let date = parts.next().unwrap_or("");
    let time = parts.next().unwrap_or("");
    if date.is_empty() {
        return raw.to_string();
    }
    let date_fmt = date.replace(':', "-");
    if time.is_empty() {
        date_fmt
    } else {
        format!("{date_fmt} {time}")
    }
}

fn fmt_shutter(r: &exif::Rational) -> String {
    let sec = r.to_f64();
    if !sec.is_finite() || sec <= 0.0 {
        return String::new();
    }
    if sec >= 1.0 {
        format!("{:.1} s", sec)
    } else {
        let inv = (1.0 / sec).round() as i64;
        format!("1/{inv} s")
    }
}

fn fmt_aperture(r: &exif::Rational) -> String {
    let v = r.to_f64();
    if !v.is_finite() || v <= 0.0 {
        return String::new();
    }
    format!("f/{:.1}", v)
}

fn iso_from_field(field: &Field) -> Option<u32> {
    field.value.get_uint(0)
}

fn build_exposure_summary(exif: &Exif) -> Option<String> {
    let mut parts: Vec<String> = Vec::new();

    if let Some(f) = field_by_tag(exif, Tag::ExposureTime) {
        if let Value::Rational(ref v) = f.value {
            if let Some(r) = v.first() {
                let s = fmt_shutter(r);
                if !s.is_empty() {
                    parts.push(s);
                }
            }
        }
    }

    if let Some(f) = field_by_tag(exif, Tag::FNumber) {
        if let Value::Rational(ref v) = f.value {
            if let Some(r) = v.first() {
                let s = fmt_aperture(r);
                if !s.is_empty() {
                    parts.push(s);
                }
            }
        }
    }

    let iso = field_by_tag(exif, Tag::PhotographicSensitivity)
        .and_then(iso_from_field)
        .or_else(|| field_by_tag(exif, Tag::ISOSpeed).and_then(iso_from_field));

    if let Some(n) = iso {
        parts.push(format!("ISO {n}"));
    }

    if parts.is_empty() {
        None
    } else {
        Some(parts.join(" · "))
    }
}

fn read_inner(path: &str) -> Option<PhotoExifSummary> {
    let file = File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let exif = Reader::new().read_from_container(&mut reader).ok()?;

    let date_time_original = field_by_tag(&exif, Tag::DateTimeOriginal)
        .and_then(ascii_field)
        .map(|s| fmt_exif_datetime(&s));

    let exposure_summary = build_exposure_summary(&exif);

    let camera_make = field_by_tag(&exif, Tag::Make).and_then(ascii_field);
    let camera_model = field_by_tag(&exif, Tag::Model).and_then(ascii_field);
    let lens_make = field_by_tag(&exif, Tag::LensMake).and_then(ascii_field);
    let lens_model = field_by_tag(&exif, Tag::LensModel).and_then(ascii_field);

    Some(PhotoExifSummary {
        date_time_original,
        exposure_summary,
        camera_make,
        camera_model,
        lens_make,
        lens_model,
    })
}

#[tauri::command]
pub fn get_photo_exif(source_path: String) -> Result<PhotoExifSummary, String> {
    Ok(read_inner(&source_path).unwrap_or_default())
}
