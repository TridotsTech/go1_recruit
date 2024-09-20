function webrtc_handlers(socket){
	socket.on('hello', ()=>{
		console.log('world!');
	});
}

module.exports = webrtc_handlers;