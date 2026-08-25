import base64
import os
import re

base_dir = r"C:\Users\ahmet\.gemini\antigravity\scratch\vetassist_web"
assets_dir = os.path.join(base_dir, "assets")

def get_base64_image(filename):
    filepath = os.path.join(assets_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return ""
    ext = filename.split(".")[-1].lower()
    mime = "image/png" if ext == "png" else "image/jpeg"
    with open(filepath, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"

# Read index.html, styles.css, app.js
with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
    index_html = f.read()

with open(os.path.join(base_dir, "styles.css"), "r", encoding="utf-8") as f:
    styles_css = f.read()

with open(os.path.join(base_dir, "app.js"), "r", encoding="utf-8") as f:
    app_js = f.read()

# Replace images with base64 data URIs
images_to_replace = [
    "assets/favicon.png",
    "assets/icon-192.png",
    "assets/icon-512.png",
    "assets/Feature_Graphic_Clinic_1024x500.png",
    "assets/screenshot_receipt_modal.png",
    "assets/screenshot_main_mobile.png"
]

for img_rel in images_to_replace:
    fname = os.path.basename(img_rel)
    b64_uri = get_base64_image(fname)
    if b64_uri:
        index_html = index_html.replace(img_rel, b64_uri)
        styles_css = styles_css.replace(img_rel, b64_uri)

# Combine CSS and JS inline into a single self-contained HTML for Google Sites
# Replace <link rel="stylesheet" href="styles.css"> with <style>...</style>
index_html = re.sub(
    r'<link\s+rel="stylesheet"\s+href="styles.css">',
    f'<style>\n{styles_css}\n</style>',
    index_html
)

# Replace <script src="app.js"></script> with <script>...</script>
index_html = re.sub(
    r'<script\s+src="app.js"></script>',
    f'<script>\n{app_js}\n</script>',
    index_html
)

# Save the self-contained bundle
bundle_path = os.path.join(base_dir, "google_sites_embed.html")
with open(bundle_path, "w", encoding="utf-8") as f:
    f.write(index_html)

print(f"Created self-contained bundle at: {bundle_path} ({os.path.getsize(bundle_path)} bytes)")

# Also create self-contained privacy page
with open(os.path.join(base_dir, "privacy.html"), "r", encoding="utf-8") as f:
    privacy_html = f.read()

for img_rel in images_to_replace:
    fname = os.path.basename(img_rel)
    b64_uri = get_base64_image(fname)
    if b64_uri:
        privacy_html = privacy_html.replace(img_rel, b64_uri)

privacy_html = re.sub(
    r'<link\s+rel="stylesheet"\s+href="styles.css">',
    f'<style>\n{styles_css}\n</style>',
    privacy_html
)

privacy_bundle_path = os.path.join(base_dir, "google_sites_privacy_embed.html")
with open(privacy_bundle_path, "w", encoding="utf-8") as f:
    f.write(privacy_html)

print(f"Created self-contained privacy bundle at: {privacy_bundle_path} ({os.path.getsize(privacy_bundle_path)} bytes)")
