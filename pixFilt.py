# usage : python3 pixFilt.py RPReplay_Final1683192607.mov 104 123 328 154 608 656 && open output.mp4

import cv2
import numpy as np
import sys
import os
from tqdm import tqdm
import tempfile
import shutil

def remove_white_frames(video_path, x, y, temp_dir, crop_top_left, crop_bottom_right, debug=False):
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Input video: {video_path}")
    print(f"Dimensions: {width}x{height}")
    print(f"Cropped dimensions: {crop_bottom_right[0]-crop_top_left[0]}x{crop_bottom_right[1]-crop_top_left[1]}")
    print(f"White pixel location: ({x},{y})")
    print(f"Frame rate: {fps:.2f} FPS")
    print(f"Frame count: {frame_count}")
    frames_dropped = 0
    saved_frame_index = 0
    with tqdm(total=frame_count, desc="Processing frames") as pbar:
        while cap.isOpened():
            ret, frame = cap.read()
            if ret:
                if np.all(frame[y,x] >= 250):
                    cropped_frame = frame[crop_top_left[1]:crop_bottom_right[1], crop_top_left[0]:crop_bottom_right[0]]
                    cv2.imwrite(os.path.join(temp_dir, f'frame{saved_frame_index:04d}.jpg'), cropped_frame)
                    saved_frame_index += 1
                else:
                    frames_dropped += 1
                pbar.set_postfix_str(f"Frames dropped: {frames_dropped / (pbar.n + 1) * 100:.2f}%")
                pbar.update(1)
            else:
                break
    os.system(f'ffmpeg -y -framerate {fps} -i {temp_dir}/frame%04d.jpg -c:v libx264 -pix_fmt yuv420p output.mp4')
    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    video_path = sys.argv[1]
    x = int(sys.argv[2])
    y = int(sys.argv[3])
    crop_top_left = (int(sys.argv[4]), int(sys.argv[5]))
    crop_bottom_right = (int(sys.argv[6]), int(sys.argv[7]))
    temp_dir = tempfile.mkdtemp(dir='.')
    print(f"Created temporary directory: {temp_dir}")
    try:
        remove_white_frames(video_path, x, y, temp_dir, crop_top_left, crop_bottom_right)
    finally:
        shutil.rmtree(temp_dir)
        print(f"Deleted temporary directory: {temp_dir}")