$(document).ready(function() {
    var user_email = '{{ user_email }}';
    var roomid = '{{ room_id }}';
    var conference;
    var count = 1;
	console.log('{{ user_email }}')
    // Initialize the connection
    initSocketConnection();

    $('#join-room').click(function() {
        joinRoom();
    });

    // Function to initialize socket connection
    function initSocketConnection() {
        frappe.socketio = io.connect(frappe.socketio.get_host(9000), { secure: true });
        frappe.socketio.on('room-created', function(room_id) {
            autoConnectRoom(room_id);
            isRoomExist = 1;
        });
        frappe.socketio.on('room-connected', function() {
            showVideoSection();
			removeLoader()
        });
    }

    // Function to join the room
    function joinRoom() {
        conference.username = user_email;
        conference.connection.socket.emit('room-created', roomid);
        autoConnectRoom(conference.roomid);
        $('#join-room').prop('disabled', true);
    }

    // Function to auto connect to the room
    function autoConnectRoom(room_id) {
		console.log(room_id)
		console.log(roomid)
        if (room_id === roomid) {
			console.log(isRoomExist)
            isRoomExist = 1;
            conference.join_room(isRoomExist);
        }
    }

    // Function to show the video section
    function showVideoSection() {
        $('#info-section').slideUp();
        $('#videos-section').show();
    }

    // Function to handle room empty
    function roomEmpty() {
        $('#not-available').show();
    }

    // Function to remove loader
    function removeLoader() {
        $('.loader').hide();
    }

    // Function to handle room closed
    function roomClosed() {
        if (count === 1) {
            count++;
            conference.leave_room();
        }
        setTimeout(function() {
            $('.test-completed').show();
        }, 1000);
    }

    // Function to evaluate the test
    function evaluateTest() {
        frappe.call({
            method: 'go1_recruit.templates.pages.monitortest.get_result_id',
            args: {
                candidate: '{{exam_info.candidate_email}}',
                exam_id: '{{exam_info.questionpaper_id}}'
            },
            callback: function(r) {
                if (r.message) {
                    window.location.href = '/desk#Form/Exam Result/' + r.message;
                }
            }
        });
    }

    // Initialize conference
    function initConference() {
        conference = new RTCConference({
            videosContainer: document.getElementById('videos-container'),
            remoteVideosContainer: document.getElementById('remote-videos-container'),
            recordConference: false,
            roomid: roomid,
            enable_video: true,
            auto_join: true,
            show_user_screen_sharing: true,
            show_remote_users_media: true,
            enable_option_buttons: true,
            allow_open_room: false
        });

        conference.connection.errors.ROOM_NOT_AVAILABLE = "Candidate hasn't started the test yet. Please wait until the candidate starts their test.";
        conference.connection.errors.ROOM_FULL = "Only one interviewer can see the candidate's test.";
    }

    // Generate random ID
    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    initConference();
});
