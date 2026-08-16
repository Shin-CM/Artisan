use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use serde::Serialize;
use tauri::Manager;
use uuid::Uuid;

use super::fonts;

/// Ouvre le dialogue système pour choisir une image logo ; retourne le chemin absolu ou None si annulé.
///
/// Utilise `AsyncFileDialog` : sur macOS le dialogue synchrone depuis le pool de threads Tauri
/// ne s’affiche pas correctement et renvoie souvent `None` sans interaction utilisateur.
#[tauri::command]
pub async fn pick_logo_file_path() -> Result<Option<String>, String> {
    let path = rfd::AsyncFileDialog::new()
        .set_title("Choisir un logo")
        .add_filter("Image", &["png", "jpg", "jpeg", "webp", "gif"])
        .pick_file()
        .await
        .map(|f| f.path().to_string_lossy().to_string());
    Ok(path)
}

/// Dialogue système pour choisir le dossier d’export PDF ; `None` si annulé.
#[tauri::command]
pub async fn pick_pdf_output_dir() -> Result<Option<String>, String> {
    let path = rfd::AsyncFileDialog::new()
        .set_title("Dossier de sortie des PDF")
        .pick_folder()
        .await
        .map(|f| f.path().to_string_lossy().to_string());
    Ok(path)
}

const MAX_LOGO_BYTES: u64 = 2 * 1024 * 1024;
const MAX_PDF_FONT_BYTES: u64 = 12 * 1024 * 1024;
/// Limite de fichiers copiés par import dossier (parcours récursif).
const MAX_FOLDER_FONT_IMPORTS: usize = 80;
/// Profondeur max de sous-dossiers sous le dossier choisi (fichiers plus profonds sont ignorés).
const MAX_FONT_IMPORT_DEPTH: usize = 8;
/// Longueur max d’un segment de chemin sous `fonts/` (nom de dossier).
const MAX_FONT_DIR_SEGMENT_LEN: usize = 80;

fn io_message(context: &str, err: std::io::Error) -> String {
    format!("{context} : {err}")
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path().app_local_data_dir().map_err(|e| e.to_string())
}

fn normalize_relative_asset_path(workspace_id: &str, relative: &str) -> Result<PathBuf, String> {
    let prefix = format!("workspace_assets/{}/", workspace_id);
    if !relative.starts_with(&prefix) || relative.contains("..") {
        return Err("Chemin de ressource invalide.".into());
    }
    let rest = &relative[prefix.len()..];
    if rest.is_empty() || rest.starts_with('/') {
        return Err("Chemin de ressource invalide.".into());
    }
    let parts: Vec<&str> = rest.split('/').filter(|p| !p.is_empty()).collect();
    match parts.as_slice() {
        [file] if *file != "fonts" => Ok(PathBuf::from(relative)),
        [first, rest @ ..] if *first == "fonts" && !rest.is_empty() => {
            if rest.iter().any(|p| p.is_empty()) {
                return Err("Chemin de ressource invalide.".into());
            }
            Ok(PathBuf::from(relative))
        }
        _ => Err("Chemin de ressource invalide.".into()),
    }
}

fn sanitize_font_dir_component(name: &str) -> Option<String> {
    let t = name.trim();
    if t.is_empty() || t == "." || t == ".." {
        return None;
    }
    let mut out = String::new();
    for c in t.chars() {
        match c {
            '/' | '\\' | ':' | '<' | '>' | '"' | '|' | '?' | '*' | '\0' => out.push('_'),
            c if c.is_control() => {}
            c => out.push(c),
        }
    }
    let out = out.trim_matches('.').trim();
    if out.is_empty() {
        None
    } else {
        Some(out.chars().take(MAX_FONT_DIR_SEGMENT_LEN).collect())
    }
}

/// Segments de dossiers relatifs à la racine d’import, pour placer le fichier sous `fonts/<segments>/`.
fn sanitized_parent_segments(import_root: &Path, file_path: &Path) -> Option<Vec<String>> {
    let rel = file_path.strip_prefix(import_root).ok()?;
    let parent = match rel.parent() {
        None => return Some(vec![]),
        Some(p) if p.as_os_str().is_empty() => return Some(vec![]),
        Some(p) => p,
    };
    let mut segments = Vec::new();
    for c in parent.components() {
        if let std::path::Component::Normal(os) = c {
            let s = os.to_str().and_then(sanitize_font_dir_component)?;
            segments.push(s);
            if segments.len() > MAX_FONT_IMPORT_DEPTH {
                return None;
            }
        }
    }
    Some(segments)
}

