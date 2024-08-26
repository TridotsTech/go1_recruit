from __future__ import unicode_literals
import frappe
import datetime
import pytz
from datetime import datetime

def get_context(context):
	token = frappe.form_dict.token
	if not token:
		frappe.local.flags.redirect_location = "/404.html"
		raise frappe.Redirect
	check_test = frappe.db.get_all('Video Conference Participant', filters={'encrypted_url': token}, fields=['*'])
	if check_test:
		current_datetime = datetime.now()
		starting_time = check_test[0].starting_time
		ending_time = check_test[0].ending_time
		if current_datetime >= starting_time and current_datetime <= ending_time:
			context.subject = check_test[0].subject
			context.room_id = check_test[0].video_conference_room
			context.email = check_test[0].email
			context.starting_time = check_test[0].starting_time
			context.ending_time = check_test[0].ending_time
			# context.password = check_test[0].password
		else:
			frappe.local.flags.redirect_location = "/conference_timing.html"
			raise frappe.Redirect
	else:
		frappe.local.flags.redirect_location = "/404.html"
		raise frappe.Redirect