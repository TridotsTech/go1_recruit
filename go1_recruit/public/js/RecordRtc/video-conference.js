RTCConference = Class.extend({
    init: function(opts) {
        this.videosContainer = opts.videosContainer;
        this.remoteVideosContainer = opts.remoteVideosContainer;
        this.recordConference = opts.recordConference;
        this.roomid = opts.roomid;
        this.filename = opts.filename;
        this.video_filename = (opts.video_filename || 'Video');
        this.screen_filename = (opts.screen_filename || 'Screen');
        this.doctype = (opts.doctype || null);
        this.docname = (opts.docname || null);
        this.fieldname = (opts.fieldname || null);
        this.video_fieldname = (opts.video_fieldname || null);
        this.screen_fieldname = (opts.screen_fieldname || null);
        this.userid = opts.userid;
        this.username = opts.username;
        this.enable_video = this.screen_share = this.auto_join = this.record_seperately = this.enable_audio = false
        this.show_remote_users_media = this.enable_option_buttons = true
        this.show_user_screen_sharing = this.allow_open_room = true
        if (opts.enable_video == true) {
            this.enable_video = true;
            
            
        }
        if (opts.enable_audio == true) {
            this.enable_audio = true
        }
        if (opts.screen_share == true) {
            this.screen_share = true;
            
        }
        if (opts.auto_join == true) {
			this.auto_join = true
        }
        if (opts.record_seperately == true) {
            this.record_seperately = true
        }
        if (opts.show_remote_users_media == true || opts.show_remote_users_media == false) {
            this.show_remote_users_media = opts.show_remote_users_media
        }
        if (opts.show_user_screen_sharing == true || opts.show_user_screen_sharing == false) {
            this.show_user_screen_sharing = opts.show_user_screen_sharing
        }
        if (opts.enable_option_buttons == true || opts.enable_option_buttons == false) {
            this.enable_option_buttons = opts.enable_option_buttons
        }
        // if (opts.allow_open_room == true || opts.allow_open_room == false) {
        //     this.allow_open_room = opts.allow_open_room
        // }

        this.create_connection()
    },
    create_connection: function() {
        let me = this;
        // this.getUserMedia();
        this.connection = new RTCMultiConnection();
        this.connection.socketURL = '/';
        if (this.username)
            this.connection.extra.full_name = this.username;
        let session = {};
        if (this.enable_video) {
            session.video = true;
            session.audio = true;
            me.enable_video_share();
        } else if (this.enable_audio) {
            session.audio = true;
            session.video = false;
        }
        if (this.screen_share) {
            session.screen = true;
            session.oneway = true;
            me.share_user_screen();
        }
        this.connection.session = session;
        this.connection.sdpConstraints.mandatory = {
            OfferToReceiveVideo: true,
            OfferToReceiveAudio: true
        }
        this.connection.maxParticipantsAllowed = 21;
        this.connection.connectSocket(function(socket) {
            socket.emit('connect-rtc');
        });
        this.connection.videosContainer = this.videosContainer;
        this.connection.remoteVideosContainer = this.remoteVideosContainer;
        this.connection.onleave = function(event) {
            me.on_leave(event)
        }
        this.connection.onstream = function(event) {
            me.onstream(event)
        }
        this.connection.onstreamended = function(event) {
            var mediaElement = document.getElementById(event.streamid);
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement);
            }
        }
        this.connection.onMediaError = function(e) {
            if (e.message === 'Concurrent mic process limit.') {
                if (DetectRTC.audioInputDevices.length <= 1) {
                    alert('Please select external microphone.');
                    return;
                }
                var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
                me.connection.mediaConstraints.audio = {
                    deviceId: secondaryMic
                };
                me.connection.join(me.connection.sessionid);
            }
        }
        // this.sdpconstraints();
        // this.bandwidthHandler();
        if (this.auto_join)
        {
            console.log("=========kkkkkk")
            this.join_room()
        }
    },
    getUserMedia: function(){
        var videoConstraints = {
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    minWidth: 1280,
                    minHeight: 720,

                    maxWidth: 1920,
                    maxHeight: 1080,

                    // minFrameRate: 3,
                    // maxFrameRate: 32,

                    minAspectRatio: 1.77
                }
            },
            audio: true
        };
        navigator.getUserMedia(videoConstraints, function(){
            console.log('captured');
        }, function(error){
            console.log(error);
        });
    },
    sdpconstraints: function() {
        let me = this;
        this.videoConstraints = {};
        this.bitrates = 512;
        // this.bitrates = this.connection.bandwidth.video;
        let resolutions = 'Ultra-HD';
        if (resolutions == 'HD') {
            this.videoConstraints = {
                width: { exact: 1280 },
                height: { exact: 720 },
                frameRate: 30
            }
        } else if (resolutions == 'Ultra-HD') {
            this.videoConstraints = {
                width: { exact: 1920 },
                height: { exact: 1080 },
                frameRate: 30
            }
        }
        this.connection.mediaConstraints = {
            video: me.videoConstraints,
            audio: true
        }
        var CodecsHandler = this.connection.CodecsHandler;
        this.connection.processSdp = function(sdp) {
            var codecs = 'vp8';
            if (codecs.length) {
                sdp = CodecsHandler.preferCodec(sdp, codecs.toLowerCase());
            }
            if (resolutions == 'HD') {
                sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, {
                    audio: 128,
                    video: bitrates,
                    screen: bitrates
                });
                sdp = CodecsHandler.setVideoBitrates(sdp, {
                    min: bitrates * 8 * 1024,
                    max: bitrates * 8 * 1024,
                });
            } else if (resolutions == 'Ultra-HD') {
                sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, {
                    audio: 128,
                    video: bitrates,
                    screen: bitrates
                });
                sdp = CodecsHandler.setVideoBitrates(sdp, {
                    min: bitrates * 8 * 1024,
                    max: bitrates * 8 * 1024,
                });
            }
            return sdp;
        };
        this.connection.iceServers = [{
            'urls': [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        },
		{
			urls: 'stun:muazkhan.com:3478',
			credential: 'muazkh',
			username: 'hkzaum'
		},
		{
			urls: 'turns:muazkhan.com:5349',
			credential: 'muazkh',
			username: 'hkzaum'
		},
		{
			urls: 'turn:muazkhan.com:3478',
			credential: 'muazkh',
			username: 'hkzaum'
		},
		{
			urls: "turn:relay1.expressturn.com:3478",
			username: "efVWR487CA3U7HKYH5",
			credential: "B1jbhoibFjfFWQ5o",
		}
	];
    },
    bandwidthHandler: function() {
        let me = this;
        var BandwidthHandler = this.connection.BandwidthHandler;
        this.connection.bandwidth = {
            audio: 128,
            video: 256,
            screen: 300
        };
        this.connection.processSdp = function(sdp) {
            sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, me.connection.bandwidth, !!me.connection.session.screen);
            sdp = BandwidthHandler.setVideoBitrates(sdp, {
                min: me.connection.bandwidth.video,
                max: me.connection.bandwidth.video
            });

            sdp = BandwidthHandler.setOpusAttributes(sdp);

            sdp = BandwidthHandler.setOpusAttributes(sdp, {
                'stereo': 1,
                //'sprop-stereo': 1,
                'maxaveragebitrate': me.connection.bandwidth.audio * 1000 * 8,
                'maxplaybackrate': me.connection.bandwidth.audio * 1000 * 8,
                //'cbr': 1,
                //'useinbandfec': 1,
                // 'usedtx': 1,
                'maxptime': 3
            });

            return sdp;
        };
    },



    join_room: function() {
        let me = this;
        if (this.userid)
		this.connection.userid = this.userid;
        if (this.username) {
			this.connection.extra.full_name = this.username;
            this.connection.updateExtraData();
        }
		
        this.connection.checkPresence(me.roomid, function(isRoomExist, roomid, error) {
			
			if (isRoomExist === true) {
				me.connection.join(roomid, function(isRoomJoined, roomid, error) {
					if (isRoomJoined) {
						console.log(isRoomJoined)
                        try {
							room_connected()
                        } catch (e) {console.log(e)}
                    }
                });

            } else {

				if (me.allow_open_room) {
					
					me.connection.open(roomid, function(isRoomOpened, roomid, error) {
						if (isRoomOpened) {
							console.log(isRoomOpened)
                            me.connection.socket.emit('room-created', me.roomid);
                        }
                        if(error){
                            console.log(error)
                        }
                    });
                } else {
                    try { roomempty() } catch (e) {console.log(e)}
                    frappe.msgprint(me.connection.errors.ROOM_NOT_AVAILABLE, 'Alert');
                }
            }
        })
    },
    onstream: function(event) {
        let me = this;
        var existing = document.getElementById(event.streamid);
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
        event.mediaElement.removeAttribute('src');
        event.mediaElement.removeAttribute('srcObject');
        event.mediaElement.muted = true;
        event.mediaElement.volume = 0;
        var video = document.createElement('video');
        try {
            video.setAttributeNode(document.createAttribute('autoplay'));
            video.setAttributeNode(document.createAttribute('playsinline'));
        } catch (e) {
            video.setAttribute('autoplay', true);
            video.setAttribute('playsinline', true);
        }

        if (event.type === 'local') {
            video.volume = 0;
            try {
                video.setAttributeNode(document.createAttribute('muted'));
            } catch (e) {
                video.setAttribute('muted', true);
            }
            localScreenId = event.streamid;
        }
        video.srcObject = event.stream;
        if (event.type == 'local') {
            this.construct_html(event, video)
        }

        if (event.type === 'remote') {
            let title = me.username;
            if (!title) {
                if (event.extra && event.extra.full_name)
                    title = event.extra.full_name;
                else
                    title = "";
            }
            var width = parseInt(this.connection.remoteVideosContainer.clientWidth / 2) - 20;
            var mediaElement = getHTMLMediaElement(video, {
                title: title,
                buttons: ['full-screen'],
                width: width,
                showOnMouseEnter: false
            });
            try { removeloader() } catch (e) {}
            if (this.show_remote_users_media)
                this.connection.remoteVideosContainer.appendChild(mediaElement);
            setTimeout(function() {
                mediaElement.media.play();
            }, 5000);
            mediaElement.id = event.streamid;
        }
        if (event.type == 'local' && this.recordConference) {
            this.record_conference(event)
        }
        if (event.type === 'local') {
            me.connection.socket.on('disconnect', function() {
                if (!me.connection.getAllParticipants().length) {
                    // location.reload();
                }
            });
        }
    },
    construct_html: function(event, video) {
        let me = this;
        var buttons = ['full-screen'];
        let show_media = true;
        if (JSON.parse(event.stream.idInstance).isScreen) {
            if (!this.show_user_screen_sharing)
                show_media = false;
            try {
                start_timer();
            } catch (e) {}
        } else {
            buttons.push('mute-audio')
            buttons.push('mute-video')
        }
        if (!this.enable_option_buttons) {
            buttons = [];
        }
        let clientWidth = this.connection.videosContainer.clientWidth
        if (this.connection.videosContainer.clientWidth == 0) {
            clientWidth = 200
        }
        var width = parseInt(clientWidth) - 20;
        let title = me.username;
        if (!title)
            title = '';
        var mediaElement = getHTMLMediaElement(video, {
            title: title,
            buttons: buttons,
            width: width,
            showOnMouseEnter: false,
            onUnMuted: function(param) {
                var stream = me.connection.streamEvents[event.streamid].stream;
                stream.unmute(param);
            },
            onMuted: function(param) {
                var stream = me.connection.streamEvents[event.streamid].stream;
                stream.mute(param);
            },
            onStopped: function() {
                var stream = me.connection.streamEvents[event.streamid].stream;
                stream.stop();
            }
        });
        if (show_media)
            me.connection.videosContainer.appendChild(mediaElement);
        setTimeout(function() {
            mediaElement.media.play();
        }, 5000);
        mediaElement.id = event.streamid;
    },
    enable_video_share: function() {
        let me = this;
        this.connection.mediaConstraints.screen = true;
        this.connection.addStream({
            audio: true,
            video: true
        })
    },
    share_user_screen: function() {
        let me = this;
        this.connection.mediaConstraints.screen = true;
        this.connection.addStream({
            screen: true,
            oneway: true,
            streamCallback: function(screen) {
                me.addStreamStopListener(screen, function() {
                    me.connection.send({
                        screenEnded: true,
                        streamid: screen.id
                    });

                    var video = document.getElementById(screen.id);
                    if (video && video.parentNode) {
                        video.parentNode.removeChild(video);
                    }
                })
            }
        })
    },
    share_user_camera: function() {
        let me = this;
        this.connection.mediaConstraints.screen = true;
        this.connection.addStream({
            video: true,
            audio: true
        });
    },
    addStreamStopListener: function(stream, callback) {
        var streamEndedEvent = 'ended';
        if ('oninactive' in stream) {
            streamEndedEvent = 'inactive';
        }
        stream.addEventListener(streamEndedEvent, function() {
            callback();
            callback = function() {};
        }, false);
        stream.getAudioTracks().forEach(function(track) {
            track.addEventListener(streamEndedEvent, function() {
                callback();
                callback = function() {};
            }, false);
        });
        stream.getVideoTracks().forEach(function(track) {
            track.addEventListener(streamEndedEvent, function() {
                callback();
                callback = function() {};
            }, false);
        });
    },
    record_conference: function(event) {
        if (JSON.parse(event.stream.idInstance).isScreen) {
            type = 'screen'
        } else {
            type = 'video'
        }
        if (this.record_seperately) {
            if (type == 'screen')
                var recorder = this.connection.screen_recorder;
            else
                var recorder = this.connection.video_recorder;
        } else {
            var recorder = this.connection.recorder;
        }
        if (!recorder) {
            recorder = RecordRTC([event.stream], {
                type: 'video'
            });
            recorder.startRecording();
            if (this.record_seperately) {
                if (type == 'screen')
                    this.connection.screen_recorder = recorder;
                else
                    this.connection.video_recorder = recorder;
            } else {
                this.connection.recorder = recorder;
            }
        } else {
            recorder.getInternalRecorder().addStreams([event.stream]);
        }
        if (this.record_seperately) {
            if (type == 'screen') {
                if (!this.connection.screen_recorder.streams) {
                    this.connection.screen_recorder.streams = [];
                }
                this.connection.screen_recorder.streams.push(event.stream);
            } else {
                if (!this.connection.video_recorder.streams) {
                    this.connection.video_recorder.streams = [];
                }
                this.connection.video_recorder.streams.push(event.stream);
            }
        } else {
            if (!this.connection.recorder.streams) {
                this.connection.recorder.streams = [];
            }
            this.connection.recorder.streams.push(event.stream);
        }
    },
    leave_room: function() {
        // disconnect with all users
        let me = this;
        this.connection.getAllParticipants().forEach(function(pid) {
            me.connection.disconnectWith(pid);
        });

        if (!this.connection.getAllParticipants().length) {
            this.stop_recording();
            // try{ roomclosed() } catch(e){}
        }

        // stop all local cameras
        this.connection.attachStreams.forEach(function(localStream) {
            localStream.stop();
        });

        // close socket.io connection
        this.connection.closeSocket();
    },
    on_leave: function(event) {
        let me = this;
        if (this.connection.userid == event.userid && this.recordConference) {
            this.stop_recording();
        } else {
            try { roomclosed() } catch (e) {}
        }
    },
    stop_recording: function() {
        let me = this;
        var recorder = me.connection.recorder;
        if (recorder) {
            recorder.stopRecording(function() {
                var blob = recorder.getBlob();
                me.connection.recorder = null;
                me.upload_blob(blob, me.filename, me.fieldname)
            });
        }
        var recorder1 = me.connection.screen_recorder;
        if (recorder1) {
            recorder1.stopRecording(function() {
                var blob = recorder1.getBlob();
                me.connection.recorder1 = null;
                me.upload_blob(blob, me.screen_filename, me.screen_fieldname)
            });
        }
        var recorder2 = me.connection.video_recorder;
        if (recorder2) {
            recorder2.stopRecording(function() {
                var blob = recorder2.getBlob();
                me.connection.recorder2 = null;
                me.upload_blob(blob, me.video_filename, me.video_fieldname)
            });
        }
    },
    upload_blob: function(blob, fname, fieldname) {
        var filename = this.getFileName(fname, 'mp4');
        var fileObject = new File([blob], filename, {
            type: 'video/mp4'
        });
        let form_data = new FormData();
        form_data.append('file', fileObject, fileObject.name);
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/method/upload_file', true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Frappe-CSRF-Token', frappe.csrf_token);
        form_data.append('ignore_filetype', 1);
        form_data.append('is_private', 1);
        if (this.docname) {
            if (this.doctype)
                form_data.append('doctype', this.doctype)
            form_data.append('docname', this.docname)
            if (fieldname)
                form_data.append('fieldname', fieldname)
        }
        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    let r = null;
                    let file_doc = null;
                    try {
                        r = JSON.parse(xhr.responseText);
                        if (r.message.doctype === 'File') {
                            file_doc = r.message;
                        }
                    } catch (e) {
                        r = xhr.responseText;
                    }
                } else {

                }
            }
        }
        xhr.send(form_data);
    },
    getFileName: function(filename, extn) {
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth();
        var date = d.getDate();
        return filename + year + month + date + '-' + this.getRandomString() + '.' + extn;
    },
    getRandomString: function() {
        if (window.crypto && window.crypto.getRandomValues && navigator.userAgent.indexOf('Safari') === -1) {
            var a = window.crypto.getRandomValues(new Uint32Array(3)),
                token = '';
            for (var i = 0, l = a.length; i < l; i++) {
                token += a[i].toString(36);
            }
            return token;
        } else {
            return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
        }
    }
})