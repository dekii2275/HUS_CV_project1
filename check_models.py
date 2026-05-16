from ultralytics import YOLO

def check_model(path):
    print(f"Checking {path}...")
    try:
        model = YOLO(path)
        print(f"Classes: {model.names}")
    except Exception as e:
        print(f"Error: {e}")

check_model("models/yolo11n.pt")
check_model("models/best.pt")
