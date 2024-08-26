(function ($) {

	"use strict";
	
	$(window).on('load', function () {
		$('[data-loader="circle-side"]').fadeOut(); // will first fade out the loading animation
		$('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
		$('body').delay(350);
	});
	
	// tooltips
	 $('[data-toggle="tooltip"]').tooltip();
	
	  
	// Input field effect
	(function () {
		if (!String.prototype.trim) {
			(function () {
				// Make sure we trim BOM and NBSP
				var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
				String.prototype.trim = function () {
					return this.replace(rtrim, '');
				};
			})();
		}
		[].slice.call(document.querySelectorAll('input.input_field, textarea.input_field')).forEach(function (inputEl) {
			// in case the input is already filled..
			if (inputEl.value.trim() !== '') {
				classie.add(inputEl.parentNode, 'input--filled');
			}

			// events:
			inputEl.addEventListener('focus', onInputFocus);
			inputEl.addEventListener('blur', onInputBlur);
		});
		function onInputFocus(ev) {
			classie.add(ev.target.parentNode, 'input--filled');
		}
		function onInputBlur(ev) {
			if (ev.target.value.trim() === '') {
				classie.remove(ev.target.parentNode, 'input--filled');
			}
		}
	})();
	
	// Selectbox
	$(".selectbox").selectbox();

	// Check and radio input styles
	$('input.icheck').iCheck({
		checkboxClass: 'icheckbox_square-grey',
		radioClass: 'iradio_square-grey'
	});
	
})(window.jQuery); 