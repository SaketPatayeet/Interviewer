import cv2
import mediapipe as mp
import numpy as np


class VisionAnalyzer:

    def __init__(self):

        # ===== LOAD FACE MESH MODEL =====

        self.face_mesh = (
            mp.solutions.face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        )

    def analyze(
        self,
        video_path: str
    ):

        # ===== OPEN VIDEO =====

        cap = cv2.VideoCapture(video_path)

        # ===== SAFETY CHECK =====

        if not cap.isOpened():

            return {

                "face_presence_ratio": 0,

                "gaze_alignment_ratio": 0,

                "fidgeting_score": 0
            }

        # ===== METRICS =====

        total_frames = 0

        processed_frames = 0

        face_detected_frames = 0

        gaze_alignment_frames = 0

        movement_scores = []

        prev_nose = None

        # ===== PERFORMANCE =====

        frame_skip = 5

        # ===== PROCESS VIDEO =====

        while True:

            ret, frame = cap.read()

            if not ret:
                break

            total_frames += 1

            # ===== SKIP FRAMES =====

            if total_frames % frame_skip != 0:
                continue

            processed_frames += 1

            # ===== RGB =====

            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB
            )

            # ===== FACE LANDMARKS =====

            results = self.face_mesh.process(rgb)

            if not results.multi_face_landmarks:
                continue

            face_detected_frames += 1

            landmarks = (
                results
                .multi_face_landmarks[0]
                .landmark
            )

            # ===== IMPORTANT LANDMARKS =====

            nose = landmarks[1]

            left_eye = landmarks[33]

            right_eye = landmarks[263]

            # ===== GAZE ALIGNMENT =====

            eye_center_x = (
                left_eye.x +
                right_eye.x
            ) / 2

            if abs(
                nose.x - eye_center_x
            ) < 0.05:

                gaze_alignment_frames += 1

            # ===== HEAD MOVEMENT =====

            if prev_nose is not None:

                movement = np.sqrt(

                    (nose.x - prev_nose.x) ** 2 +

                    (nose.y - prev_nose.y) ** 2
                )

                movement_scores.append(
                    movement
                )

            prev_nose = nose

        # ===== RELEASE VIDEO =====

        cap.release()

        # ===== CALCULATE SCORES =====

        face_presence_ratio = round(

            face_detected_frames /

            max(processed_frames, 1),

            2
        )

        gaze_alignment_ratio = round(

            gaze_alignment_frames /

            max(processed_frames, 1),

            2
        )

        fidgeting_score = round(

            float(
                np.mean(movement_scores)
            ) if movement_scores else 0,

            4
        )

        # ===== RETURN METRICS =====

        return {

            "face_presence_ratio":
                face_presence_ratio,

            "gaze_alignment_ratio":
                gaze_alignment_ratio,

            "fidgeting_score":
                fidgeting_score
        }