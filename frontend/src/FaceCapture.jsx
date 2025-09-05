import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as faceapi from "face-api.js";

const FaceCapture = forwardRef(({ onFaceData }, ref) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    stopCamera: () => {
      clearInterval(intervalRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) videoRef.current.srcObject = null;
    },
  }));

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setLoading(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setStreamError("Failed to load models.");
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            facingMode: "user",
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setStreamError("Unable to access webcam. Please allow permission.");
      }
    };

    loadModels().then(startVideo);

    return () => {
      clearInterval(intervalRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const detect = async () => {
      if (!videoRef.current) return;
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && onFaceData) {
        onFaceData(Array.from(detection.descriptor));
      }
    };

    if (!loading && !streamError) {
      intervalRef.current = setInterval(detect, 2000);
    }

    return () => clearInterval(intervalRef.current);
  }, [loading, streamError, onFaceData]);

  return (
    <div className="space-y-2">
      {loading ? (
        <p>Loading face detection models...</p>
      ) : streamError ? (
        <p className="text-red-600">{streamError}</p>
      ) : (
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded"
          style={{ display: "block", backgroundColor: "#000" }}
        />
      )}
    </div>
  );
});

export default FaceCapture;