fn workspace_fonts_root(app: &tauri::AppHandle, workspace_id: &str) -> Result<PathBuf, String> {
    let base = app_data_dir(app)?;
    Ok(base
        .join("workspace_assets")
        .join(workspace_id)
        .join("fonts"))
}

/// Supprime les répertoires vides du parent du fichier jusqu’à `fonts/` (exclus).
fn remove_empty_font_parent_dirs(app: &tauri::AppHandle, workspace_id: &str, relative_path: &str) {
    let Ok(rel) = normalize_relative_asset_path(workspace_id, relative_path) else {
        return;
    };
    let Ok(base) = app_data_dir(app) else {
        return;
    };
    let Ok(fonts_root) = workspace_fonts_root(app, workspace_id) else {
        return;
    };
    let full = base.join(&rel);
    let Some(mut cur) = full.parent().map(|p| p.to_path_buf()) else {
        return;
    };
    loop {
        if cur == fonts_root {
            break;
        }
        if !cur.starts_with(&fonts_root) {
            break;
        }
        let is_empty = fs::read_dir(&cur)
            .map(|mut d| d.next().is_none())
            .unwrap_or(false);
        if !is_empty {
            break;
        }
        let parent = cur.parent().map(|p| p.to_path_buf());
        if fs::remove_dir(&cur).is_err() {
            break;
        }
        let Some(p) = parent else { break };
        cur = p;
    }
}

fn allowed_image_ext(path: &Path) -> Option<&'static str> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .and_then(|e| match e.as_str() {
            "png" => Some("png"),
            "jpg" | "jpeg" => Some("jpg"),
            "webp" => Some("webp"),
            "gif" => Some("gif"),
            _ => None,
        })
}

/// Copie un fichier image choisi par l'utilisateur vers le dossier données de l'app.
/// Retourne le chemin relatif (depuis app_local_data_dir) à stocker dans `profile_json.branding.logoRelativePath`.
#[tauri::command]
pub fn copy_workspace_logo_from_path(
    app: tauri::AppHandle,
    workspace_id: String,
    source_path: String,
) -> Result<String, String> {
    let src = PathBuf::from(&source_path);
    if !src.is_file() {
        return Err("Fichier source introuvable.".into());
    }
    let meta = fs::metadata(&src)
        .map_err(|e| io_message("Lecture des métadonnées du logo impossible", e))?;
    if meta.len() > MAX_LOGO_BYTES {
        return Err("Le logo dépasse la taille maximale (2 Mo).".into());
    }
    let ext = allowed_image_ext(&src).ok_or_else(|| {
        "Format non pris en charge (utilisez PNG, JPEG, WebP ou GIF).".to_string()
    })?;

    let base = app_data_dir(&app)?;
    let dest_dir = base.join("workspace_assets").join(&workspace_id);
    fs::create_dir_all(&dest_dir)
        .map_err(|e| io_message("Impossible de créer le dossier du logo", e))?;

    let dest_name = format!("logo.{}", ext);
    let dest = dest_dir.join(&dest_name);
    fs::copy(&src, &dest).map_err(|e| io_message("Copie du logo impossible", e))?;

    let relative = format!("workspace_assets/{}/{}", workspace_id, dest_name);
    Ok(relative)
}

fn write_workspace_pdf_font_bytes_in_subdirs(
    app: &tauri::AppHandle,
    workspace_id: &str,
    bytes: &[u8],
    out_ext: &str,
    subdirs: &[String],
) -> Result<String, String> {
    if bytes.len() as u64 > MAX_PDF_FONT_BYTES {
        return Err("La police dépasse la taille maximale (12 Mo).".into());
    }
    let base = app_data_dir(app)?;
    let mut dest_dir = base
        .join("workspace_assets")
        .join(workspace_id)
        .join("fonts");
    for s in subdirs {
        dest_dir = dest_dir.join(s);
    }
    fs::create_dir_all(&dest_dir)
        .map_err(|e| io_message("Impossible de créer le dossier des polices", e))?;
    let dest_name = format!("{}.{}", Uuid::new_v4(), out_ext);
    let dest = dest_dir.join(&dest_name);
    fs::write(&dest, bytes).map_err(|e| io_message("Enregistrement de la police impossible", e))?;
    let tail = subdirs
        .iter()
        .map(String::as_str)
        .chain(std::iter::once(dest_name.as_str()))
        .collect::<Vec<_>>()
        .join("/");
    Ok(format!("workspace_assets/{}/fonts/{}", workspace_id, tail))
}

