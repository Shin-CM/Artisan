use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use std::io::{Read, Write};

const PREFIX: &str = "v1:";

pub fn encode_payload_json(json: &str) -> Result<String, String> {
    let mut enc = GzEncoder::new(Vec::new(), Compression::default());
    enc.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    let compressed = enc.finish().map_err(|e| e.to_string())?;
    let b64 = URL_SAFE_NO_PAD.encode(compressed);
    Ok(format!("{}{}", PREFIX, b64))
}

pub fn decode_payload_json(s: &str) -> Result<String, String> {
    let trimmed = s.trim();
    if !trimmed.starts_with(PREFIX) {
        return Err("Format de chaîne invalide : préfixe de version attendu (v1:)".into());
    }
    let b64 = trimmed.trim_start_matches(PREFIX);
    let bytes = URL_SAFE_NO_PAD
        .decode(b64)
        .map_err(|_| "Décodage Base64 impossible".to_string())?;
    let mut decoder = GzDecoder::new(&bytes[..]);
    let mut out = String::new();
    decoder
        .read_to_string(&mut out)
        .map_err(|_| "Décompression ou JSON corrompu".to_string())?;
    Ok(out)
}

#[tauri::command]
pub fn data_export_string(json: String) -> Result<String, String> {
    encode_payload_json(&json)
}

#[tauri::command]
pub fn data_import_string(encoded: String) -> Result<String, String> {
    decode_payload_json(&encoded)
}
