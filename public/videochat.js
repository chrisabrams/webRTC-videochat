var VideoChat = function() {
	this.localVideo;
	this.miniVideo;
	this.pc;
	this.remoteVideo;
};

VideoChat.prototype.init = function() {
	var _this = this;

	var socket = io.connect("http://videochat.jit.su");

	socket.on('connected', function(data) {
		console.log('Client Connected');
		_this.maybeStart();
	});

	setTimeout(function() {
		console.log("Initializing");
		card = document.getElementById("card");
		_this.localVideo = document.getElementById("localVideo");
		_this.miniVideo = document.getElementById("miniVideo");
		_this.remoteVideo = document.getElementById("remoteVideo");
		_this.resetStatus();
		_this.getUserMedia();
	}, 100);
};

VideoChat.prototype.createPeerConnection = function() {
	var _this = this;

	try {
	  _this.pc = new webkitPeerConnection00("STUN stun.l.google.com:19302", _this.onIceCandidate);
	  console.log("Created webkitPeerConnnection00 with config \"STUN stun.l.google.com:19302\".");
	} catch (e) {
	  console.log("Failed to create PeerConnection, exception: " + e.message);
	  alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
	  return;
	}

	_this.pc.onconnecting = _this.onSessionConnecting;
	_this.pc.onopen = _this.onSessionOpened;
	_this.pc.onaddstream = _this.onRemoteStreamAdded;
	_this.pc.onremovestream = _this.onRemoteStreamRemoved;
};

VideoChat.prototype.doCall = function() {
	console.log("Send offer to peer");
	var offer = this.pc.createOffer({audio:true, video:true});
	this.pc.setLocalDescription(pc.SDP_OFFER, offer);
	this.sendMessage({type: 'offer', sdp: offer.toSdp()});
	this.pc.startIce();
};

VideoChat.prototype.doAnswer = function() {
	console.log("Send answer to peer");
	var offer = this.pc.remoteDescription;
	var answer = this.pc.createAnswer(offer.toSdp(), {audio:true,video:true});
	this.pc.setLocalDescription(this.pc.SDP_ANSWER, answer);
	this.sendMessage({type: 'answer', sdp: answer.toSdp()});
	this.pc.startIce();
};

VideoChat.prototype.enterFullScreen = function() {
	remote.webkitRequestFullScreen();
};

VideoChat.prototype.getUserMedia = function() {
	var _this = this;

	try {
	  navigator.webkitGetUserMedia({audio:true, video:true}, _this.onUserMediaSuccess, _this.onUserMediaError);
	  console.log("Requested access to local media with new syntax.");
	} catch (e) {
	  try {
		navigator.webkitGetUserMedia("video,audio", _this.onUserMediaSuccess, _this.onUserMediaError);
		console.log("Requested access to local media with old syntax.");
	  } catch (e) {
		alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
		console.log("webkitGetUserMedia failed with exception: " + e.message);
	  }
	}
};

VideoChat.prototype.maybeStart = function() {
	var _this = this;

	if (!started && localStream) {
	  _this.setStatus("Connecting...");
	  console.log("Creating PeerConnection.");
	  _this.createPeerConnection();
	  console.log("Adding local stream.");
	  _this.pc.addStream(localStream);
	  started = true;
	  // Caller initiates offer to peer.
	  if (initiator) {
	  	console.log("I am the initiator")
	  	_this.doCall();
	  }
		
	}
};

VideoChat.prototype.onChannelMessage = function(message) {
	console.log('S->C: ' + message.data);
	this.processSignalingMessage(message.data);
};

VideoChat.prototype.onChannelOpened = function() {
	var _this = this;

	console.log('Channel opened.');
	channelReady = true;
	if (initiator) _this.maybeStart();
};

VideoChat.prototype.onHangup = function() {
	console.log("Hanging up.");
	started = false;    // Stop processing any message
	this.transitionToDone();
	this.pc.close();
	// will trigger BYE from server
	socket.close();
	this.pc = null;
	//socket = null;
};

VideoChat.prototype.onIceCandidate = function(candidate, moreToFollow) {
	var _this = this;

	if (candidate) {
		_this.sendMessage({type: 'candidate', label: candidate.label, candidate: candidate.toSdp()});
	}

	if (!moreToFollow) {
	  console.log("End of candidates.");
	}
};

