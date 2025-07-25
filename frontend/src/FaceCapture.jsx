import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

const FaceCapture = ({ onFaceData }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        setLoading(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setLoading(true);
        alert("Failed to load models. See console for details.");
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Make sure video plays
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch((err) => {
              console.error("Play error:", err);
              setStreamError("Could not play video");
            });
          };
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setStreamError("Unable to access webcam. Please allow permission.");
      }
    };

    loadModels().then(startVideo);

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFaceData = async () => {
    if (!videoRef.current) return;

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("No face detected. Please try again.");
      return;
    }

    onFaceData(Array.from(detection.descriptor));
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p>Loading face detection models...</p>
      ) : streamError ? (
        <p className="text-red-600">{streamError}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            width="320"
            height="240"
            muted
            autoPlay
            playsInline
            style={{
              borderRadius: "8px",
              backgroundColor: "#000",
              display: "block",
            }}
            onError={() => setStreamError("Video failed to load")}
          />
          <button
            type="button"
            onClick={captureFaceData}
            className="btn bg-green-600 text-white mt-2"
          >
            Capture Face
          </button>
        </>
      )}
    </div>
  );
};

export default FaceCapture;
