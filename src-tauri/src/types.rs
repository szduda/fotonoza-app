use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoState {
    pub id: String,
    pub file_name: String,
    pub source_path: String,
    pub working_path: Option<String>,
    pub selected: bool,
    pub approved: bool,
    pub adjustments: serde_json::Value,
}

pub fn default_layout_width() -> u32 {
    300
}

pub fn default_timeline_height() -> u32 {
    200
}

pub fn default_top_bar_height() -> u32 {
    100
}

pub fn default_false() -> bool {
    false
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutState {
    #[serde(default = "default_layout_width")]
    pub left_sidebar_width_px: u32,
    #[serde(default = "default_layout_width")]
    pub right_sidebar_width_px: u32,
    #[serde(default = "default_timeline_height")]
    pub timeline_height_px: u32,
    #[serde(default = "default_top_bar_height")]
    pub top_bar_height_px: u32,
    #[serde(default = "default_false")]
    pub left_sidebar_collapsed: bool,
    #[serde(default = "default_false")]
    pub right_sidebar_collapsed: bool,
    #[serde(default = "default_false")]
    pub timeline_collapsed: bool,
    #[serde(default = "default_false")]
    pub top_bar_collapsed: bool,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub mode: String,
    pub photos: Vec<PhotoState>,
    #[serde(alias = "selectedPhotoId")]
    pub current_photo_id: Option<String>,
    pub history: serde_json::Value,
    pub history_cursor: usize,
    #[serde(default)]
    pub toggle_panel_expanded: std::collections::HashMap<String, bool>,
    pub export_settings: serde_json::Value,
    pub locale: String,
    #[serde(default)]
    pub layout: LayoutState,
}

/// Full disk root: app fields at top level plus optional undo stacks (camelCase from TS).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreSnapshot {
    #[serde(flatten)]
    pub present: AppState,
    #[serde(default)]
    pub undo_past: Vec<AppState>,
    #[serde(default)]
    pub undo_future: Vec<AppState>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistogramData {
    pub red: Vec<u32>,
    pub green: Vec<u32>,
    pub blue: Vec<u32>,
    pub luma: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSettings {
    pub directory: String,
    pub format: String,
    pub quality: u8,
    pub max_width: u32,
    pub max_height: u32,
    pub dont_enlarge: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportTaskPhoto {
    pub source_path: String,
    pub file_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportJobStatus {
    pub job_id: String,
    pub total: usize,
    pub completed: usize,
    pub failed: usize,
    pub running: bool,
    pub finished: bool,
    pub output_dir: String,
    pub last_error: Option<String>,
}
