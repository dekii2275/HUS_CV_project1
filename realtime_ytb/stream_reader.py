import cv2
import threading
import queue
import time


class StreamReader(threading.Thread):
    def __init__(self, stream_url: str, max_queue_size: int = 1):
        super().__init__(daemon=True)
        self.stream_url = stream_url
        self.frame_queue = queue.Queue(maxsize=max_queue_size)
        self.cap = None
        self._stop_event = threading.Event()   # Dùng Event thay vì biến bool

    def connect(self):
        if self.cap:
            self.cap.release()
        self.cap = cv2.VideoCapture(self.stream_url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def run(self):
        self.connect()
        while not self._stop_event.is_set():
            if not self.cap or not self.cap.isOpened():
                print("[Reader] Đang kết nối lại...")
                time.sleep(2)
                self.connect()
                continue

            ret, frame = self.cap.read()
            if not ret:
                print("[Reader] Không đọc được frame, đang thử lại...")
                time.sleep(1)
                self.connect()
                continue

            # Drop frame cũ, giữ frame mới nhất
            if self.frame_queue.full():
                try:
                    self.frame_queue.get_nowait()
                except queue.Empty:
                    pass
            try:
                self.frame_queue.put_nowait(frame)
            except queue.Full:
                pass

        # Thread đã thoát vòng lặp → giờ mới release cap (không còn race condition)
        if self.cap:
            self.cap.release()
            self.cap = None

    def get_frame(self, timeout=5.0):
        try:
            return self.frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def stop(self):
        self._stop_event.set()   # Báo thread dừng lại
        self.join(timeout=5.0)   # Chờ thread tự thoát trước khi tiếp tục
