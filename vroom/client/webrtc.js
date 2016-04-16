var localVideo;
var remoteVideo;
var peerConnection;
var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};



navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function pageReady() {
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    serverConnection = new WebSocket('wss://server1095.cs.technik.fhnw.ch/vroom');
    serverConnection.onmessage = gotMessageFromServer;

    var constraints = {
        video: true,
        audio: true,
    };

    if(navigator.getUserMedia) {
navigator.getUserMedia(constraints,getUserMediaSuccess,errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
	/*
	https://hacks.mozilla.org/2013/02/cross-browser-camera-capture-with-getusermediawebrtc/
	Firefox uses the mozSrcObject attribute whereas Opera and Chrome use src.
	Chrome uses the createObjectURL method whereas Firefox and Opera send the stream directly.

	With Firefox, video.mozSrcObject is initially null rather than undefined so we can rely on this to detect for Firefox’s support (hat tip to Florent). Once the stream knows where to go we can tell the video stream to plaly
	*/
 if (localVideo.mozSrcObject !== undefined) {
        localVideo.mozSrcObject = stream;
    } else {
        localVideo.src = (window.URL && window.URL.createObjectURL(stream)) || stream; 

    };
    localVideo.play();
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
	peerConnection.oniceconnectionstatechange = function() {
		console.log("state has changed to " + peerConnection.iceConnectionState);
    if(peerConnection.iceConnectionState == 'disconnected' || peerConnection.iceConnectionState == 'failed' || peerConnection.iceConnectionState == 'closed') {
        console.log("finsished");
        peerConnection.close();
        peerConnection = null;
        remoteVideo.load();
        
    }
}
	
	
    if(isCaller) {
        peerConnection.createOffer(gotDescription, errorHandler);
    }
}

function stop(){
peerConnection.close();	
	
}



function gotMessageFromServer(message) {
    if(!peerConnection) start(false);

    var signal = JSON.parse(message.data);
    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
            peerConnection.createAnswer(gotDescription, errorHandler);
        }, errorHandler);
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        serverConnection.send(JSON.stringify({'ice': event.candidate}));
    }
}

function gotDescription(description) {
    console.log('got description');
    peerConnection.setLocalDescription(description, function () {
        serverConnection.send(JSON.stringify({'sdp': description}));
    }, function() {console.log('set description error')});
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}
