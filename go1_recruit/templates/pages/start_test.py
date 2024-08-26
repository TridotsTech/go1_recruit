# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

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
# from zoomus import ZoomClient

no_cache = 1
no_sitemap = 1

@frappe.whitelist(allow_guest=False)
def get_context(context):
    context.general_settings = frappe.get_single('General Settings')
    context.go1_recruit_settings = frappe.get_single('Go1 Recruit Settings')
    Token = frappe.form_dict.token
    context.token = Token

    if frappe.form_dict.code:
        context.code = frappe.form_dict.code

    encrypt_url = get_encrypted_url_details(Token)
    if not encrypt_url:
        redirect_to_404()

    QuestionId = encrypt_url[0].questionpaper_id
    exam_result_id = frappe.db.get_all('Exam Result', fields=['exam_id'], filters={'user': encrypt_url[0].candidate_email})

    for shop in exam_result_id:
        if shop.exam_id == QuestionId:
            context = populate_exam_details(context, encrypt_url, QuestionId)
            context.exam_info1 = get_exam_info(QuestionId)

    if encrypt_url[0].test_attempted == 0:
        ExamId = encrypt_url[0].questionpaper_id
        User = encrypt_url[0].candidate_email
        context.ExamId = ExamId

        ExamMaster = frappe.db.get_all('Interview Question Paper', fields=['question_paper_name', 'duration_minutes'], filters={'name': ExamId}, limit_page_length=1)

        if len(ExamMaster) == 1:
            current_datetime = datetime.datetime.now(pytz.timezone(encrypt_url[0].time_zone)).replace(tzinfo=None, microsecond=0)
            if current_datetime >= encrypt_url[0].start_time and current_datetime <= encrypt_url[0].end_time:
                questions, Answers = get_questions_and_answers(ExamId)
                context = update_context_for_test(context, encrypt_url, questions, Answers, ExamMaster, User)
            else:
                redirect_to_exam_timing()
        else:
            redirect_to_404()
    else:
        redirect_to_test_attempted()

@frappe.whitelist(allow_guest=False)
def get_zoomstatus(id):
	portal_settings = frappe.get_single("Go1 Recruit Settings")
	client = ZoomClient(portal_settings.zoom_api_key, portal_settings.zoom_api_password)
	url = "https://api.zoom.us/v2/meetings/"+str(id)
	headers = {'authorization': 'Bearer {}'.format(client.config.get("token"))}
	response = requests.request("GET", url, headers=headers)
	meeting_response = json.loads(response.content)
	meeting_status = meeting_response.get("status")
	if meeting_status:
		return meeting_status
     
@frappe.whitelist(allow_guest=True)
def execute(code2,lang1):
	try:
		go1_recruit_settings=frappe.get_single('Go1 Recruit Settings')
		code2=code2.replace('&lt;','<')
		code2=code2.replace('&gt;','>')
		code2=code2.replace('!--','')
		code2=code2.replace('--','')
		code2=code2.replace('&amp;','&')
		URL = "https://api.jdoodle.com/execute"
		data1 = {
			'clientId' : go1_recruit_settings.client_id,
			'clientSecret' : go1_recruit_settings.client_secret,
			'script' : code2,
			'language' : lang1,
			'versionIndex': 0
		}
		data = json.dumps(data1)
		headers = {'Content-type': 'application/json', 'dataType': 'json'}
		r = requests.post(url = URL, data = data, headers = headers)
		url = r.text
		url=json.loads(url)
		return url 
	except Exception:
		frappe.log_error(frappe.get_traceback(), "go1_recruit.go1_recruit.templates.pages.start_test.execute") 


def get_encrypted_url_details(token):
    return frappe.db.sql('''select questionpaper_id, meeting_id, candidate_name, candidate_email, test_attempted, time_zone, start_time, end_time, monitored_test from `tabQuestion Paper Candidates` where encrypted_url=%(token)s''', {'token': token}, as_dict=1)

