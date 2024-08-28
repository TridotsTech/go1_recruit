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

def get_encrypted_url_details(token):
    return frappe.db.sql('''select name, questionpaper_id, meeting_id, candidate_name, candidate_email, test_attempted, time_zone, start_time, end_time, monitored_test, candidate_video, record_screen, interviewer_email from `tabQuestion Paper Candidates` where encrypted_url=%(token)s''', {'token': '{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), token)}, as_dict=1)

def get_exam_result(candidate_email, question_id):
    return frappe.db.get_all('Exam Result', fields=['exam_id'], filters={'user': candidate_email, 'exam_id': question_id})

def get_exam_result_details(question_id):
    return frappe.db.sql('''select name from `tabExam Result` where exam_id=%(exam_id)s''', {'exam_id': question_id}, as_dict=1)

def get_user_answer_count(exam_result_name):
    return frappe.db.sql('''select count(question) as count from `tabUser Answer` c where c.parent=%(parent)s''', {'parent': exam_result_name}, as_dict=1)

def get_not_attempted_count(exam_result_name):
    return frappe.db.sql('''select count(question) as not_attempt from `tabUser Answer` c where c.is_correct=0 and REPLACE(c.user_answer,CHAR(10),'')='' and c.parent=%(parent)s''', {'parent': exam_result_name}, as_dict=1)

def get_exam_info(question_id):
    return frappe.db.sql('''select IQP.question_paper_name, IQP.name from `tabInterview Question Paper` IQP where IQP.name=%(name)s''', {'name': question_id}, as_dict=1)

def get_exam_topics(exam_name):
    return frappe.db.get_all('Question Paper Topics', fields=['topic'], filters={'parent': exam_name})

def get_exam_master(ExamId):
    return frappe.db.get_all('Interview Question Paper', fields=['question_paper_name','duration_minutes','enable_user_video','enable_screen_sharing'], filters={'name': ExamId}, limit_page_length=1)

def get_chapter_questions(ExamId):
    return frappe.db.sql('''select * from `tabQuestion Paper Questions` where parent=%(ExamId)s ORDER BY RAND()''', {'ExamId': ExamId}, as_dict=True)

def get_question_answers(question):
    return frappe.db.get_all('Question Option', fields=['option', 'name', 'parent', 'is_correct'], filters={'parent': question}, limit_page_length=100)

def encrypt(url):
	if len(url) > 100:
		# encrypting > 100 chars will lead to truncation
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
		# encryption_key in site_config is changed and not valid
		frappe.throw(_('Encryption key is invalid, Please check site_config.json'))

def get_encryption_key():
	from frappe.installer import update_site_config

	if 'encryption_key' not in frappe.local.conf:
		encryption_key = Fernet.generate_key().decode()
		update_site_config('encryption_key', encryption_key)
		frappe.local.conf.encryption_key = encryption_key

	return frappe.local.conf.encryption_key


def get_context(context):
    context.go1_recruit_settings = frappe.get_single('Go1 Recruit Settings')
    Token = frappe.form_dict.token
    context.user_video = context.screen_sharing = 0
    context.token = Token
    if frappe.form_dict.code:
        context.code = frappe.form_dict.code
    
    encrypt_url = get_encrypted_url_details(Token)
    if not encrypt_url:
        frappe.local.flags.redirect_location = "/404.html"
        raise frappe.Redirect
    
    QuestionId = encrypt_url[0].questionpaper_id
    exam_result_id = get_exam_result(encrypt_url[0].candidate_email, QuestionId)
    
    for shop in exam_result_id:
        if shop.exam_id == QuestionId:
            exam_result = get_exam_result_details(QuestionId)
            count = get_user_answer_count(exam_result[0].name)
            context.count = count[0].count
            not_attempt = get_not_attempted_count(exam_result[0].name)
            context.not_attempt = not_attempt[0].not_attempt
            context.email = encrypt_url[0].candidate_email
            context.user_list1 = encrypt_url[0].candidate_name
            context.attempt = count[0].count - not_attempt[0].not_attempt
            exam_info = get_exam_info(QuestionId)
            for exam in exam_info:
                exam.topic = get_exam_topics(exam.name)
            context.exam_info1 = exam_info
    
    context.Duration = 30
    
    if encrypt_url[0].test_attempted == 0:
        ExamId = encrypt_url[0].questionpaper_id
        User = encrypt_url[0].candidate_email
        # frappe.log_error(title="User", message=User)
        context.ExamId = ExamId
        
        questions = []
        Answers = []
        ExamMaster = get_exam_master(ExamId)
        count = len(ExamMaster)
        
        if count == 1:
            current_datetime = datetime.datetime.now(pytz.timezone(encrypt_url[0].time_zone)).replace(tzinfo=None, microsecond=0)
            if current_datetime >= encrypt_url[0].start_time and current_datetime <= encrypt_url[0].end_time:
                chapterQuestions = get_chapter_questions(ExamId)
                for Questionitem in chapterQuestions:
                    questions.append(Questionitem)
                for question in questions:
                    QuestionAnswers = get_question_answers(question.interview_question)
                    for Answer in QuestionAnswers:
                        Answers.append(Answer)
                try:
                    context.candidate_name = encrypt_url[0].candidate_name
                    context.roomid = encrypt_url[0].name
                    context.candidate_video = encrypt_url[0].candidate_video
                    context.record_screen = encrypt_url[0].record_screen
                    if encrypt_url[0].monitored_test == 1:
                        context.questions = questions
                        context.userlog = frappe.session.user
                        context.Answers = Answers
                        context.Duration = ExamMaster[0].duration_minutes
                        context.user_email = User
                        context.monitored = 1
                        context.user_video = ExamMaster[0].enable_user_video
                        context.screen_sharing = ExamMaster[0].enable_screen_sharing
                    else:
                        context.questions = questions
                        context.userlog = frappe.session.user
                        context.Answers = Answers
                        context.Duration = ExamMaster[0].duration_minutes
                        context.user_email = User
                        context.monitored = 0
                except Exception as e:
                    context.Duration = 30
            else:
                frappe.local.flags.redirect_location = "/exam_timing.html"
                raise frappe.Redirect
        else:
            frappe.local.flags.redirect_location = "/404.html"
            raise frappe.Redirect
    else:
        frappe.local.flags.redirect_location = "/test_attempted.html"
        raise frappe.Redirect


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
		frappe.log_error(frappe.get_traceback(), title="go1_recruit.go1_recruit.templates.pages.start_test.execute") 

