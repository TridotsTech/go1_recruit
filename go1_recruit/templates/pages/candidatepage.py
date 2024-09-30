# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
# import frappe
# from _future_ import unicode_literals
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
	context.go1_recruit_settings=frappe.get_single('Go1 Recruit Settings')
	# delimeter = make_route_string(frappe.form_dict)
	Token = frappe.form_dict.token
	context.user_video = context.screen_sharing = 0
	context.token=Token
	if frappe.form_dict.code:
		context.code=frappe.form_dict.code
	url = '{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), Token)
	# frappe.log_error("cand_url",url)
	encrypt_url=frappe.db.sql('''select name, questionpaper_id, meeting_id, candidate_name, candidate_email, test_attempted, time_zone, start_time, end_time, monitored_test, candidate_video, record_screen, interviewer_email  from `tabQuestion Paper Candidates` where encrypted_url=%(url)s''',{'url':url},as_dict=1)
	QuestionId=encrypt_url[0].questionpaper_id
	exam_result_id = frappe.db.get_all('Exam Result',fields=['exam_id'],filters={'user':encrypt_url[0].candidate_email})
	for shop in exam_result_id:
		if shop.exam_id==QuestionId:
			exam_result = frappe.db.sql('''select name from `tabExam Result` where exam_id=%(exam_id)s''',{'exam_id':QuestionId},as_dict=1)
			count=frappe.db.sql('''select count(question) as count from `tabUser Answer` c where c.parent=%(parent)s''',{'parent':exam_result[0].name},as_dict=1)
			context.count=count[0].count
			not_attempt = frappe.db.sql('''select count(question) as not_attempt from `tabUser Answer` c where c.is_correct=0 and REPLACE(c.user_answer,CHAR(10),'')='' and c.parent=%(parent)s''',{'parent':exam_result[0].name},as_dict=1)
			context.not_attempt=not_attempt[0].not_attempt
			context.email = encrypt_url[0].candidate_email
			context.user_list1 = encrypt_url[0].candidate_name
			context.attempt = count[0].count-not_attempt[0].not_attempt
			# exam_info=[]
			# exam_info = frappe.db.sql('''select IQP.question_paper_name,IQP.subject,IQP.name from `tabInterview Question Paper` IQP where IQP.name=%(name)s''',{'name':QuestionId},as_dict=1)
			# for exam in exam_info:
			# 	exam.topic = frappe.db.get_all('Question Paper Topics',fields=['topic'],filters={'parent':exam.name})
			# context.exam_info1 = exam_info
	context.Duration = 30
	if encrypt_url: #code changed by shankar on 04-09-2019
		if encrypt_url[0].test_attempted==0:
		# ExamId=frappe.form_dict.question_paper_id
		# User=frappe.form_dict.user_id
			ExamId=encrypt_url[0].questionpaper_id
			User=encrypt_url[0].candidate_email
			# frappe.log_error("User", User)
			context.ExamId=ExamId
			
			questions=[]
			Answers=[]
			ExamMaster = frappe.db.get_all('Interview Question Paper', fields=['question_paper_name','duration_minutes','enable_user_video','enable_screen_sharing'],filters={'name':ExamId},limit_page_length=1)
			count=len(ExamMaster)
			if count==1:

				current_datetime = datetime.datetime.now(pytz.timezone(encrypt_url[0].time_zone)).replace(tzinfo=None, microsecond=0) #added by shankar on 5-09-2019
				# if datetime.datetime.now()>=ExamMaster[0].start_time and datetime.datetime.now()<=ExamMaster[0].end_time: #commented by shankar on 5-09-2019
				if current_datetime>=encrypt_url[0].start_time and current_datetime<=encrypt_url[0].end_time: #added by shankar on 5-09-2019
					# attempted=frappe.db.sql('''update `tabQuestion Paper Candidates` set test_attempted=1 where encrypted_url=%(token)s''',{'token':Token})
				
					chapterQuestions=frappe.db.sql('''select * from `tabQuestion Paper Questions`   where  parent=%(ExamId)s  ORDER BY RAND()''',{'ExamId':ExamId},as_dict=True)		
					# chapterQuestions=frappe.db.sql('''select q.* from `tabQuestion Paper Questions` q inner join `tabInterview Question`i on q.interview_question=i.name  where  parent=%(ExamId)s  ORDER BY RAND()''',{'ExamId':ExamId},as_dict=True)		
					for Questionitem in chapterQuestions:
						questions.append(Questionitem)
					for question in questions:
						QuestionAnswers=frappe.db.get_all('Question Option', fields=['option','name','parent','is_correct'],filters={'parent':question.interview_question},limit_page_length=100)
						for Answer in QuestionAnswers:
							Answers.append(Answer)
					try:
						context.candidate_name = encrypt_url[0].candidate_name
						context.roomid = encrypt_url[0].name
						context.candidate_video = encrypt_url[0].candidate_video
						context.record_screen = encrypt_url[0].record_screen
						if encrypt_url[0].monitored_test==1:
							# meeting_status = get_zoomstatus(encrypt_url[0].meeting_id)
							# if meeting_status != "started":
							# 	frappe.local.flags.redirect_location = "/404.html"
							# 	raise frappe.Redirect
							# else:
							context.questions = questions
							context.userlog = frappe.session.user
							context.Answers = Answers
							context.Duration = ExamMaster[0].duration_minutes
							context.user_email = User
							context.candidate_email=encrypt_url[0].candidate_email
							context.monitored = 1
							context.user_video = ExamMaster[0].enable_user_video
							context.screen_sharing = ExamMaster[0].enable_screen_sharing						
						else:
							context.questions = questions
							context.userlog=frappe.session.user
							context.Answers=Answers
							context.Duration=ExamMaster[0].duration_minutes
							context.user_email=User
							context.candidate_email=encrypt_url[0].candidate_email
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
	else:
		frappe.local.flags.redirect_location = "/404.html"
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
		frappe.log_error(frappe.get_traceback(), "go1_recruit.go1_recruit.templates.pages.candidatepage.execute") 

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