def populate_exam_details(context, encrypt_url, QuestionId):
    exam_result = frappe.db.sql('''select name from `tabExam Result` where exam_id=%(exam_id)s''', {'exam_id': QuestionId}, as_dict=1)
    count = frappe.db.sql('''select count(question) as count from `tabUser Answer` where parent=%(parent)s''', {'parent': exam_result[0].name}, as_dict=1)
    context.count = count[0].count
    not_attempt = frappe.db.sql('''select count(question) as not_attempt from `tabUser Answer` where is_correct=0 and REPLACE(user_answer, CHAR(10), '')='' and parent=%(parent)s''', {'parent': exam_result[0].name}, as_dict=1)
    context.not_attempt = not_attempt[0].not_attempt
    context.email = encrypt_url[0].candidate_email
    context.user_list1 = encrypt_url[0].candidate_name
    context.attempt = count[0].count - not_attempt[0].not_attempt
    return context

def get_exam_info(QuestionId):
    exam_info = frappe.db.sql('''select question_paper_name, subject, name from `tabInterview Question Paper` where name=%(name)s''', {'name': QuestionId}, as_dict=1)
    for exam in exam_info:
        exam.topic = frappe.db.get_all('Question Paper Topics', fields=['topic'], filters={'parent': exam.name})
    return exam_info

def get_questions_and_answers(ExamId):
    questions = []
    Answers = []
    chapterQuestions = frappe.db.sql('''select * from `tabQuestion Paper Questions` where parent=%(ExamId)s ORDER BY RAND()''', {'ExamId': ExamId}, as_dict=True)
    for Questionitem in chapterQuestions:
        questions.append(Questionitem)
    for question in questions:
        QuestionAnswers = frappe.db.get_all('Question Option', fields=['option', 'name', 'parent', 'is_correct'], filters={'parent': question.interview_question}, limit_page_length=100)
        for Answer in QuestionAnswers:
            Answers.append(Answer)
    return questions, Answers

def update_context_for_test(context, encrypt_url, questions, Answers, ExamMaster, User):
    if encrypt_url[0].monitored_test == 1:
        meeting_status = get_zoomstatus(encrypt_url[0].meeting_id)
        if meeting_status != "started":
            redirect_to_404()
        else:
            context.questions = questions
            context.userlog = frappe.session.user
            context.Answers = Answers
            context.Duration = ExamMaster[0].duration_minutes
            context.user = User
    else:
        context.questions = questions
        context.userlog = frappe.session.user
        context.Answers = Answers
        context.Duration = ExamMaster[0].duration_minutes
        context.user = User
    return context

def redirect_to_404():
    frappe.local.flags.redirect_location = "/404.html"
    raise frappe.Redirect

def redirect_to_exam_timing():
    frappe.local.flags.redirect_location = "/exam_timing.html"
    raise frappe.Redirect

def redirect_to_test_attempted():
    frappe.local.flags.redirect_location = "/test_attempted.html"
    raise frappe.Redirect

def encrypt(url):
	if len(url) > 100:
		frappe.throw(_('text to be encrypted cannot be more than 100 characters long'))

	cipher_suite = Fernet(encode(get_encryption_key()))
	cipher_text = cstr(cipher_suite.encrypt(encode(url)))
	return cipher_text

def decrypt(url):
	try:
		cipher_suite = Fernet(encode(get_encryption_key()))
		plain_text = cstr(cipher_suite.decrypt(encode(url)))
		return plain_text
	except InvalidToken:
		frappe.throw(_('Encryption key is invalid, Please check site_config.json'))

def get_encryption_key():
	from frappe.installer import update_site_config

	if 'encryption_key' not in frappe.local.conf:
		encryption_key = Fernet.generate_key().decode()
		update_site_config('encryption_key', encryption_key)
		frappe.local.conf.encryption_key = encryption_key

	return frappe.local.conf.encryption_key