fn write_workspace_pdf_font_bytes(
    app: &tauri::AppHandle,
    workspace_id: &str,
    bytes: &[u8],
    out_ext: &str,
) -> Result<String, String> {
    write_workspace_pdf_font_bytes_in_subdirs(app, workspace_id, bytes, out_ext, &[])
}

fn collect_font_files_recursive(
    dir: &Path,
    out: &mut Vec<PathBuf>,
    dir_depth: usize,
) -> Result<(), String> {
    let read = fs::read_dir(dir).map_err(|e| io_message("Lecture du dossier impossible", e))?;
    for entry in read.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if fonts::font_file_extension(&path).is_some() {
                out.push(path);
            }
        } else if path.is_dir() && dir_depth < MAX_FONT_IMPORT_DEPTH {
            collect_font_files_recursive(&path, out, dir_depth + 1)?;
        }
    }
    Ok(())
}

/// Dialogue pour choisir un fichier .ttf / .otf / .ttc (import police PDF).
#[tauri::command]
pub async fn pick_pdf_font_file_path() -> Result<Option<String>, String> {
    let path = rfd::AsyncFileDialog::new()
        .set_title("Choisir une police")
        .add_filter("Polices", &["ttf", "otf", "ttc"])
        .pick_file()
        .await
        .map(|f| f.path().to_string_lossy().to_string());
    Ok(path)
}

