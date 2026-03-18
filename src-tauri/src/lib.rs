use base64::Engine;
use std::path::PathBuf;
use std::sync::Mutex;

#[allow(non_snake_case)]
#[tauri::command]
fn read_file_as_data_url(baseDir: String, relativePath: String) -> Result<String, String> {
    let base = PathBuf::from(&baseDir);
    let full_path = base.join(&relativePath);

    let canonical = full_path
        .canonicalize()
        .map_err(|e| format!("File not found: {}: {}", relativePath, e))?;

    let canonical_base = base.canonicalize().unwrap_or_else(|_| base.clone());
    if !canonical.starts_with(&canonical_base) {
        return Err("Path traversal not allowed".into());
    }

    let data =
        std::fs::read(&canonical).map_err(|e| format!("Failed to read {}: {}", relativePath, e))?;

    let mime = match canonical
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "ico" => "image/x-icon",
        "bmp" => "image/bmp",
        _ => "application/octet-stream",
    };

    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
fn read_file_text(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

/// Called by frontend to get the file path passed as CLI arg
#[tauri::command]
fn get_pending_file(state: tauri::State<'_, PendingFile>) -> Option<String> {
    state.0.lock().unwrap().take()
}

struct PendingFile(Mutex<Option<String>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let file_arg: Option<String> = std::env::args()
        .skip(1)
        .find(|a| {
            let lower = a.to_lowercase();
            lower.ends_with(".md")
                || lower.ends_with(".markdown")
                || lower.ends_with(".mdown")
                || lower.ends_with(".mkd")
                || lower.ends_with(".mkdn")
        })
        .map(|p| {
            std::path::absolute(PathBuf::from(&p))
                .unwrap_or_else(|_| PathBuf::from(&p))
                .to_string_lossy()
                .into_owned()
        });

    tauri::Builder::default()
        .manage(PendingFile(Mutex::new(file_arg)))
        .invoke_handler(tauri::generate_handler![
            read_file_as_data_url,
            read_file_text,
            get_pending_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
