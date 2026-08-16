//! Liste des applications susceptibles d’ouvrir `mailto:` / `tel:` (handlers
//! enregistrés auprès du bureau), pour proposer des choix fiables dans les
//! paramètres Suivi clients.

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrlHandlerApp {
    pub label: String,
    /// Valeur passée à `openUrl` / `open -a` : chemin complet `.app` (macOS)
    /// ou binaire (Linux).
    pub open_with: String,
}

#[tauri::command]
pub fn list_url_handler_apps(scheme: String) -> Result<Vec<UrlHandlerApp>, String> {
    let scheme = scheme.to_lowercase();
    match scheme.as_str() {
        "mailto" => list_mailto_apps(),
        "tel" => list_tel_apps(),
        _ => Err("Schéma inconnu : utilisez « mailto » ou « tel ».".into()),
    }
}

fn list_mailto_apps() -> Result<Vec<UrlHandlerApp>, String> {
    #[cfg(target_os = "macos")]
    {
        return macos_apps_for_url_sample("mailto:invoicies-detector@local.invalid");
    }
    #[cfg(target_os = "linux")]
    {
        return linux_desktop_apps("mailto");
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        Ok(vec![])
    }
}

fn list_tel_apps() -> Result<Vec<UrlHandlerApp>, String> {
    #[cfg(target_os = "macos")]
    {
        return macos_apps_for_url_sample("tel:+15555550123");
    }
    #[cfg(target_os = "linux")]
    {
        return linux_desktop_apps("tel");
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        Ok(vec![])
    }
}

#[cfg(target_os = "macos")]
fn macos_apps_for_url_sample(url: &'static str) -> Result<Vec<UrlHandlerApp>, String> {
    let js = format!(
        r#"(function(){{
ObjC.import("AppKit");
ObjC.import("Foundation");
var u=$.NSURL.URLWithString("{url}");
if(!u) return "[]";
var ws=$.NSWorkspace.sharedWorkspace;
var urls=ws.URLsForApplicationsToOpenURL(u);
if(!urls) return "[]";
var out=[];
var n=urls.count;
for(var i=0;i<n;i++){{
  var fu=urls.objectAtIndex(i);
  var path=ObjC.unwrap(fu.path);
  var bn=path.replace(/^.*\//,"").replace(/\.app$/,"");
  var bundle=$.NSBundle.bundleWithPath(path);
  if(bundle){{
    var d=bundle.infoDictionary;
    if(d){{
      var disp=d.objectForKey("CFBundleDisplayName");
      var bnm=d.objectForKey("CFBundleName");
      if(disp) bn=ObjC.unwrap(disp);
      else if(bnm) bn=ObjC.unwrap(bnm);
    }}
  }}
  out.push({{label:String(bn),open_with:String(path)}});
}}
return JSON.stringify(out);
}})();"#,
        url = url
    );
    let out = Command::new("/usr/bin/osascript")
        .args(["-l", "JavaScript", "-e", &js])
        .output()
        .map_err(|e| format!("osascript : {e}"))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let mut apps: Vec<UrlHandlerApp> =
        serde_json::from_str(&stdout).map_err(|e| format!("JSON osascript : {e}"))?;
    dedupe_sort(&mut apps);
    Ok(apps)
}

#[cfg(target_os = "linux")]
fn linux_desktop_apps(kind: &str) -> Result<Vec<UrlHandlerApp>, String> {
    let needle = match kind {
        "mailto" => "x-scheme-handler/mailto",
        "tel" => "x-scheme-handler/tel",
        _ => return Ok(vec![]),
    };
    let mut dirs = vec![
        "/usr/share/applications".to_string(),
        "/usr/local/share/applications".to_string(),
    ];
    if let Ok(home) = std::env::var("HOME") {
        dirs.push(format!("{home}/.local/share/applications"));
    }
    let mut out: Vec<UrlHandlerApp> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    for dir in dirs {
        let Ok(rd) = std::fs::read_dir(&dir) else {
            continue;
        };
        for ent in rd.flatten() {
            let p = ent.path();
            if !p.to_string_lossy().ends_with(".desktop") {
                continue;
            }
            let Ok(txt) = std::fs::read_to_string(&p) else {
                continue;
            };
            if !desktop_mime_contains(&txt, needle) {
                continue;
            }
            if txt.lines().any(|l| l.trim() == "NoDisplay=true") {
                continue;
            }
            let Some(name) = parse_desktop_field(&txt, "Name") else {
                continue;
            };
            let Some(exe) = parse_desktop_exec_binary(&txt) else {
                continue;
            };
            if !std::path::Path::new(&exe).exists() {
                continue;
            }
            if seen.insert(exe.clone()) {
                out.push(UrlHandlerApp {
                    label: name,
                    open_with: exe,
                });
            }
        }
    }
    dedupe_sort(&mut out);
    Ok(out)
}

#[cfg(target_os = "linux")]
fn desktop_mime_contains(txt: &str, needle: &str) -> bool {
    for line in txt.lines() {
        let t = line.trim();
        if let Some(rest) = t.strip_prefix("MimeType=") {
            if rest.contains(needle) {
                return true;
            }
        }
    }
    false
}

#[cfg(target_os = "linux")]
fn parse_desktop_field(txt: &str, key: &str) -> Option<String> {
    let prefix = format!("{key}=");
    for line in txt.lines() {
        let t = line.trim();
        if key == "Name" && t.starts_with("Name[") {
            continue;
        }
        if let Some(v) = t.strip_prefix(&prefix) {
            return Some(v.to_string());
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn parse_desktop_exec_binary(txt: &str) -> Option<String> {
    let exec = parse_desktop_field(txt, "Exec")?;
    let mut s = exec;
    for suf in [" %u", " %U", " %f", " %F", " %i", " %c", " %k", " %s"] {
        if let Some(pos) = s.find(suf) {
            s = s[..pos].to_string();
        }
    }
    let s = s.trim();
    for w in s.split_whitespace() {
        if w.contains('=') {
            continue;
        }
        if std::path::Path::new(w).exists() {
            return Some(w.to_string());
        }
    }
    s.split_whitespace().next().map(std::string::ToString::to_string)
}

fn dedupe_sort(apps: &mut Vec<UrlHandlerApp>) {
    let mut seen = HashSet::new();
    apps.retain(|a| seen.insert(a.open_with.clone()));
    apps.sort_by(|a, b| {
        a.label
            .to_lowercase()
            .cmp(&b.label.to_lowercase())
            .then_with(|| a.open_with.cmp(&b.open_with))
    });
}
