RecordScreen = Class.extend({
	init: function(opts){
		this.$share = opts.share;
		this.recorder;
		this.file_url;
		this.filename = opts.filename;
		this.doctype = opts.doctype;
		this.fieldname = opts.fieldname;
		this.docname;

		this.check_requirements();
		this.make();
	},
	check_requirements: function(){
		if(!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
		    throw new Error('Your browser does NOT support the getDisplayMedia API.');
		}
	},
	make: function(){
		$(`<video controls autoplay playsinline></video><input type="hidden" name="hdnScreenVideoPath" />`).appendTo(this.$share);
		this.video = this.$share.querySelector('video')
		this.start_video();
	},
	invokeGetDisplayMedia: function(success, error){
		var displaymediastreamconstraints = {
	        video: {
	            displaySurface: 'monitor', // monitor, window, application, browser
	            logicalSurface: true,
	            cursor: 'always' // never, always, motion
	        }
	    };
	    // above constraints are NOT supported YET
	    // that's why overridnig them
	    displaymediastreamconstraints = {
	        video: {
	        	madatory: {
	        		chromeMediaSource: 'screen'
	        	}
	        }
	    };
	    if(navigator.mediaDevices.getDisplayMedia) {
	        navigator.mediaDevices.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
	    }
	    else {
	        navigator.getDisplayMedia(displaymediastreamconstraints).then(success).catch(error);
	    }
	},
	captureScreen: function(callback){
		let me = this;
		this.invokeGetDisplayMedia(function(screen) {
	        me.addStreamStopListener(screen, function() {
	            me.stop_recording();
	        });
	        callback(screen);
	    }, function(error) {
	        console.error(error);
	        alert('Unable to capture your screen. Please check console logs.\n' + error);
	    });
	},
	stopRecordingCallback: function(){
		let me = this;
		// this.video.src = this.video.srcObject = null;
	 //    this.video.src = URL.createObjectURL(me.recorder.getBlob());
	    
	    this.recorder.screen.stop();
	    this.get_video_file();	    
	},
	start_video: function(){
		let me = this;
		this.captureScreen(function(screen) {
	        me.video.srcObject = screen;
	        me.recorder = RecordRTC(screen, {
	            type: 'video'
	        });
	        me.recorder.startRecording();
	        // release screen on stopRecording
	        me.recorder.screen = screen;
	    });
	},
	stop_recording: function(){
		this.recorder.stopRecording(()=>{this.stopRecordingCallback()});		
	},
	addStreamStopListener: function(stream, callback){
		stream.addEventListener('ended', function() {
	        callback();
	        callback = function() {};
	    }, false);
	    stream.addEventListener('inactive', function() {
	        callback();
	        callback = function() {};
	    }, false);
	    stream.getTracks().forEach(function(track) {
	        track.addEventListener('ended', function() {
	            callback();
	            callback = function() {};
	        }, false);
	        track.addEventListener('inactive', function() {
	            callback();
	            callback = function() {};
	        }, false);
	    });
	},
	get_video_file: function(){
		var blob = this.recorder.getBlob();
        var fileName = this.getFileName('mp4');
        var fileObject = new File([blob], fileName, {
            type: 'video/mp4'
        });
        // this.recorder.destroy();
	    // this.recorder = null;
        this.upload_to_server(fileObject);
	},
	getFileName: function(extn) {
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth();
        var date = d.getDate();
        return (this.filename || 'RecordRTC-') + year + month + date + '-' + this.getRandomString() + '.' + extn;
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
    },
	upload_to_server: function(file) {
        let me = this;
        let form_data = new FormData();
        form_data.append('file', file, file.name)
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/method/upload_file', true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Frappe-CSRF-Token', frappe.csrf_token);
        form_data.append('is_private', 1);
        form_data.append('ignore_filetype', 1);
        form_data.append('doctype', me.doctype);
        form_data.append('docname', me.docname);
        form_data.append('fieldname', me.fieldname);
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
                    $(me.$share).find('input[name=hdnScreenVideoPath]').val(file_doc.file_url);
                    me.file_url = file_doc.file_url;
                } else {

                }
            }
        }
        xhr.send(form_data);
    }
})