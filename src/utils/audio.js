let audioContext = null;
let analyser = null;
let dataArray = null;
let source = null;

export const initAudio = async () => {
    if (audioContext) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Resolution

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        return true;
    } catch (err) {
        console.error("Error accessing microphone:", err);
        return false;
    }
};

export const getAudioData = () => {
    if (!analyser) return null;
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
};

export const stopAudio = () => {
    if (source) {
        source.disconnect();
        source = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    analyser = null;
    dataArray = null;
};
