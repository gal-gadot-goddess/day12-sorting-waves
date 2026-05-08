import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to sys.path
current_dir = Path(__file__).parent.absolute()
sys.path.append(str(current_dir))

# Import upload functions
try:
    from upload.upload_instagram import upload_to_instagram
    from upload.upload_facebook import upload_to_facebook
    from upload.upload_threads import upload_to_threads
    from upload.upload_to_youtube import upload_to_youtube
    from upload.upload_twitter import upload_to_twitter
    print("✅ Successfully imported upload modules.")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def main():
    # Load .env from current dir
    load_dotenv(dotenv_path=current_dir / '.env')
    
    data_file = current_dir / "current_topic.json"
    video_path = current_dir / "day12_ml_race.mp4"
    thumbnail_path = current_dir / "thumbnail.jpg"
    
    if not data_file.exists():
        print(f"❌ current_topic.json not found.")
        sys.exit(1)
        
    with open(data_file, 'r', encoding='utf-8') as f:
        topic_data = json.load(f)
        
    title = topic_data.get("topic", "AI Consciousness Singularity Sprint")
    ig_caption = topic_data.get("instagram_caption", "")
    fb_caption = topic_data.get("facebook_caption", ig_caption)
    th_caption = topic_data.get("threads_caption", ig_caption)
    tw_caption = topic_data.get("twitter_caption", "")
    yt_title = topic_data.get("youtube_title", title)
    yt_description = topic_data.get("youtube_description", "")
    hashtags = topic_data.get("hashtags", "#ai")

    if not video_path.exists():
        print(f"❌ day12_ml_race.mp4 not found.")
        sys.exit(1)
        
    print(f"🚀 Starting uploads for: {title}")

    # --- YouTube ---
    print("\n🎬 UPLOADING TO YOUTUBE...")
    try:
        tags_list = [t.strip("#") for t in hashtags.split() if t.strip().startswith("#")]
        upload_to_youtube(
            video_path=video_path,
            title=yt_title,
            description=yt_description,
            tags=tags_list,
            category_id='28',
            thumbnail_path=str(thumbnail_path)
        )
        print("✅ YouTube Upload Complete!")
    except Exception as e:
        print(f"❌ YouTube upload failed: {e}")

    # --- Instagram Reel ---
    print("\n📸 UPLOADING TO INSTAGRAM REEL...")
    try:
        upload_to_instagram(str(video_path), ig_caption, is_story=False, cover_path=str(thumbnail_path))
        print("✅ Instagram Reel Upload Complete!")
    except Exception as e:
        print(f"❌ Instagram Reel upload failed: {e}")

    # --- Instagram Story ---
    print("\n📸 UPLOADING TO INSTAGRAM STORY...")
    try:
        upload_to_instagram(str(video_path), "", is_story=True)
        print("✅ Instagram Story Upload Complete!")
    except Exception as e:
        print(f"❌ Instagram Story upload failed: {e}")

    # --- Facebook ---
    print("\n📘 UPLOADING TO FACEBOOK...")
    try:
        upload_to_facebook(str(video_path), fb_caption, title=title, thumbnail_path=str(thumbnail_path))
        print("✅ Facebook Reel Upload Complete!")
    except Exception as e:
        print(f"❌ Facebook upload failed: {e}")

    # --- Threads ---
    print("\n🧵 UPLOADING TO THREADS...")
    try:
        upload_to_threads(str(video_path), th_caption)
        print("✅ Threads Upload Complete!")
    except Exception as e:
        print(f"❌ Threads upload failed: {e}")

    # --- Twitter ---
    print("\n🐦 UPLOADING TO TWITTER...")
    try:
        final_tw_caption = tw_caption if tw_caption else f"{title}\n\n{hashtags}"
        if len(final_tw_caption) > 280:
             final_tw_caption = f"{title}\n\n" + " ".join(hashtags.split()[:5])
        upload_to_twitter(str(video_path), final_tw_caption)
        print("✅ Twitter Upload Complete!")
    except Exception as e:
        print(f"❌ Twitter upload failed: {e}")

if __name__ == "__main__":
    main()