VideoChat.prototype.onRemoteHangup = function() {
	console.log('Session terminated.');
	started = false;    // Stop processing any message
	this.transitionToWaiting();
	this.pc.close();
	this.pc = null;
	initiator = 0;
}

VideoChat.prototype.onRemoteStreamAdded = function(event) {
	var _this = this;

	console.log("Remote stream added.");
	var url = webkitURL.createObjectURL(event.stream);
	_this.miniVideo.src = _this.localVideo.src;
	_this.remoteVideo.src = url;
	_this.waitForRemoteVideo();  
};

VideoChat.prototype.onRemoteStreamRemoved = function(event) {
	console.log("Remote stream removed.");
};

VideoChat.prototype.onSessionConnecting = function(message) {
	console.log("Session connecting.");
};

VideoChat.prototype.onSessionOpened = function(message) {
	console.log("Session opened.");
};

VideoChat.prototype.onUserMediaError = function(error) {
	console.log("Failed to get access to local media. Error code was " + error.code);
	alert("Failed to get access to local media. Error code was " + error.code + ".");
};

VideoChat.prototype.onUserMediaSuccess = function(stream) {
	var _this = this;

	console.log("User has granted access to local media.");
	var url = webkitURL.createObjectURL(stream);
	_this.localVideo.style.opacity = 1;
	_this.localVideo.src = url;
	localStream = stream;
	// Caller creates PeerConnection.
	if (initiator) _this.maybeStart();
};

VideoChat.prototype.processSignalingMessage = function(message) {
	var _this = this;

	var msg = JSON.parse(message);

	if (msg.type === 'offer') {
	  // Callee creates PeerConnection
	  if (!initiator && !started)
		_this.maybeStart();

	  _this.pc.setRemoteDescription(_this.pc.SDP_OFFER, new SessionDescription(msg.sdp));
	  _this.doAnswer();
	} else if (msg.type === 'answer' && started) {
	  _this.pc.setRemoteDescription(_this.pc.SDP_ANSWER, new SessionDescription(msg.sdp));
	} else if (msg.type === 'candidate' && started) {
	  var candidate = new IceCandidate(msg.label, msg.candidate);
	  _this.pc.processIceMessage(candidate);
	} else if (msg.type === 'bye' && started) {
	  _this.onRemoteHangup();
	}
};

VideoChat.prototype.resetStatus = function() {
	var _this = this;

	if (!initiator) {
	  _this.setStatus("Waiting for someone to join: <a href=\""+window.location.origin+"\">"+window.location.origin+"</a>");
	} else {
	  _this.setStatus("Initializing...");
	}
};

VideoChat.prototype.sendMessage = function(message) {
	var msgString = JSON.stringify(message);
	console.log('C->S: ' + msgString);
	path = '/';
	var xhr = new XMLHttpRequest();
	xhr.open('POST', path, true);
	xhr.send(msgString);
};

VideoChat.prototype.setStatus = function(state) {
	footer.innerHTML = state;
};

VideoChat.prototype.transitionToActive = function() {
	var _this = thisl

	_this.remoteVideo.style.opacity = 1;
	card.style.webkitTransform = "rotateY(180deg)";
	setTimeout(function() { _this.localVideo.src = ""; }, 500);
	setTimeout(function() { _this.miniVideo.style.opacity = 1; }, 1000);
	_this.setStatus("<input type=\"button\" id=\"hangup\" value=\"Hang up\" onclick=\"onHangup()\" />");
};

VideoChat.prototype.transitionToDone = function() {
	this.localVideo.style.opacity = 0;
	this.remoteVideo.style.opacity = 0;
	this.miniVideo.style.opacity = 0;
	this.setStatus("You have left the call. <a href=\""+window.location.origin+"\">Click here</a> to rejoin.");
};

VideoChat.prototype.transitionToWaiting = function() {
	var _this = this;

	card.style.webkitTransform = "rotateY(0deg)";
	setTimeout(function() { _this.localVideo.src = _this.miniVideo.src; _this.miniVideo.src = ""; _this.remoteVideo.src = "" }, 500);
	_this.miniVideo.style.opacity = 0;
	_this.remoteVideo.style.opacity = 0;
	_this.resetStatus();
};

VideoChat.prototype.waitForRemoteVideo = function() {
	var _this = this;

	if (_this.remoteVideo.currentTime > 0) {
	  _this.transitionToActive();
	} else {
	  setTimeout(_this.waitForRemoteVideo, 100);
	}
};