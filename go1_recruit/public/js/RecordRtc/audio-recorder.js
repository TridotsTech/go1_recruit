RecordAudio = Class.extend({
    init: function(opts) {
        this.$audio = opts.audio;
        this.filename = opts.filename;
        this.microphone;
        this.recorder;
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        this.isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
        this.doctype = opts.doctype;
		this.fieldname = opts.fieldname || null;
        this.show_time_duration = false;
        if(opts.show_time_duration == true){
            this.show_time_duration = true;
        }
		this.docname;
        this.recording_stopped = 0;
        this.make();
    },
    make: function() {
        let me = this;
        $(`<div><audio controls autoplay playsinline class="hidden"></audio></div>`).appendTo(this.$audio);
        $(`<div class="recording" style="display: inline-flex;margin: 10px;">
                <span class="hidden rec-img"><img src="/assets/go1_recruit/images/record.gif" style="height: 70px" /></span>
                <span class="recording-status" style="margin: 12px;"></span>
           </div>
           <div>
				<button class="record-btn btn">Record Now</button>				
				<button class="upload-btn hidden btn"><span class="fa fa-upload"></span> Submit</button>
				<button class="discard-btn hidden btn"><span class="fa fa-times"></span> Discard & Record New</button>
				<button class="stop-btn hidden btn"><span class="fa fa-times"></span> Stop Recording</button>
				<input type="hidden" name="hdnAudioFilePath" />
			</div>
			<div class="success-msg hidden">
				<span class="fa fa-check"></span> File Uploaded Successfully!
				<input type="file" class="hidden" />
			</div>`).appendTo(this.$audio);
        this.$record_btn = $(this.$audio).find('.record-btn').click(() => {
            this.start_record()
        });
        this.$audio_control = this.$audio.querySelector('audio');
        this.$upload_btn = $(this.$audio).find('.upload-btn').click(() => {
            this.upload_recorded()
        });
        this.$discard_btn = $(this.$audio).find('.discard-btn').click(() => {
            this.discard_recording()
        });
        this.$stop_btn = $(this.$audio).find('.stop-btn').click(() => {
            this.stop_recording()
        });
        this.$success = $(this.$audio).find('.success-msg');
        this.$recordedDuration = $(this.$audio).find('.recording-status');
        this.$recordingDiv = $(this.$audio).find('.recording');
    },
    start_record: function() {
        this.$record_btn.addClass('hidden');
        $(this.$audio_control).removeClass('hidden');
        this.$stop_btn.removeClass('hidden');
        this.$record_btn.hide();
        this.start_record_audio();        
    },
    upload_recorded: function() {
        // $(this.$audio_control).addClass('hidden');
        this.$upload_btn.addClass('hidden');
        this.$discard_btn.addClass('hidden');
        this.get_audio_file();
    },
    discard_recording: function() {
        var newAudio = document.createElement('audio');
        newAudio.controls = false;
        newAudio.autoplay = false;
        var parentNode = this.$audio_control.parentNode;
        parentNode.innerHTML = '';
        parentNode.appendChild(newAudio);
        this.$audio_control = newAudio;
        this.$record_btn.removeClass('hidden');
        $(this.$audio_control).removeClass('hidden');
        this.$stop_btn.addClass('hidden');
        this.$upload_btn.addClass('hidden');
        this.$discard_btn.addClass('hidden');
        this.$record_btn.show();
        this.$recordingDiv.find('.rec-img').addClass('hidden');
        this.$recordedDuration.addClass('hidden');
        this.recording_stopped = 0;
    },
    stop_recording: function() {
        let me = this;
        this.$stop_btn.addClass('hidden');
        this.$upload_btn.removeClass('hidden');
        this.$discard_btn.removeClass('hidden');
        this.$recordingDiv.find('.rec-img').addClass('hidden');
        this.$recordedDuration.addClass('hidden');
        this.recorder.stopRecording(() => { me.stopRecordingCallback() });
    },
    captureMicrophone: function(callback) {
        let me = this;
        if (me.microphone) {
            callback(me.microphone);
            return;
        }
        if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
            alert('This browser does not supports WebRTC getUserMedia API.');
            if (!!navigator.getUserMedia) {
                alert('This browser seems supporting deprecated getUserMedia API.');
            }
        }
        navigator.mediaDevices.getUserMedia({
            audio: me.isEdge ? true : {
                echoCancellation: false
            }
        }).then(function(mic) {
            callback(mic);
        }).catch(function(error) {
            alert('Unable to capture your microphone. Please check console logs.');
            console.error(error);
        });
    },
    replaceAudio: function(src) {
        var newAudio = document.createElement('audio');        
        newAudio.autoplay = false;
        if (src) {
            newAudio.src = src;
            newAudio.controls = true;
        }

        var parentNode = this.$audio_control.parentNode;
        parentNode.innerHTML = '';
        parentNode.appendChild(newAudio);
        this.$audio_control = newAudio;
    },
    stopRecordingCallback: function() {
        let me = this;
        this.replaceAudio(URL.createObjectURL(me.recorder.getBlob()));
        setTimeout(function() {
            if (!me.$audio_control.paused) return;
            setTimeout(function() {
                if (!me.$audio_control.paused) return;
                me.$audio_control.play();
            }, 1000);

            me.$audio_control.play();
        }, 300);
        this.$audio_control.play();
        this.recording_stopped = 1;
        if (this.isSafari) {
            // this.click(btnReleaseMicrophone);
        }
    },
    start_record_audio: function() {
        let me = this;
        if (!this.microphone) {
            me.captureMicrophone(function(mic) {
                me.microphone = mic;
                if (me.isSafari) {
                    me.replaceAudio();
                    me.$audio_control.muted = true;
                    me.$audio_control.srcObject = microphone;
                    alert('Please click startRecording button again. First time we tried to access your microphone. Now we will record it.');
                    return;
                }
                me.ev_click(me.$record_btn[0]);
            });
            return;
        }
        this.replaceAudio();
        this.$audio_control.muted = true;
        this.$audio_control.srcObject = this.microphone;
        var options = {
            type: 'audio',
            numberOfAudioChannels: this.isEdge ? 1 : 2,
            checkForInactiveTracks: true,
            bufferSize: 16384
        };
        if (this.isSafari || this.isEdge) {
            options.recorderType = StereoAudioRecorder;
        }
        if (navigator.platform && navigator.platform.toString().toLowerCase().indexOf('win') === -1) {
            options.sampleRate = 48000; // or 44100 or remove this line for default
        }
        if (this.isSafari) {
            options.sampleRate = 44100;
            options.bufferSize = 4096;
            options.numberOfAudioChannels = 2;
        }
        if (this.recorder) {
            this.recorder.destroy();
            this.recorder = null;
        }
        this.recorder = RecordRTC(this.microphone, options);
        this.recorder.startRecording();
        if(this.show_time_duration){
            this.$recordingDiv.find('.rec-img').removeClass('hidden');
            this.$recordedDuration.removeClass('hidden');
            this.show_duration()
        }
    },
    ev_click: function(el) {
        el.disabled = false; // make sure that element is not disabled
        var evt = document.createEvent('Event');
        evt.initEvent('click', true, true);
        el.dispatchEvent(evt);
    },
    get_audio_file: function() {
        var blob = this.recorder.getBlob();
        var fileName = this.getFileName('mp3');
        var fileObject = new File([blob], fileName, {
            type: 'audio/webm'
        });
        // this.$audio.find('input[type=file]').prop('files', fileObject)
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
        if(me.doctype)
            form_data.append('doctype', me.doctype);
        if(me.docname)
            form_data.append('docname', me.docname);
        if(me.fieldname)
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
                    $(me.$audio).find('input[name=hdnAudioFilePath]').val(file_doc.file_url);
                    me.$success.removeClass('hidden')
                } else {

                }
            }
        }
        xhr.send(form_data);
    },
    show_duration: function(){
        let dateStarted = new Date().getTime();
        this.looper(dateStarted);
    },
    looper: function(dateStarted){
        let me = this;
        if(!me.recorder) {
            return;
        }
        // me.$recordedDuration.innerHTML = ""
        me.$recordedDuration.text(me.calculateTimeDuration((new Date().getTime() - dateStarted) / 1000));
        setTimeout(function(){
            if(!me.recording_stopped)
                me.looper(dateStarted);
        }, 1000);
    },
    calculateTimeDuration: function(secs){
        var hr = Math.floor(secs / 3600);
        var min = Math.floor((secs - (hr * 3600)) / 60);
        var sec = Math.floor(secs - (hr * 3600) - (min * 60));
        if (min < 10) {
            min = "0" + min;
        }
        if (sec < 10) {
            sec = "0" + sec;
        }
        if(hr <= 0) {
            return min + ':' + sec;
        }
        return hr + ':' + min + ':' + sec;
    }
})