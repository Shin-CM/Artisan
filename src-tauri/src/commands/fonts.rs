//! Lecture sécurisée des fichiers de police pour les PDF.

use base64::Engine;
use serde::Deserialize;
use std::fs;
use std::path::Path;

/// Extensions acceptées pour import / lecture système.
pub(crate) fn font_file_extension(path: &Path) -> Option<&'static str> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())?;
    match ext.as_str() {
        "ttf" => Some("ttf"),
        "otf" => Some("otf"),
        "ttc" => Some("ttc"),
        _ => None,
    }
}

/// Extrait une face SFNT d’un fichier TrueType Collection (.ttc).
pub(crate) fn ttc_extract_face(data: &[u8], face_index: u32) -> Result<Vec<u8>, String> {
    if data.len() < 12 {
        return Err("Fichier de police trop court.".into());
    }
    if &data[0..4] != b"ttcf" {
        return Err("Fichier .ttc invalide (en-tête attendu).".into());
    }
    let num_fonts = u32::from_be_bytes([data[8], data[9], data[10], data[11]]) as usize;
    if num_fonts == 0 {
        return Err("Collection de polices vide.".into());
    }
    let idx = face_index as usize;
    if idx >= num_fonts {
        return Err(format!(
            "Index de face {face_index} hors plage (0..{}).",
            num_fonts.saturating_sub(1)
        ));
    }
    let offset_table_start = 12;
    let entry = offset_table_start + idx * 4;
    if entry + 4 > data.len() {
        return Err("En-tête TTC tronqué.".into());
    }
    let off = u32::from_be_bytes([
        data[entry],
        data[entry + 1],
        data[entry + 2],
        data[entry + 3],
    ]) as usize;
    if off >= data.len() {
        return Err("Offset TTC invalide.".into());
    }
    let end = if idx + 1 < num_fonts {
        let next_entry = offset_table_start + (idx + 1) * 4;
        if next_entry + 4 > data.len() {
            return Err("En-tête TTC tronqué.".into());
        }
        u32::from_be_bytes([
            data[next_entry],
            data[next_entry + 1],
            data[next_entry + 2],
            data[next_entry + 3],
        ]) as usize
    } else {
        data.len()
    };
    if end <= off || end > data.len() {
        return Err("Tranche de police dans le TTC invalide.".into());
    }
    Ok(data[off..end].to_vec())
}

fn sfnt_output_extension(sfnt: &[u8]) -> &'static str {
    if sfnt.len() >= 4 && &sfnt[0..4] == b"OTTO" {
        "otf"
    } else {
        "ttf"
    }
}

/// Lit un fichier .ttf/.otf ou extrait une face d’un .ttc. Retourne les octets SFNT et l’extension de fichier cible.
pub(crate) fn read_font_sfnt_bytes(
    path: &Path,
    face_index: u32,
) -> Result<(Vec<u8>, &'static str), String> {
    let ext = font_file_extension(path).ok_or_else(|| {
        "Extension non prise en charge (utilisez .ttf, .otf ou .ttc).".to_string()
    })?;
    let raw =
        fs::read(path).map_err(|e| format!("Lecture du fichier de police impossible : {}", e))?;
    match ext {
        "ttc" => {
            let sfnt = ttc_extract_face(&raw, face_index)?;
            let out_ext = sfnt_output_extension(&sfnt);
            Ok((sfnt, out_ext))
        }
        "ttf" | "otf" => Ok((raw, ext)),
        _ => unreachable!(),
    }
}

/// Préfixes de chemins considérés comme des répertoires de polices système / utilisateur.
pub(crate) fn is_trusted_font_path(path: &Path) -> bool {
    let Ok(canonical) = path.canonicalize() else {
        return false;
    };
    let s = canonical.to_string_lossy().to_lowercase();

    #[cfg(target_os = "macos")]
    {
        return s.contains("/library/fonts")
            || s.contains("/system/library/fonts")
            || s.contains("/system/volumes/data/library/fonts")
            || s.contains("/system/volumes/data/system/library/fonts")
            || (s.contains("/users/") && s.contains("/library/fonts"));
    }
    #[cfg(target_os = "windows")]
    {
        return s.contains("\\windows\\fonts\\")
            || s.contains("\\appdata\\local\\microsoft\\windows\\fonts\\");
    }
    #[cfg(target_os = "linux")]
    {
        return s.contains("/usr/share/fonts")
            || s.contains("/usr/local/share/fonts")
            || s.contains("/.local/share/fonts")
            || s.contains("/.fonts/");
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        let _ = s;
        false
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFontInput {
    path: String,
    face_index: u32,
}

/// Lit une police système (fichier entier ou face extraite d’un `.ttc`) en Base64.
#[tauri::command]
pub fn read_font_file_base64(input: ReadFontInput) -> Result<String, String> {
    let ReadFontInput { path, face_index } = input;
    let p = Path::new(&path);
    if !is_trusted_font_path(p) {
        return Err("Chemin de police non autorisé.".to_string());
    }
    if font_file_extension(p).is_none() {
        return Err(
            "Extension de police non prise en charge (utilisez .ttf, .otf ou .ttc).".to_string(),
        );
    }
    let (bytes, _) = read_font_sfnt_bytes(p, face_index)?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}
