from __future__ import unicode_literals
import frappe
import datetime
import pytz

def get_context(context):
    token = frappe.form_dict.token
    context.token = token
    if not token:
        frappe.local.flags.redirect_location = "/404.html"
        raise frappe.Redirect
    
    url = '{0}/monitortest?token={1}'.format(frappe.utils.get_url(), token)
    candidates = frappe.db.get_all('Question Paper Candidates', 
                                   filters={'interviewer_url': url}, 
                                   fields=['*'])
    if candidates:
        candidate = candidates[0]
        
        if candidate.test_attempted:
            frappe.local.flags.redirect_location = "/test_attempted.html"
            raise frappe.Redirect
        
        current_datetime = datetime.datetime.now(pytz.timezone(candidate.time_zone)).replace(tzinfo=None, microsecond=0)
        
        if candidate.start_time <= current_datetime <= candidate.end_time:
            context.exam_info = candidate
            context.room_id = candidate.name
            context.user_email = candidate.interviewer_email
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