/// Importe une police depuis un chemin absolu (sélecteur utilisateur) vers `workspace_assets/.../fonts/`.
#[tauri::command]
pub fn import_workspace_pdf_font_from_path(
    app: tauri::AppHandle,
    workspace_id: String,
    source_path: String,
    face_index: u32,
) -> Result<String, String> {
    let src = PathBuf::from(&source_path);
    if !src.is_file() {
        return Err("Fichier source introuvable.".into());
    }
    let meta = fs::metadata(&src)
        .map_err(|e| io_message("Lecture des métadonnées du fichier de police impossible", e))?;
    if meta.len() > MAX_PDF_FONT_BYTES {
        return Err("La police dépasse la taille maximale (12 Mo).".into());
    }
    let (sfnt, out_ext) = fonts::read_font_sfnt_bytes(&src, face_index)?;
    write_workspace_pdf_font_bytes(&app, &workspace_id, &sfnt, out_ext)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceFontFolderRow {
    pub relative_path: String,
    pub label: String,
}

/// Dialogue pour choisir un dossier dont les polices seront importées (récursif, structure conservée).
#[tauri::command]
pub async fn pick_pdf_font_folder_path() -> Result<Option<String>, String> {
    let path = rfd::AsyncFileDialog::new()
        .set_title("Choisir un dossier de polices")
        .pick_folder()
        .await
        .map(|f| f.path().to_string_lossy().to_string());
    Ok(path)
}

/// Copie chaque police sous le dossier choisi (récursif) vers `workspace_assets/.../fonts/<sous-dossiers>/`
/// en conservant la structure relative ; noms de dossiers sanitisés ; face 0 pour les `.ttc`.
#[tauri::command]
pub fn import_workspace_pdf_fonts_from_folder(
    app: tauri::AppHandle,
    workspace_id: String,
    folder_path: String,
) -> Result<Vec<WorkspaceFontFolderRow>, String> {
    let dir = PathBuf::from(&folder_path);
    if !dir.is_dir() {
        return Err("Le chemin indiqué n’est pas un dossier.".into());
    }
    let import_root =
        fs::canonicalize(&dir).map_err(|e| io_message("Dossier source inaccessible", e))?;
    let mut paths: Vec<PathBuf> = Vec::new();
    collect_font_files_recursive(&import_root, &mut paths, 0)?;
    paths.sort();
    let mut out: Vec<WorkspaceFontFolderRow> = Vec::new();
    for path in paths {
        if out.len() >= MAX_FOLDER_FONT_IMPORTS {
            break;
        }
        let Some(segments) = sanitized_parent_segments(&import_root, &path) else {
            continue;
        };
        let meta = match fs::metadata(&path) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if meta.len() > MAX_PDF_FONT_BYTES {
            continue;
        }
        let (sfnt, out_ext) = match fonts::read_font_sfnt_bytes(&path, 0) {
            Ok(x) => x,
            Err(_) => continue,
        };
        let relative_path = match write_workspace_pdf_font_bytes_in_subdirs(
            &app,
            &workspace_id,
            &sfnt,
            out_ext,
            &segments,
        ) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let label = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Police")
            .to_string();
        out.push(WorkspaceFontFolderRow {
            relative_path,
            label,
        });
    }
    Ok(out)
}

fn parse_move_target_folder_key(key: &str) -> Result<Vec<String>, String> {
    let t = key.trim();
    if t.is_empty() {
        return Ok(vec![]);
    }
    font_folder_key_to_segments(t)
}

fn font_file_parent_segments_and_name(
    workspace_id: &str,
    relative: &str,
) -> Result<(Vec<String>, String), String> {
    let _ = normalize_relative_asset_path(workspace_id, relative)?;
    let prefix = format!("workspace_assets/{}/fonts/", workspace_id);
    let s = relative
        .strip_prefix(&prefix)
        .ok_or_else(|| "Chemin de police invalide.".to_string())?;
    let parts: Vec<&str> = s.split('/').filter(|p| !p.is_empty()).collect();
    if parts.is_empty() {
        return Err("Chemin de police invalide.".into());
    }
    let file_name = (*parts.last().unwrap()).to_string();
    let parent: Vec<String> = parts[..parts.len() - 1]
        .iter()
        .map(|s| (*s).to_string())
        .collect();
    Ok((parent, file_name))
}

fn font_folder_key_to_segments(key: &str) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    for part in key.split('/').map(str::trim).filter(|s| !s.is_empty()) {
        let s = sanitize_font_dir_component(part).ok_or_else(|| {
            "Nom de dossier invalide (caractères interdits ou segment vide).".to_string()
        })?;
        out.push(s);
    }
    if out.is_empty() {
        return Err("Chemin de dossier vide.".into());
    }
    if out.len() > MAX_FONT_IMPORT_DEPTH {
        return Err(format!(
            "Le chemin ne peut pas dépasser {MAX_FONT_IMPORT_DEPTH} niveaux."
        ));
    }
    Ok(out)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameWorkspacePdfFontFolderResult {
    pub from_key: String,
    pub to_key: String,
}

/// Renomme un dossier sous `workspace_assets/{id}/fonts/<clé>/` (déplacement sur disque).
#[tauri::command]
pub fn rename_workspace_pdf_font_folder(
    app: tauri::AppHandle,
    workspace_id: String,
    from_key: String,
    to_key: String,
) -> Result<RenameWorkspacePdfFontFolderResult, String> {
    let from_segments = font_folder_key_to_segments(from_key.trim())?;
    let to_segments = font_folder_key_to_segments(to_key.trim())?;
    if from_segments == to_segments {
        return Err("Le nom est identique.".into());
    }
    let fonts_root = workspace_fonts_root(&app, &workspace_id)?;
    let mut src = fonts_root.clone();
    for s in &from_segments {
        src = src.join(s);
    }
    if !src.is_dir() {
        return Err("Dossier source introuvable.".into());
    }
    let mut dst = fonts_root.clone();
    for s in &to_segments {
        dst = dst.join(s);
    }
    if dst.exists() {
        return Err("Un emplacement porte déjà ce nom.".into());
    }
    if let Ok(rest) = dst.strip_prefix(&src) {
        if !rest.as_os_str().is_empty() {
            return Err("La cible ne peut pas être à l’intérieur du dossier source.".into());
        }
    }
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| io_message("Création des dossiers parents impossible", e))?;
    }
    fs::rename(&src, &dst).map_err(|e| io_message("Renommage du dossier impossible", e))?;
    Ok(RenameWorkspacePdfFontFolderResult {
        from_key: from_segments.join("/"),
        to_key: to_segments.join("/"),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveWorkspacePdfFontRow {
    pub old_relative_path: String,
    pub new_relative_path: String,
}

/// Déplace des fichiers de police vers un dossier sous `fonts/` (racine si `target_folder_key` vide).
#[tauri::command]
pub fn move_workspace_pdf_fonts_to_folder(
    app: tauri::AppHandle,
    workspace_id: String,
    relative_paths: Vec<String>,
    target_folder_key: String,
) -> Result<Vec<MoveWorkspacePdfFontRow>, String> {
    let target_segments = parse_move_target_folder_key(&target_folder_key)?;
    let fonts_root = workspace_fonts_root(&app, &workspace_id)?;
    let base = app_data_dir(&app)?;

    let mut unique: Vec<String> = Vec::new();
    for p in relative_paths {
        let t = p.trim().to_string();
        if t.is_empty() || unique.contains(&t) {
            continue;
        }
        unique.push(t);
    }
    if unique.is_empty() {
        return Err("Aucun fichier à déplacer.".into());
    }

    let mut plan: Vec<(String, PathBuf, PathBuf, String)> = Vec::new();
    for old_rel in &unique {
        let (parent_segs, file_name) = font_file_parent_segments_and_name(&workspace_id, old_rel)?;
        if parent_segs == target_segments {
            continue;
        }
        let rel_norm = normalize_relative_asset_path(&workspace_id, old_rel)?;
        let src_full = base.join(&rel_norm);
        if !src_full.is_file() {
            return Err(format!("Fichier introuvable : {old_rel}"));
        }

        let mut dst_dir = fonts_root.clone();
        for s in &target_segments {
            dst_dir = dst_dir.join(s);
        }
        let dst_full = dst_dir.join(&file_name);
        if dst_full.exists() {
            return Err("Un fichier existe déjà à l’emplacement cible (conflit de nom).".into());
        }

        let new_rel = if target_segments.is_empty() {
            format!("workspace_assets/{}/fonts/{}", workspace_id, file_name)
        } else {
            format!(
                "workspace_assets/{}/fonts/{}/{}",
                workspace_id,
                target_segments.join("/"),
                file_name
            )
        };
        plan.push((old_rel.clone(), src_full, dst_full, new_rel));
    }

    if plan.is_empty() {
        return Err("Les polices sélectionnées sont déjà dans ce dossier.".into());
    }

    let mut out: Vec<MoveWorkspacePdfFontRow> = Vec::new();
    for (old_rel, src_full, dst_full, new_rel) in plan {
        if let Some(parent) = dst_full.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| io_message("Création du dossier cible impossible", e))?;
        }
        fs::rename(&src_full, &dst_full)
            .map_err(|e| io_message("Déplacement de la police impossible", e))?;
        remove_empty_font_parent_dirs(&app, &workspace_id, &old_rel);
        out.push(MoveWorkspacePdfFontRow {
            old_relative_path: old_rel,
            new_relative_path: new_rel,
        });
    }

    Ok(out)
}

