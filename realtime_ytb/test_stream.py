import cv2
from utils import get_stream_url
from stream_reader import StreamReader

def test_only_video(url):
    print("--- Đang kiểm tra luồng video (không AI) ---")
    stream_url = get_stream_url(url)
    if not stream_url:
        return

    reader = StreamReader(stream_url)
    reader.start()

    while True:
        frame = reader.get_frame()
        if frame is None:
            continue

        cv2.imshow("Test YouTube Stream", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    reader.stop()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    YOUTUBE_URL = "https://www.youtube.com/watch?v=B0YjuKbV3Ec" # Bạn có thể đổi link
    test_only_video(YOUTUBE_URL)
