from __future__ import unicode_literals
import frappe
import frappe.utils
import json
import datetime
import pytz
from frappe import _
import requests
from frappe.utils import cstr, encode
from cryptography.fernet import Fernet, InvalidToken

no_cache = 1
no_sitemap = 1

def get_context(context):
	try:
		go1_recruit_settings = frappe.get_single('Go1 Recruit Settings')
		token = frappe.form_dict.token
		# frappe.log_error("Token",frappe.form_dict.token)
		context.token = token

		candidate_details = get_candidate_details(token)
		context.user_video = context.screen_sharing = 0

		if candidate_details:
			frappe.local.login_manager.user = candidate_details[0].candidate_email
			frappe.local.login_manager.post_login()
			context.details = candidate_details
			handle_monitored_test(context, candidate_details, go1_recruit_settings)
			handle_test_timing(context, candidate_details)
		else:
			frappe.local.flags.redirect_location = "/404.html"
			raise frappe.Redirect
	except Exception:
		frappe.log_error(message=frappe.get_traceback(), title="interview get_context")


def get_candidate_details(token):
	encrypted_url = '{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), token)
	return frappe.db.sql('''
		SELECT name, questionpaper_id, meeting_id, questionpaper_name, candidate_name, candidate_email, 
		test_attempted, time_zone, start_time, end_time, duration_minutes, subject_name, monitored_test, zoom_url 
		FROM `tabQuestion Paper Candidates` 
		WHERE encrypted_url=%(encrypted_url)s
	''', {'encrypted_url': encrypted_url}, as_dict=1)


def handle_monitored_test(context, candidate_details, go1_recruit_settings):
	if candidate_details[0].monitored_test == 1:
		context.monitored = "true"
		context.instructions = go1_recruit_settings.test_instructions
	else:
		context.monitored = "false"
		context.unmonitored_instructions = go1_recruit_settings.unmonitored_test_instructions


def handle_test_timing(context, candidate_details):
	if candidate_details[0].test_attempted == 0:
		current_datetime = get_current_time(candidate_details[0].time_zone)
		if is_test_active(current_datetime, candidate_details):
			start_test(context, candidate_details)
		elif current_datetime < candidate_details[0].start_time:
			context.start_test = _("Interview test has not yet started and will start at the time that was specified.")
		elif current_datetime > candidate_details[0].end_time:
			context.start_test = _("The interview test time has expired. Please contact the employer who scheduled the test.")
	else:
		context.start_test = _("This interview test is no longer available.")


def get_current_time(time_zone):
	return datetime.datetime.now(pytz.timezone(time_zone)).replace(tzinfo=None, microsecond=0)


def is_test_active(current_datetime, candidate_details):
	return candidate_details[0].start_time <= current_datetime <= candidate_details[0].end_time


def start_test(context, candidate_details):
	context.start_test = "true"
	if candidate_details[0].monitored_test == 1:
		context.user_video, context.screen_sharing = frappe.db.get_value(
			'Question Paper Candidates', 
			candidate_details[0].name, 
			['candidate_video', 'record_screen']
		)