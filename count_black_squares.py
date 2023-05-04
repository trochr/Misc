'''

Prompt sequence:
1. write a python script that takes a video in input of a 20 by 10 grid, and place a green dot on each square that is black, or almost black
2. add a main function that deals with command line parameters
3. make the dots the same size as the squares
4. Problem is there are 2 dots per square, there should be no more than 20 vertically and 10 horizontally
5. Still same issue. The dots should be centered on the black squares forming the grid
6. remove all the code related to the green dots
7. add a 20 by 10 grid of green dots, at regular intervals, so that it covers the full area of the video
8. make the grid 10 by 20 instead of 20 by 10
9. make the dots 2 times smaller
10. only place the dots if the area behind them is almost black
11. space pauses the loop
12. count dots per line, from bottom to top, and show on an output in a single line. Don't duplicate output if frame has the same count
13. keep on displaying the dots, why did you remove them ?
14. space pauses the processing
15. keep the dot size constant, only print the lines when there are at least 4 consecutive lines with 10 dots
16. make it 5 consecutive lines, and they should not be the first 5 lines
17. if the 5 bottom rows have the same sequence of dot count, consider it the same "game" and only display the output once
18. if the 3 bottom rows have 10 or 0 dots, don't display output
19. only display the number of dots for the bottom 12 rows



Final prompt:
------------
script that adds a 10 by 20 grid of green dots at regular intervals to cover the full area of the video, with a constant size and only placed on squares that are black or almost black. The script also counts the number of green dots in each row of the grid, from bottom to top, and prints the counts for the bottom 12 rows to the console in a single line only if there are at least 5 consecutive rows with 10 dots that are not the first 5 rows and if the sequence of dot counts in the bottom 5 rows is different from the previous frame and if none of the bottom 3 rows have 10 or 0 dots. The script will not print duplicate counts if consecutive frames have the same counts. In this version of the script, pressing the spacebar will pause and resume the processing of the video

'''
import cv2
import numpy as np
import sys

def process_video(input_path):
    cap = cv2.VideoCapture(input_path)
    last_counts = None
    last_bottom_5_rows = None
    paused = False

    while(cap.isOpened()):
        if not paused:
            ret, frame = cap.read()
            if ret==True:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                counts = []
                for i in range(19, -1, -1):
                    count = 0
                    for j in range(10):
                        x_start = int(j * frame.shape[1] / 10)
                        x_end = int((j + 1) * frame.shape[1] / 10)
                        y_start = int(i * frame.shape[0] / 20)
                        y_end = int((i + 1) * frame.shape[0] / 20)
                        square = gray[y_start:y_end, x_start:x_end]
                        if np.mean(square) < 50:
                            center_x = int((x_start + x_end) / 2)
                            center_y = int((y_start + y_end) / 2)
                            cv2.circle(frame, (center_x, center_y), 5, (0, 255, 0), -1)
                            count += 1
                    counts.append(count)

                consecutive_rows_with_10_dots = 0
                for i in range(len(counts)):
                    if counts[i] == 10:
                        consecutive_rows_with_10_dots += 1
                    else:
                        consecutive_rows_with_10_dots = 0

                    if consecutive_rows_with_10_dots >= 5 and i >= 5:
                        break

                bottom_5_rows = counts[:5]
                bottom_3_rows_valid = all(count not in [0,10] for count in counts[:3])
                if consecutive_rows_with_10_dots >= 5 and i >= 5 and bottom_5_rows != last_bottom_5_rows and bottom_3_rows_valid and counts != last_counts:
                    print(' '.join(map(str, counts[:12])))
                    last_counts = counts
                    last_bottom_5_rows = bottom_5_rows

                cv2.imshow('frame',frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord(' '):
            paused = not paused

    cap.release()
    cv2.destroyAllWindows()

def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <input_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    process_video(input_path)

if __name__ == "__main__":
    main()