RecordVideo = Class.extend({
	init: function(opts){
		this.$video = opts.video;
        this.record_video = opts.record_video;
		this.recorder;
		this.filename = opts.filename;
		this.file_url;
		this.doctype = opts.doctype;
		this.fieldname = opts.fieldname;
		this.docname;

		this.make();
	},
	make: function(){
        let controls = '';
        if(this.record_video)
            controls = "controls";
		$(`<video ${controls} autoplay playsinline></video><input type="hidden" name="hdnVideoPath" />`).appendTo(this.$video);
		this.video = this.$video.querySelector('video')
		this.start_video();
	},
	start_video: function(){
		let me = this;
		this.captureCamera(function(camera) {
	        me.video.muted = true;
	        me.video.volume = 0;
	        me.video.srcObject = camera;
            me.recorder = RecordRTC(camera, {
                type: 'video'
            });
            me.recorder.startRecording();
            // release camera on stopRecording
            me.recorder.camera = camera;    	        
	    });
	},
	captureCamera: function(callback){
		navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(camera) {
	        callback(camera);
	    }).catch(function(error) {
	        alert('Unable to capture your camera. Please check console logs.');
	        console.error(error);
	    });
	},
	stopRecordingCallback: function(){
		// this.video.src = this.video.srcObject = null;
	    // this.video.muted = false;
	    // this.video.volume = 1;
	    // this.video.src = URL.createObjectURL(this.recorder.getBlob());
        this.recorder.camera.stop();
	    if(this.record_video){            
            this.get_video_file();
        }	    	    
	},
	stop_video_recording: function(){
		let me = this;
		this.recorder.stopRecording(()=> {me.stopRecordingCallback()});
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
                    $(me.$video).find('input[name=hdnVideoPath]').val(file_doc.file_url);
                    me.file_url = file_doc.file_url;
                } else {

                }
            }
        }
        xhr.send(form_data);
    }
})