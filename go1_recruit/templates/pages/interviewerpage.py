from __future__ import unicode_literals
import frappe
import datetime
import pytz

def get_context(context):
	token = frappe.form_dict.token
	if not token:
		frappe.local.flags.redirect_location = "/404.html"
		raise frappe.Redirect
	url = '{0}/interviewerpage?token={1}'.format(frappe.utils.get_url(), token)
	check_test = frappe.db.get_all('Question Paper Candidates', filters={'interviewer_url': url}, fields=['*'])
	frappe.log_error("url",url)
	if check_test:
		if check_test[0].test_attempted:
			frappe.local.flags.redirect_location = "/test_attempted.html"
			raise frappe.Redirect
		current_datetime = datetime.datetime.now(pytz.timezone(check_test[0].time_zone)).replace(tzinfo=None, microsecond=0)
		if current_datetime >= check_test[0].start_time and current_datetime <= check_test[0].end_time:
			context.exam_info = check_test[0]
			context.room_id = check_test[0].name
			context.user_email = check_test[0].candidate_email
			context.monitored = 'true'
			context.user_video = 1
		else:
			frappe.local.flags.redirect_location = "/exam_timing.html"
			raise frappe.Redirect
	else:
		frappe.local.flags.redirect_location = "/404.html"
		raise frappe.Redirect

@frappe.whitelist(allow_guest=True)
def get_result_id(candidate, exam_id):
	result = frappe.db.get_all('Exam Result', filters={'user': candidate, 'exam_id': exam_id})
	if result:
		return result[0].name
