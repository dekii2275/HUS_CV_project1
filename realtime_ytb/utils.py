import yt_dlp

def get_stream_url(youtube_url: str, resolution: int = 720) -> str:
    """
    Trích xuất direct stream URL từ YouTube.
    """
    ydl_opts = {
        "format": f"bestvideo[height<={resolution}][ext=mp4]/best[height<={resolution}]/best",
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            return info["url"]
    except Exception as e:
        print(f"Lỗi khi trích xuất URL: {e}")
        return None
