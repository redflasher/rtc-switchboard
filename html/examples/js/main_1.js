  var candidatesArr = [];
  var channelReady = true;
  var channelRefreshTimer;
  var initiator = true;
  var ROOM="room";
  var remoteSdp={};
  var peerType;
  var sessionId;//
  var started = false;

  var sock;// = new SockJS('http://localhost:9999/echo');

  var localVideo;
  var miniVideo;
  var remoteVideo;
  var localStream;
  var remoteStream;
  var pc;
  var autoReconnect = false;


  // Set up audio and video regardless of what devices are present.
  var mediaConstraints = {'mandatory': {
    'OfferToReceiveAudio':true, 
    'OfferToReceiveVideo':true }};


    function initialize() 
    {

      console.log("initialize");
      if(!sock){
    
        sock = new SockJS('http://localhost:9999/echo');
        
        // Open the connection
        sock.onopen = function() {
          console.log('open');
        };

        // On connection close
        sock.onclose = function() {
          console.log('close');
        };

         sock.onmessage = function(e) {
             console.log('message', e.data);
             processSignalingMessage(e.data);
         };

    }
    else
    {
      sock.close();
      sock = null;
      initialize();
    }

    doGetUserMedia();
  }



  function openChannel(callback) {
    // console.log("Opening channel.");

    var jsonData = {};

    jsonData.room = "room";
  	jsonData.mySex = $("[name=mySex]").val();
  	jsonData.yourSex = $("[name=yourSex]").val();
  	jsonData.country = $("[name=country]").val();//"Russia";

  }

  function setOffer(sdp)
  {
      var jsonData = {};

		jsonData.room = ROOM;

    jsonData.mySex = $("[name=mySex]").val();
    jsonData.yourSex = $("[name=yourSex]").val();
    jsonData.country = $("[name=country]").val();//"Russia";
		jsonData.videoKey = sdp;
		jsonData.type = peerType;

	    $.ajax({
	    	url:PHP_PATH+"setOffer.php",
	    	method:"POST",
	    	data:jsonData,
	    	success:function(data)
	    	{
	    		sessionId = JSON.parse(data).sessionId;
	    		// console.log("setOffer.data:",sessionId);//,data);
	    	}
	    });
  }

  function setAnswer(sdp)
  {
      var jsonData = {};

		jsonData.room = ROOM;

    jsonData.mySex = $("[name=mySex]").val();
    jsonData.yourSex = $("[name=yourSex]").val();
    jsonData.country = $("[name=country]").val();//"Russia";

		jsonData.videoKey = sdp;
		jsonData.type = peerType;
		jsonData.sessionId = sessionId;


	    $.ajax({
	    	url:PHP_PATH+"setOffer.php",
	    	method:"POST",
	    	data:jsonData,
	    	success:function(data)
	    	{
	    		sessionId = JSON.parse(data).sessionId;
	    		// console.log("setOffer.data:",sessionId);//,data);
	    	}
	    });
  }



  function doGetUserMedia() {
    console.log("doGetUserMedia");
    // Call into getUserMedia via the polyfill (adapter.js).
    var constraints = {"mandatory": {}, "optional": []}; 
    try {


      navigator.getUserMedia({'audio':true, 'video':constraints}, onUserMediaSuccess,
                   onUserMediaError);

      // console.log("Requested access to local media with mediaConstraints:\n" +
                  // "  \"" + JSON.stringify(constraints) + "\"");
    } catch (e) {
      alert("getUserMedia() failed. Is this a WebRTC capable browser?");
      // console.log("getUserMedia failed with exception: " + e.message);
    }
  }

  function createPeerConnection() {
    console.log("createPeerConnection");
    var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    try {
      // Create an RTCPeerConnection via the polyfill (adapter.js).

      if(pc)
      {
        pc = null;
      }

      pc = new window.RTCPeerConnection(pc_config) ;
      pc.onicecandidate = onIceCandidate;
      pc.oniceconnectionstatechange = changeICEState;
      // console.log("Created RTCPeerConnnection with config:\n" + "  \"" +
                  // JSON.stringify(pc_config) + "\".");
    } catch (e) {
      // console.log("Failed to create PeerConnection, exception: " + e.message);
      alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.");
        return;
    }

    pc.onconnecting = onSessionConnecting;
    pc.onopen = onSessionOpened;
    pc.onaddstream = onRemoteStreamAdded;
    pc.onremovestream  = onRemoteStreamRemoved;

  }




  function maybeStart() {
  	// console.log("maybeStart",initiator,localStream,channelReady,started);
    if (!started && localStream && channelReady) {
      setStatus("Connecting...");
      // console.log("Creating PeerConnection.");
      createPeerConnection();
      // console.log("Adding local stream.");

      pc.addStream(localStream);

      started = true;
      // console.log("maybeStart.addStream");
      // Caller initiates offer to peer.
      if(initiator)
  		{
        // console.log("doCall");
  			doCall();
  		}
      else
      {
        // console.log("doAnswer");
      	doAnswer();
      }
    }
  }

  function maybeStart2() {
    // console.log("maybeStart",initiator,localStream,channelReady,started);
    if (!started) {
      setStatus("Connecting...");
      // console.log("Creating PeerConnection.");
      createPeerConnection();
      // console.log("Adding local stream.");
      started = true;
      // console.log("maybeStart.addStream");
      // Caller initiates offer to peer.
      if(initiator)
      {
        // console.log("doCall");
        doCall();
      }
      else
      {
        // console.log("doAnswer");
        doAnswer();
      }
    }
  }


  function doCall() {
    // console.log("Sending offer to peer.");
    pc.createOffer(setLocalAndSendMessage, function(){}, mediaConstraints);
  }

  function doAnswer() {
    pc.setRemoteDescription( new RTCSessionDescription(remoteSdp) );
    pc.createAnswer(setLocalAndSendMessage2, function(){}, mediaConstraints);
  }

  function setLocalAndSendMessage(sessionDescription) {
  	console.log("setLocalAndSendMessage offer");
    pc.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
  }

  function setLocalAndSendMessage2(sessionDescription) {//for answer
    pc.setLocalDescription(sessionDescription);
    setAnswer(sessionDescription.sdp);
    getICE();
  }


  function getICE()
  {
      //получаем ice-кандидатов
	    var jsonData = {};
	    if(peerType =="offer")
	    {
	    	jsonData.type="answer";
	    }
	    else if(peerType =="answer")
	    {
	    	jsonData.type="offer";
	    }
	    jsonData.sessionId = sessionId;

	    $.ajax({
	    	url:PHP_PATH+"getCandidates.php",
	    	method:"POST",
	    	data:jsonData,
	    	success:function(data)
	    	{
          var candidatesArr = JSON.parse(data).candidates;
          
          if(candidatesArr.length ==0)
          {
            return false;
          }
          candidatesArr = JSON.parse(candidatesArr);

	    		$.each(candidatesArr,function(i,v)
	    		{
	    			var ice = window.mozRTCIceCandidate || window.RTCIceCandidate;
	    			pc.addIceCandidate(new ice(v) );
	    		});
	    	}
	    });
  }


  function changeICEState()
  {

     if(pc != null && pc.iceConnectionState == 'disconnected') {

        clearInterval(chatGetMessageTimer);
        $(".chatInput").prop("disabled",true);
        $(".chatSendBtn").prop("disabled",true);

        remoteVideo.src = "";
        if(autoReconnect)
        {
          $(".infoMsg2").html("Companion was disconnected. Finding next..");
          $(".infoMsg2").css("z-index",100);
        }
        else
        {
          $(".infoMsg2").html("Companion was disconnected. Press Start to try again.");
          $(".infoMsg2").css("z-index",100);
        }



        clearPeer(function()
        {
          started = false;


          //возвращаем активность кнопкам
          $("[name=startChatBtn]").prop('disabled', false);
          $("[name=stopChatBtn]").prop('disabled', true);

          if(!autoReconnect)
          {
            return false;
          }
          $(".chatLog").html("");

          $("[name=startChatBtn]").prop('disabled', true);
          $("[name=stopChatBtn]").prop('disabled', false);
          $("[name=nextChatBtn]").prop('disabled', false);

          openChannel(function(data)
          {
              // Caller creates PeerConnection.
              if(data =="offer")initiator=true;
              else if(data=="answer")initiator=false;
              maybeStart();
          });
        });
    }

  }

  function sendMessage(message) {
    var msgString = JSON.stringify(message);
    sock.send(msgString);
  }

  function processSignalingMessage(message) {
    var msg = JSON.parse(message);

    if (msg.type === 'offer') {
      // Callee creates PeerConnection
      if (!initiator && !started)
        maybeStart();

      remoteSdp = msg;
      pc.setRemoteDescription(new RTCSessionDescription(msg));
      
      doAnswer();
    } else if (msg.type === 'answer' && started) {
      pc.setRemoteDescription(new RTCSessionDescription(msg));
    } else if (msg.type === 'candidate' && started) {
      var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                           candidate:msg.candidate});

    } 

  }

  function onChannelOpened() {
    // console.log('Channel opened.');
    channelReady = true;
    if (initiator) maybeStart();
  }
  function onChannelMessage() {
    //off
  	$.ajax({
  		url:PHP_PATH+"getStatus.php",
  		method:"POST",
  		success:function(data)
  		{
		    // console.log('S->C: ' + data);
		    sessionId = JSON.parse(data).sessionId;
		    // processSignalingMessage(message.data);
  		}
	});
  }
  function onChannelError() {
    // console.log('Channel error.');
  }
  function onChannelClosed() {
    // console.log('Channel closed.');
  }

  function onUserMediaSuccess(stream) {
    // Call the polyfill wrapper to attach the media stream to this element.
    attachMediaStream(localVideo, stream);
    localVideo.style.opacity = 1;
    localStream = stream;

    // remoteStream = stream;

    openChannel(function(data)
    {
        // Caller creates PeerConnection.
        if(data =="offer")initiator=true;
        else if(data=="answer")initiator=false;
        maybeStart();
    });

  }

  function onUserMediaError(error) {

    getUserMedia({'audio':false, 'video':false}, function(errStream)
    {
    },
    function(errError)
    {

    });

    channelReady = true;

    openChannel(function(data)
    {
        // Caller creates PeerConnection.
        if(data =="offer")initiator=true;
        else if(data=="answer")initiator=false;
        maybeStart2();
    });

  }



  
  function onIceCandidate(event) {
    if (event.candidate) {
      candidatesArr.push({type: 'candidate',
                   label: event.candidate.sdpMLineIndex,
                   id: event.candidate.sdpMid,
                   candidate: event.candidate.candidate});

    } else {
      sendMessage({type:"candidates",data:candidatesArr});
      candidatesArr = [];
    }
  }

  function onSessionConnecting(message) {
  }
  function onSessionOpened(message) {
  }

  function onRemoteStreamAdded(event) {

    enableTextChat();
    $(".infoMsg2").css("z-index",0);
    remoteVideo.src = event.stream;
    remoteStream = event.stream;
    attachMediaStream(remoteVideo, event.stream);
  }
  function onRemoteStreamRemoved(event) {
  }

  // Send BYE on refreshing(or leaving) a demo page
  // to ensure the room is cleaned for next session.
  window.onbeforeunload = function() {
  	clearPeer(function(){});
    //Delay 100ms to ensure 'bye' arrives first.
    setTimeout(function(){}, 100);
  };


  function clearPeer(callback)
  {
  	var jsonData = {};
  	jsonData.sessionId = sessionId;
  	jsonData.type = peerType;
  	$.ajax({
  		url:PHP_PATH+"clearPeer.php",
  		method:"POST",
  		data:jsonData,
      success:function(data)
      {
        callback(data);
      }
  	});
  }

  // Set Opus as the default audio codec if it's present.
  function preferOpus(sdp) {
    var sdpLines = sdp.split('\r\n');

    // Search for m line.
    for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          var mLineIndex = i;
          break;
        } 
    }
    if (mLineIndex === null)
      return sdp;

    // If Opus is available, set it as the default in m line.
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {        
        var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
        if (opusPayload)
          sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
        break;
      }
    }

    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
  }

  function extractSdp(sdpLine, pattern) {
    var result = sdpLine.match(pattern);
    return (result && result.length == 2)? result[1]: null;
  }

  // Set the selected codec to the first in m line.
  function setDefaultCodec(mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = new Array();
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
      if (index === 3) // Format of media starts from the fourth.
        newLine[index++] = payload; // Put target payload to the first.
      if (elements[i] !== payload)
        newLine[index++] = elements[i];
    }
    return newLine.join(' ');
  }

  // Strip CN from sdp before CN constraints is ready.
  function removeCN(sdpLines, mLineIndex) {
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (var i = sdpLines.length-1; i >= 0; i--) {
      var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload) {
        var cnPos = mLineElements.indexOf(payload);
        if (cnPos !== -1) {
          // Remove CN payload from m line.
          mLineElements.splice(cnPos, 1);
        }
        // Remove CN line in sdp
        sdpLines.splice(i, 1);
      }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
  }



  function changeReconnect()
  {
    autoReconnect = $("[name=autoReconnectCheckbox]").is(":checked");
    setCookie("autoReconnect",Boolean(autoReconnect) );
  }



  function stopChat()
  {
    remoteVideo.src = "";
    localVideo.src = "";

    $(".infoMsg2").html("Press Start to chat");
    $(".infoMsg2").css("z-index",100);

    clearInterval(chatGetMessageTimer);
    if(pc)
    {    
      pc.close();
      pc = null;
    }
    
    $(".chatInput").prop("disabled",true);
    $(".chatSendBtn").prop("disabled",true);

    clearPeer(function()
    {
      started = false;


      //возвращаем активность кнопкам
      $("[name=mySex]").prop('disabled', false);
      $("[name=yourSex]").prop('disabled', false);
      $("[name=country]").prop('disabled', false);
      $("[name=startChatBtn]").prop('disabled', false);
      $("[name=stopChatBtn]").prop('disabled', true);

    });
  }


  function nextChat()
  {
    remoteVideo.src = "";
    $(".infoMsg2").html("Finding...");
    $(".infoMsg2").css("z-index",100);
    if(pc)
    {    
      pc.close();
      pc = null;
    }

    // initialize();
    clearInterval(chatGetMessageTimer);
    $(".chatInput").prop("disabled",true);
    $(".chatSendBtn").prop("disabled",true);


    clearPeer(function()
    {
      started = false;
      $(".chatLog").html("");
      openChannel(function(data)
      {
          // Caller creates PeerConnection.
          if(data =="offer")initiator=true;
          else if(data=="answer")initiator=false;
          maybeStart();
      });
    });

  }


  //utils
  // возвращает cookie с именем name, если есть, если нет, то undefined
  function getCookie(name){
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }


  function setCookie(name, value, options) {
    // console.log("setCookie",name,value);
  options = options || {};

  var expires = options.expires;

  if (typeof expires == "number" && expires) {
    var d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);

  var updatedCookie = name + "=" + value;

  for (var propName in options) {
    updatedCookie += "; " + propName;
    var propValue = options[propName];
    if (propValue !== true) {
      updatedCookie += "=" + propValue;
    }
  }

  document.cookie = updatedCookie;
}