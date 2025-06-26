import requests
import re

def extract_video_id(url):
    match = re.search(r'(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})', url)
    return match.group(1) if match else None

def check_embed_allowed(video_id):
    embed_url = f"https://www.youtube.com/embed/{video_id}"
    response = requests.get(embed_url)
    return "unavailable" not in response.text.lower()

def main():
    with open("urls.txt", "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip()]

    for url in urls:
        vid = extract_video_id(url)
        if not vid:
            print(f"[!] 잘못된 URL 형식: {url}")
            continue

        ok = check_embed_allowed(vid)
        status = "✅ 가능" if ok else "❌ 불가"
        print(f"{status} | {vid} | https://youtu.be/{vid}")

if __name__ == "__main__":
    main()
