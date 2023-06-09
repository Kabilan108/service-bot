// ------------------------------- Variables ----------------------------------
let isRecording = false;
let mediaRecorder = null;
let stream = null;
let chunks = [];
let blob = null;

const statusMessage = document.getElementById('statusMessage');
const conversation = document.getElementById('conversation');
const userMessage = document.getElementById('userMessage');
const recordButton = document.getElementById('record');
const sendButton = document.getElementById('send');
const styles = {
    user: 'p-3 m-2 bg-info text-white rounded-left',
    bot: 'p-3 m-2 bg-success text-white rounded-right'
}
const typingIndicator = createTypingIndicator();
const API = {
    index: "https://0964-68-180-4-143.ngrok-free.app",
    chat: "https://0964-68-180-4-143.ngrok-free.app/api/chat",
    default: "https://0964-68-180-4-143.ngrok-free.app/api/default"
}

// ------------------------------- Functions ----------------------------------

// Function to start recording
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
                blob = new Blob(chunks, { 'type': 'audio/wav' });
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

// Function to stop recording
function stopRecording() {
    statusMessage.innerText = "Audio Recorded. Press Send to Submit.";
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
};

// Function to create a chat box
function createChatBox(message, isUser = true) {
    const chatBox = document.createElement('div');
    chatBox.classList.add(...(isUser ? styles.user : styles.bot).split(' '));
    chatBox.style.width = '70%';
    chatBox.style.float = isUser ? 'right' : 'left';
    chatBox.innerHTML = message;
    return chatBox;
}

// Function to create audio player
function createAudioPlayer(blobURL, isUser = true) {
    const audioPlayer = document.createElement('audio');
    audioPlayer.controls = true;
    audioPlayer.src = blobURL;

    audioPlayer.onpause = function () {
        URL.revokeObjectURL(this.src);
    };
    audioPlayer.onended = function () {
        URL.revokeObjectURL(this.src);
    };

    return createChatBox(audioPlayer.outerHTML, isUser);
}

// Create a typing indicator
function createTypingIndicator() {
    const chatBox = document.createElement('div');
    chatBox.classList.add(styles.bot.split(' ')[0]);
    chatBox.style.width = '70%';
    chatBox.style.float = 'left';

    const thinkingDots = document.createElement('div');
    thinkingDots.classList.add('thinking-dots');
    thinkingDots.innerHTML = '<span>⬤</span><span>⬤</span><span>⬤</span>';

    chatBox.appendChild(thinkingDots);
    return chatBox;
}

// Function to send data to the server
async function fetchToServer(data) {
    const response = await fetch(API.default, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`)
    } else {
        console.log('Success!');
        const responseData = await response.json();
        let chatBox;

        if (responseData.textResponse) {
            chatBox = createChatBox(responseData.textResponse, false);
        } else if (responseData.audioResponse) {
            // Convert base64 string to array of integers
            const byteCharacters = atob(responseData.audioResponse);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create blob and URL
            const chatBlob = new Blob([byteArray], { type: 'audio/wav' });
            const blobURL = window.URL.createObjectURL(chatBlob);

            chatBox = createAudioPlayer(blobURL, false);
        }

        conversation.removeChild(typingIndicator);
        conversation.appendChild(chatBox);
        conversation.scrollTop = conversation.scrollHeight;
    }
}

// -------------------------- Event Listeners ---------------------------------

// Toggle recording
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

// Send messages
sendButton.addEventListener('click', function () {
    // Check if there's any audio player in the review section
    const audioReviewDiv = document.getElementById('audio-review');
    const audioPlayer = audioReviewDiv.querySelector('audio');
    const closeButton = audioReviewDiv.querySelector('.close-button');

    if (userMessage.value.trim() === '' && !audioPlayer) {
        alert('Please enter a message or make a recording.');
        return;
    }

    let data = {};
    let chatBox;

    // Check if we have an audio or text message
    if (audioPlayer) {
        // Audio message
        data.audioMessage = blob;
        blob = null;
        chatBox = createAudioPlayer(audioPlayer.src);
        audioPlayer.remove();
        closeButton.remove();

        // Show chat box and typing indicator
        userMessage.value = '';
        conversation.appendChild(chatBox);
        conversation.appendChild(typingIndicator);
        conversation.scrollTop = conversation.scrollHeight;

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(data.audioMessage);
        reader.onloadend = function () {
            data.audioMessage = reader.result.split(',')[1];

            fetchToServer(data);
        }
    } else {
        // Text message
        data.textMessage = userMessage.value;
        chatBox = createChatBox(data.textMessage);

        // Show chat box and typing indicator
        userMessage.value = '';
        conversation.appendChild(chatBox);
        conversation.appendChild(typingIndicator);
        conversation.scrollTop = conversation.scrollHeight;

        fetchToServer(data);
    }

    // Clear status message
    statusMessage.innerText = null;
});