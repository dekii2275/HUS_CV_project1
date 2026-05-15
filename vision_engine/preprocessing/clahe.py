"""
preprocessing/clahe.py
Tăng cường chất lượng ảnh cho camera giao thông ngoài trời.
Xử lý: ban đêm, sương mù, mưa, nhiễu sensor.
"""

import cv2
import numpy as np


# ─────────────────────────────────────────────
# Diagnostics
# ─────────────────────────────────────────────

def is_dark_frame(frame: np.ndarray, threshold: float = 50.0) -> bool:
    """True nếu frame tối hơn ngưỡng (ban đêm / thiếu sáng). Downscale để tăng tốc."""
    small = cv2.resize(frame, (160, 90))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    return gray.mean() < threshold


def is_hazy_frame(frame: np.ndarray, threshold: float = 0.6) -> bool:
    """True nếu phát hiện sương mù. Downscale để tăng tốc."""
    small = cv2.resize(frame, (320, 180))
    dark = _dark_channel(small, patch_size=15)
    mean_dc = dark.mean()
    if mean_dc < 1e-6:
        return False
    return (dark.std() / mean_dc) < threshold and mean_dc > 50


def _dark_channel(img: np.ndarray, patch_size: int = 15) -> np.ndarray:
    min_channel = np.min(img, axis=2).astype(np.float32)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (patch_size, patch_size))
    return cv2.erode(min_channel, kernel)


# ─────────────────────────────────────────────
# Gamma Correction
# ─────────────────────────────────────────────

def apply_gamma_correction(frame: np.ndarray, gamma: float = 1.5) -> np.ndarray:
    """
    Điều chỉnh độ sáng tổng thể.
    gamma > 1 → sáng hơn | gamma < 1 → tối hơn | gamma = 1 → giữ nguyên
    """
    inv_gamma = 1.0 / max(gamma, 1e-6)
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)], dtype=np.uint8)
    return cv2.LUT(frame, table)


# ─────────────────────────────────────────────
# Dehazing (Dark Channel Prior)
# ─────────────────────────────────────────────

def apply_dehazing(frame: np.ndarray,
                   patch_size: int = 15,
                   omega: float = 0.95,
                   t_min: float = 0.1) -> np.ndarray:
    """Khử sương mù bằng Dark Channel Prior (He et al., 2009)."""
    img_f = frame.astype(np.float32) / 255.0
    h, w = frame.shape[:2]

    # Dark channel & atmospheric light
    dark = _dark_channel((img_f * 255).astype(np.uint8), patch_size) / 255.0
    num_brightest = max(int(dark.size * 0.001), 1)
    indices = np.argsort(dark.flatten())[-num_brightest:]
    atm_pixels = [img_f[idx // w, idx % w] for idx in indices]
    A = np.max(atm_pixels, axis=0)

    # Transmission map
    norm = img_f / (A + 1e-6)
    dark_norm = _dark_channel((norm * 255).astype(np.uint8), patch_size) / 255.0
    trans_8u = ((1.0 - omega * dark_norm) * 255).astype(np.uint8)
    trans_smooth = cv2.bilateralFilter(trans_8u, d=9, sigmaColor=75, sigmaSpace=75)
    t = np.clip(trans_smooth.astype(np.float32) / 255.0, t_min, 1.0)[:, :, np.newaxis]

    # Scene radiance
    J = np.clip((img_f - A) / t + A, 0.0, 1.0)
    return (J * 255).astype(np.uint8)


# ─────────────────────────────────────────────
# CLAHE
# ─────────────────────────────────────────────

def apply_clahe(frame: np.ndarray,
                clip_limit: float = 2.0,
                tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """Tăng tương phản cục bộ qua CLAHE trên kênh L (LAB color space)."""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)

    return cv2.cvtColor(cv2.merge([clahe.apply(l), a, b]), cv2.COLOR_LAB2BGR)


# ─────────────────────────────────────────────
# Bilateral Denoising
# ─────────────────────────────────────────────

def apply_denoising(frame: np.ndarray,
                    d: int = 9,
                    sigma_color: float = 75.0,
                    sigma_space: float = 75.0) -> np.ndarray:
    """Khử nhiễu sensor, giữ cạnh sắc nét bằng Bilateral Filter."""
    return cv2.bilateralFilter(frame, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)


# ─────────────────────────────────────────────
# Pipeline thủ công
# ─────────────────────────────────────────────

def enhance_frame(frame: np.ndarray,
                  gamma: float = 1.0,
                  use_dehazing: bool = False,
                  use_clahe: bool = True,
                  use_denoising: bool = True,
                  clahe_clip: float = 2.0,
                  denoise_d: int = 9) -> np.ndarray:
    """
    Pipeline tăng cường ảnh tùy chỉnh.
    Thứ tự: Gamma → Dehaze → CLAHE → Bilateral Denoise
    """
    result = frame.copy()
    if gamma != 1.0:
        result = apply_gamma_correction(result, gamma)
    if use_dehazing:
        result = apply_dehazing(result)
    if use_clahe:
        result = apply_clahe(result, clip_limit=clahe_clip)
    if use_denoising:
        result = apply_denoising(result, d=denoise_d)
    return result


# ─────────────────────────────────────────────
# Pipeline tự động có state – Dùng để tăng tốc
# ─────────────────────────────────────────────

class AutoEnhancer:
    """
    Tự động quản lý việc tăng cường chất lượng ảnh với cơ chế cache
    để tránh tính toán thống kê quá nhiều lần.
    """
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval
        self.frame_count = 0
        self.is_dark = False
        self.is_hazy = False

    def enhance(self, frame: np.ndarray) -> np.ndarray:
        # Chỉ kiểm tra điều kiện sau mỗi N frame
        if self.frame_count % self.check_interval == 0:
            self.is_dark = is_dark_frame(frame)
            self.is_hazy = is_hazy_frame(frame)
        
        self.frame_count += 1

        if self.is_dark:
            return enhance_frame(frame, gamma=1.8, use_clahe=True, clahe_clip=3.0,
                                 use_denoising=False, use_dehazing=False)
        elif self.is_hazy:
            return enhance_frame(frame, use_dehazing=False, use_clahe=True, clahe_clip=2.0,
                                 use_denoising=False)
        else:
            return enhance_frame(frame, use_clahe=True, clahe_clip=1.5,
                                 use_denoising=False, use_dehazing=False)


def auto_enhance(frame: np.ndarray) -> np.ndarray:
    """
    Backward compatibility wrapper. 
    NOTE: Nên dùng class AutoEnhancer để có hiệu năng tốt nhất.
    """
    if is_dark_frame(frame):
        return enhance_frame(frame, gamma=1.8, use_clahe=True, clahe_clip=3.0,
                             use_denoising=False, use_dehazing=False)
    elif is_hazy_frame(frame):
        return enhance_frame(frame, use_dehazing=False, use_clahe=True, clahe_clip=2.0,
                             use_denoising=False)
    else:
        return enhance_frame(frame, use_clahe=True, clahe_clip=1.5,
                             use_denoising=False, use_dehazing=False)