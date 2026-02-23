/* global faceapi */
import store from '../store';

class EmotionService {
    constructor() {
        this.modelsLoaded = false;
        this.stream = null;
        this.video = null;
        this.detectionInterval = null;
        this.currentEmotion = 'neutral';

        // Model URLs
        this.MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
    }

    async loadModels() {
        if (this.modelsLoaded) return;
        try {
            console.log('[Emotion] Loading models...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(this.MODEL_URL)
            ]);
            this.modelsLoaded = true;
            console.log('[Emotion] Models loaded');
        } catch (err) {
            console.error('[Emotion] Failed to load models:', err);
        }
    }

    async startDetection() {
        if (!this.modelsLoaded) await this.loadModels();

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();

            this.detectionInterval = setInterval(async () => {
                const detections = await faceapi.detectSingleFace(
                    this.video,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceExpressions();

                if (detections) {
                    const emotion = this.getTopEmotion(detections.expressions);
                    if (emotion !== this.currentEmotion) {
                        this.currentEmotion = emotion;
                        this.applyEmotionEffect(emotion);
                    }
                }
            }, 1000); // Detect every second
        } catch (err) {
            console.error('[Emotion] Camera access denied or error:', err);
        }
    }

    getTopEmotion(expressions) {
        let max = 0;
        let topEmotion = 'neutral';
        for (const [emotion, value] of Object.entries(expressions)) {
            if (value > max) {
                max = value;
                topEmotion = emotion;
            }
        }
        return topEmotion;
    }

    applyEmotionEffect(emotion) {
        console.log('[Emotion] Detected:', emotion);
        store.dispatch('chat/addActionLog', {
            message: `Your character feels ${emotion}.`,
            type: 'info'
        });

        // Example mechanics:
        // happy: speed up
        // angry: more damage
        // sad: lower speed
        // neutral: base stats

        // We can emit an event or update store
        store.commit('player/SET_EMOTION', emotion);
    }

    stop() {
        if (this.detectionInterval) clearInterval(this.detectionInterval);
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

export const emotionService = new EmotionService();
export default emotionService;
