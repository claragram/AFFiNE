#!/usr/bin/env python3
import os
import sys
import re
import ssl
import urllib.request
import urllib.parse

ssl_context = ssl._create_unverified_context()

BASE_URL = "https://affine.pro"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "deploy", "website"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

downloaded_urls = set()

def fetch(url, binary=False):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=20) as resp:
            content = resp.read()
            if binary:
                return content
            return content.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None

def download_asset(rel_path):
    if not rel_path or rel_path.startswith("data:") or rel_path.startswith("javascript:"):
        return rel_path
    
    clean_path = rel_path.split("?")[0].split("#")[0]
    if clean_path.startswith("http://") or clean_path.startswith("https://"):
        if not clean_path.startswith(BASE_URL):
            return rel_path
        clean_path = clean_path[len(BASE_URL):]

    if not clean_path.startswith("/"):
        clean_path = "/" + clean_path

    if clean_path in downloaded_urls:
        return "." + clean_path

    local_path = os.path.join(OUTPUT_DIR, clean_path.lstrip("/"))
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    url = BASE_URL + clean_path
    data = fetch(url, binary=True)
    if data:
        with open(local_path, "wb") as f:
            f.write(data)
        downloaded_urls.add(clean_path)
        
        # If CSS, parse sub-assets (fonts, images)
        if clean_path.endswith(".css"):
            try:
                css_text = data.decode("utf-8", errors="ignore")
                for match in re.findall(r'url\s*\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)', css_text):
                    if not match.startswith("data:"):
                        sub_path = urllib.parse.urljoin(clean_path, match)
                        download_asset(sub_path)
            except Exception:
                pass

    return "." + clean_path

def rebrand_html(html, current_path=""):
    clara = html
    clara = re.sub(r'AFFiNE\s*—\s*Base de connaissances open source', 'Claranote — Base de connaissances open source & Espace de travail autonome', clara)
    clara = re.sub(r'AFFiNE\s*is', 'Claranote is', clara)
    clara = re.sub(r'Welcome to AFFiNE', 'Welcome to Claranote', clara)
    clara = re.sub(r'AFFiNE Cloud', 'Claranote Cloud', clara)
    clara = re.sub(r'AFFiNE AI', 'Claranote AI', clara)
    clara = re.sub(r'AFFiNE', 'Claranote', clara)
    clara = re.sub(r'affine\.pro', 'claranote.com', clara)
    clara = re.sub(r'href=["\']https://app\.affine\.pro[^"\']*["\']', 'href="/"', clara)
    clara = re.sub(r'href=["\']https://affine\.pro/pricing[^"\']*["\']', 'href="/pricing/"', clara)
    clara = re.sub(r'href=["\']https://affine\.pro/download[^"\']*["\']', 'href="/download/"', clara)
    clara = re.sub(r'href=["\']/pricing["\']', 'href="/pricing/"', clara)
    clara = re.sub(r'href=["\']/download["\']', 'href="/download/"', clara)
    return clara

def process_page(route, output_subpath):
    print(f"\n=== Scraping {BASE_URL}{route} ===")
    html = fetch(BASE_URL + route)
    if not html:
        print(f"Failed to fetch {route}", file=sys.stderr)
        return

    asset_patterns = [
        r'(?:src|href)=["\'](/[^"\']+\.(?:css|js|woff2|woff|ttf|png|jpg|jpeg|svg|webp|avif|ico|json))["\']',
        r'(?:src|href)=["\'](https://affine\.pro/[^"\']+\.(?:css|js|woff2|woff|ttf|png|jpg|jpeg|svg|webp|avif|ico|json))["\']'
    ]

    found_assets = set()
    for pat in asset_patterns:
        for m in re.findall(pat, html):
            found_assets.add(m)

    print(f"Found {len(found_assets)} assets on {route}...")
    for asset in sorted(found_assets):
        download_asset(asset)

    clara_html = rebrand_html(html, route)
    out_file = os.path.join(OUTPUT_DIR, output_subpath)
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(clara_html)
    print(f"Saved: {out_file}")

def main():
    pages = [
        ("/fr", "index.html"),
        ("/download", "download/index.html"),
        ("/pricing", "pricing/index.html")
    ]
    for route, subpath in pages:
        process_page(route, subpath)

    print(f"\nAll pages extracted & rebranded into: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
