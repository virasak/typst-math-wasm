use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    println!("cargo:rerun-if-changed=src/fonts");
    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR not set"));

    let fonts = [
        "NewCMMath-Regular.otf",
        "NewCM10-Regular.otf",
        "NewCM10-Bold.otf",
        "NewCM10-Italic.otf",
    ];

    for font in fonts {
        let src = Path::new("src/fonts").join(font);
        let dst = out_dir.join(format!("{}.zlib", font));
        let data = fs::read(&src).unwrap_or_else(|e| panic!("failed to read {}: {}", src.display(), e));
        let compressed = miniz_oxide::deflate::compress_to_vec_zlib(&data, 10);
        fs::write(&dst, compressed).unwrap_or_else(|e| panic!("failed to write {}: {}", dst.display(), e));
    }
}
