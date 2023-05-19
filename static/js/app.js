// ------------------------------- Variables ----------------------------------
let isRecording = false;
let mediaRecorder = null;
let stream = null;
let chunks = [];

const userMessage = document.getElementById('userMessage');
const recordButton = document.getElementById('record');
const sendButton = document.getElementById('send');
const statusMessage = document.getElementById('statusMessage');


// ------------------------------- Functions ----------------------------------

// Function to start recording when the button is clicked
function startRecording() {
    // Access the camera and microphone
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((_stream) => {
            stream = _stream;
            statusMessage.innerText = "Recording... Click pause to stop recording.";

            // Create a new MediaRecorder instance
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = function (e) {
                chunks.push(e.data);
            };

            // Create new Blob and audio element when recording stops
            mediaRecorder.onstop = function (e) {
                const blob = new Blob(chunks, { 'type': 'audio/wav' });
                chunks = [];

                // Create audio player
                const audioURL = window.URL.createObjectURL(blob);
                const player = document.createElement('audio');
                player.controls = true;
                player.src = audioURL;

                // Create close button
                const closeButton = document.createElement('button');
                closeButton.innerText = 'X';
                closeButton.classList.add('btn', 'btn-danger', 'close-button');

                // Add event listener to close button
                closeButton.addEventListener('click', function (e) {
                    // Prevent button from submitting form
                    e.preventDefault();

                    // Remove audio player and close button
                    player.remove();
                    closeButton.remove();
                    statusMessage.innerText = null;
                });

                // Append audio player and close button to div
                const audioReveiwDiv = document.getElementById('audio-review');
                audioReveiwDiv.appendChild(player);
                audioReveiwDiv.appendChild(closeButton);
            };
        });
}

function stopRecording() {
    statusMessage.innerText = "Audio Recorded. Press Send to Submit.";
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
};


// -------------------------- Event Listeners ---------------------------------

recordButton.addEventListener('click', function () {
    if (!isRecording) {
        startRecording();
        isRecording = true;
        recordButton.classList.add('recording');
    } else {
        stopRecording();
        isRecording = false;
        recordButton.classList.remove('recording');
    }
});

// Send audio recording
// sendButton.addEventListener('click', function () {
//     if (recordedChunks.length > 0) {
//         let blob = new Blob(recordedChunks, { 'type': 'audio/wav' });
//         recordedChunks = []; // Reset chunks for next recording

//         let formData = new FormData();
//         formData.append('audio', blob, 'recordedAudio.wav');
//         fetch('/api/audio', {
//             method: 'POST',
//             body: formData
//         })
//             .then(response => response.blob())
//             .then(data => {
//                 // Save returned audio blob for playing
//                 let url = URL.createObjectURL(data);
//                 new Audio(url).play();
//             });
//     }
//     else {
//         // Send text message
//         let message = userMessage.value;
//         fetch('/api/message', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ message: message })
//         })
//             .then(response => response.text())
//             .then(data => {
//                 // Show returned message
//                 alert(data);
//             });
//     }
//     userMessage.value = "";
// });