/// Supprime des fichiers de police sous `workspace_assets/{id}/fonts/` (chemins relatifs validés).
#[tauri::command]
pub fn delete_workspace_pdf_fonts(
    app: tauri::AppHandle,
    workspace_id: String,
    relative_paths: Vec<String>,
) -> Result<(), String> {
    let base = app_data_dir(&app)?;
    for relative_path in relative_paths {
        let trimmed = relative_path.trim();
        if trimmed.is_empty() {
            continue;
        }
        let rel = normalize_relative_asset_path(&workspace_id, trimmed)?;
        let full = base.join(&rel);
        if full.is_file() {
            fs::remove_file(&full)
                .map_err(|e| io_message("Suppression du fichier de police impossible", e))?;
            remove_empty_font_parent_dirs(&app, &workspace_id, trimmed);
        }
    }
    Ok(())
}

/// Lit un fichier sous app_local_data_dir (chemin relatif validé) et renvoie du base64 data-URL ou None si absent.
#[tauri::command]
pub fn read_workspace_asset_base64(
    app: tauri::AppHandle,
    workspace_id: String,
    relative_path: String,
) -> Result<Option<String>, String> {
    if relative_path.is_empty() {
        return Ok(None);
    }
    let rel = normalize_relative_asset_path(&workspace_id, &relative_path)?;
    let full = app_data_dir(&app)?.join(&rel);
    if !full.is_file() {
        return Ok(None);
    }
    let mut f = fs::File::open(&full)
        .map_err(|e| io_message("Ouverture de la ressource workspace impossible", e))?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf)
        .map_err(|e| io_message("Lecture de la ressource workspace impossible", e))?;
    let mime = full
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .map(|e| match e.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "webp" => "image/webp",
            "gif" => "image/gif",
            "ttf" => "font/ttf",
            "otf" => "font/otf",
            _ => "application/octet-stream",
        })
        .unwrap_or("application/octet-stream");
    let b64 = B64.encode(&buf);
    Ok(Some(format!("data:{};base64,{}", mime, b64)))
}

/// Écrit un PDF (octets) dans le chemin absolu indiqué (crée les dossiers parents).
#[tauri::command]
pub fn write_pdf_file(path: String, data: Vec<u8>) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&p, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Écrit un PDF d’aperçu dans le cache applicatif et renvoie le chemin absolu pour l’ouvrir avec l’app par défaut (Preview, Acrobat, etc.).
#[tauri::command]
pub fn write_pdf_preview_temp(app: tauri::AppHandle, data: Vec<u8>) -> Result<String, String> {
    let base = app_data_dir(&app)?;
    let dir = base.join("pdf_preview_cache");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let name = format!("preview-{}.pdf", Uuid::new_v4());
    let path = dir.join(name);
    fs::write(&path, &data).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}
