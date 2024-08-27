# -*- coding: utf-8 -*-
# Copyright (c) 2019, Tridots and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import itertools
import random
import string
import requests
from operator import itemgetter
from frappe import msgprint, _
from frappe.model.document import Document
from frappe.utils import cstr, cint, flt, comma_or, getdate, nowdate, formatdate, format_time
from frappe.utils import cstr, encode
from cryptography.fernet import Fernet, InvalidToken 
from datetime import datetime
# from zoomus import ZoomClient
from dateutil import relativedelta
from frappe.utils import flt, cstr,getdate,nowdate,today,encode,cint,now_datetime
from frappe.utils.data import add_years,add_months,add_days
# new

custom_alerts ={}

class InterviewQuestionPaper(Document):
	def validate(self):
		self.validate_timings()
		
	

	def on_update_after_submit(self):
		self.no_of_candidates_shortlisted = len(self.shortlisted_candidates) if self.shortlisted_candidates else 0
		frappe.db.set_value('Interview Question Paper', self.name, 'no_of_candidates_shortlisted', self.no_of_candidates_shortlisted)

	def validate_timings(self):
		if not self.duration_minutes>0:
			if custom_alerts and custom_alerts["test_paper_validate_duration"]:
				frappe.throw(_(custom_alerts["test_paper_validate_duration"]))
			else:
				frappe.throw(_("test duration must be greater than 0 minutes"))


@frappe.whitelist(allow_guest=True)	
def get_custom_alerts():
	alert_messages = frappe.get_single('Alert Messages')
	if alert_messages:			
		for messages in alert_messages.alerts:
			custom_alerts[messages.content]=messages.message
   
   
   
@frappe.whitelist()
def get_topics_list(subjects):
	subject = json.loads(subjects)
	topics = []
	for x in subject:
		topic_name = frappe.db.sql('''SELECT name from `tabInterview Topic` WHERE subject=%(subject)s''',{"subject":x["name"]},as_dict=1)
		if topic_name:
			for topic in topic_name:
				topics.append(topic)
	return topics 




@frappe.whitelist()
def get_questions_list(**kwargs): 
	try:
		condition=''
		if kwargs.get('subject'):
			subject = json.loads(kwargs.get('subject'))
			subject_lists=''
			for item in subject:
				subject_lists+='"'+item.get('subjects')+'",'
			condition+=' and subject in ({0})'.format(subject_lists[:-1])
   
   
		if kwargs.get('topics'):
			topic=json.loads(kwargs.get('topics'))
			topic_lists=''
			for item in topic:
				topic_lists+='"'+item.get('topic')+'",'
			condition+=' and topic in ({0})'.format(topic_lists[:-1])
	
 
		if kwargs.get('question_type'): condition+=' and question_type="%s"' % kwargs.get('question_type')
		if kwargs.get('question_level'): condition+=' and question_level="%s"' % kwargs.get('question_level')
		if kwargs.get('question_paper'):
			questions_list=frappe.db.sql('''select group_concat(concat('"',interview_question,'"')) as value from `tabQuestion Paper Questions` where parent=%(parent)s''',{'parent':kwargs.get('question_paper')},as_dict=1)
			if questions_list and questions_list[0].value:
				condition+=' and name not in ({list})'.format(list=questions_list[0].value)
   		
     
		start=(int(kwargs.get('page_no'))-1)*int(kwargs.get('page_len'))
		total_count=frappe.db.sql('''select ifnull(count(*),0) as count from `tabInterview Question` where 1=1 {0}'''.format(condition),as_dict=1)
		questions_list=frappe.db.sql('''select name,subject,topic,question,question_type,question_level,is_private from `tabInterview Question` where 1=1 {0} limit {1},{2}'''.format(condition,start,int(kwargs.get('page_len'))),as_dict=1)
		return {'questions':questions_list,'count':total_count[0].count}

	except Exception:
		frappe.log_error(frappe.get_traceback(), "go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_questions_list")



@frappe.whitelist()
def update_questions_for_question_paper(questions,question_paper_id):
	frappe.db.sql('''delete from `tabQuestion Paper Questions` where parent=%(paper_id)s''',{'paper_id':question_paper_id})
	for x in json.loads(questions):
		paper_question = frappe.new_doc("Question Paper Questions")
		paper_question.interview_question=x
		paper_question.parent=question_paper_id
		paper_question.parentfield="questions"
		paper_question.parenttype="Interview Question Paper"
		paper_question.save()



@frappe.whitelist()
def insert_mail_to_candidates(question_paper_id):
	try:
		if not frappe.db.get_value("Email Account",{"default_outgoing" : 1}, ["name"]):
			return {'status':'default_email_not_set'}
		candidates = frappe.db.sql('''select name, candidate_name, candidate_email, interviewer_email, time_zone, start_time, end_time, monitored_test,candidate_video,record_screen from `tabInterview Candidates` where parent=%(paper_id)s and mail_sent=0''',{'paper_id':question_paper_id},as_dict=1)
		count = frappe.db.sql('''SELECT count(name) AS count FROM `tabInterview Candidates` where parent=%(paper_id)s and mail_sent=0''',{'paper_id':question_paper_id},as_dict=1)
		interview_questions=frappe.db.sql('''SELECT count(name) as total_qsn FROM `tabQuestion Paper Questions` WHERE parent=%(paper_id)s''',{'paper_id':question_paper_id},as_dict=1)
		interview_subjects = frappe.db.sql('''SELECT subjects FROM `tabQuestion Paper Subject` WHERE parent=%(paper_id)s''',{'paper_id':question_paper_id},as_dict=1)
  
		subjects = []
		interview_subject = ''
		if interview_subjects:
			for subject in interview_subjects:
				subjects.append(subject.subjects)
		subject = set(subjects)
		interview_subject = ','.join(map(str, subject)) 
		frappe.log_error("candidates",candidates)
		if candidates:
			for x in candidates:
				if x.start_time<x.end_time:
					zoom_url=''
					meeting_id=''
					
					frappe.db.set_value('Interview Candidates',x.name,'mail_sent',1)
					encrypted = encrypt(question_paper_id+x.candidate_email+randomString(4))
					
					question_paper_candidates = frappe.new_doc("Question Paper Candidates")
					question_paper_candidates.questionpaper_id = question_paper_id
					question_paper_candidates.candidate_name = x.candidate_name
					question_paper_candidates.candidate_email = x.candidate_email
					question_paper_candidates.interviewer_email = x.interviewer_email
					question_paper_candidates.subject_name = interview_subject
					question_paper_candidates.noof_questions=interview_questions[0].total_qsn
					question_paper_candidates.time_zone = x.time_zone
					question_paper_candidates.start_time=x.start_time
					question_paper_candidates.end_time=x.end_time
					question_paper_candidates.zoom_url=zoom_url
					question_paper_candidates.meeting_id=meeting_id
					question_paper_candidates.monitored_test=x.monitored_test
					question_paper_candidates.encrypted_url = '{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), encrypted)
     
     
					if x.monitored_test == 1:
						url_token = encrypt(question_paper_id + x.interviewer_email + randomString(4))
						question_paper_candidates.interviewer_url = '{0}/monitortest?token={1}'.format(frappe.utils.get_url(), url_token)
						question_paper_candidates.candidate_video=x.candidate_video
						question_paper_candidates.record_screen=x.record_screen
					question_paper_candidates.save(ignore_permissions=True)
     
				else:
					if custom_alerts and custom_alerts["validate_start_and_end_timing"]:
						frappe.throw(_(custom_alerts["validate_start_and_end_timing"]))
					else:
						frappe.throw(_("End time should be greater than start time"))
      
			frappe.db.sql('''UPDATE `tabInterview Question Paper` SET mail_sent=1 WHERE name=%(id)s''',{"id":question_paper_id})
			return {'status':'success','count':count[0].count}


		else:
			return {'status':'failure'}

	except Exception:
		frappe.log_error(frappe.get_traceback(), "go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.insert_mail_to_candidates")
  
  

def randomString(stringLength):
	"""Generate a random string of fixed length """
	letters = string.ascii_lowercase
	return ''.join(random.choice(letters) for i in range(stringLength))



@frappe.whitelist()
def questionpaper_candidates_count(questionpaper_id):
	count = frappe.db.sql('''SELECT COUNT(*) AS count FROM `tabQuestion Paper Candidates` WHERE questionpaper_id=%(id)s''',{"id":questionpaper_id},as_dict=1)
	if count:
		return count


@frappe.whitelist()
def get_timezones():
	import pytz
	return {
		"timezones": pytz.all_timezones
	}
 

def decrypt(url):
	try:
		cipher_suite = Fernet(encode(get_encryption_key()))
		plain_text = cstr(cipher_suite.decrypt(encode(url)))
		return plain_text
	except InvalidToken:
		# encryption_key in site_config is changed and not valid
		frappe.throw(_('Encryption key is invalid, Please check site_config.json'))
  
def encrypt(url):
	cipher_suite = Fernet(encode(get_encryption_key()))
	cipher_text = cstr(cipher_suite.encrypt(encode(url)))
	return cipher_text


def get_encryption_key():
	from frappe.installer import update_site_config

	if 'encryption_key' not in frappe.local.conf:
		encryption_key = Fernet.generate_key().decode()
		update_site_config('encryption_key', encryption_key)
		frappe.local.conf.encryption_key = encryption_key

	return frappe.local.conf.encryption_key



@frappe.whitelist()
def create_level_and_type_combination(subject,topic):
	questions_list=[]
	topic=json.loads(topic)
	topic_lists=''
	for item in topic:
		topic_lists='"'+item.get('topic')+'",'
	question_types=frappe.db.sql('''select distinct question_type from `tabInterview Question` where subject=%(subject)s and topic in ({0}) and status='Accepted' '''.format(topic_lists[:-1]),{"subject":subject})
	question_levels=frappe.db.sql('''select distinct question_level from `tabInterview Question` where subject=%(subject)s and topic in ({0}) and status='Accepted' '''.format(topic_lists[:-1]),{"subject":subject})
	import itertools
	combination=list(itertools.product(question_types,question_levels))
	for question in combination:
		questions=frappe.db.sql('''select count(question) as count,question_type,question_level from `tabInterview Question` where question_type=%(question_type)s and question_level=%(question_level)s and status='Accepted' having count>0''',{"question_type":question[0],"question_level":question[1]},as_dict=1)
		if len(questions)>0:
			questions_list.append(question)
	return questions_list



@frappe.whitelist()
def create_level_and_type_combination2(subject,topic,types,levels):
	questions_list=[]
	topic=json.loads(topic)
	topic_lists=''
	for item in topic:
		topic_lists+='"'+item.get('topic')+'",'
	subjects=json.loads(subject)
	subjects_lists=''
	for items in subjects:
		subjects_lists+='"'+items.get('subjects')+'",'
	question_types=json.loads(types)
	question_levels=json.loads(levels)
	import itertools
	combination=list(itertools.product(question_types,question_levels))
	condition='' 
	
	for question in combination:
		questions=frappe.db.sql('''select count(question) as count,question_type,question_level from `tabInterview Question` where question_type=%(question_type)s and question_level=%(question_level)s and subject in ({0}) and topic in ({1}) {conditions} having count>0'''.format(subjects_lists[:-1],topic_lists[:-1],conditions=condition),{"question_type":question[0],"question_level":question[1]},as_dict=1)
		if len(questions)>0:
			ques_list={}
			ques_list['question_type'] = question[0]
			ques_list['question_level'] = question[1]
			ques_list['count'] = questions[0].count
			questions_list.append(ques_list)
	return questions_list


@frappe.whitelist()
def get_random_questions(questions,question_paper_id,subject,topic):
	questions=json.loads(questions)
	questions_list=[]
	topic=json.loads(topic)
	topic_lists=''
	for item in topic:
		topic_lists+='"'+item.get('topic')+'",'
	subjects=json.loads(subject)
	subjects_lists=''
	for items in subjects:
		subjects_lists+='"'+items.get('subjects')+'",'
	condition=''
	
 
	if questions:
		for item in questions:
			no_of_questions = item['no_of_questions']
			question_type = item['question_type']
			question_level = item['question_level']
			
			generated_question = frappe.db.sql('''select name,subject,topic,question,question_type,question_level from `tabInterview Question` where question_type=%(question_type)s and question_level=%(question_level)s and subject in ({0}) and topic in ({1}) {condition} order by rand() limit {limit} '''.format(subjects_lists[:-1],topic_lists[:-1],limit=no_of_questions,condition=condition),{"question_type":question_type,"question_level":question_level},as_dict=1)
			questions_list+=generated_question
	return questions_list



@frappe.whitelist()
def delete_question(name):
	frappe.db.sql('''delete from `tabQuestion Paper Questions` where name=%(name)s''',{'name':name})
	return "success"


@frappe.whitelist()
def get_custom_timezones():
	import pytz
	timezones=[]
	timezones_list = frappe.db.sql("""select time_zone_name from `tabTimezone Format` order by time_zone_name """ ,as_dict=True)
	for x in timezones_list:
		timezones.append(x.time_zone_name)
	return timezones



@frappe.whitelist()
def delete_candidate(name):
	frappe.db.sql('''delete from `tabInterview Candidates` where name=%(name)s''',{'name':name})
	return "success"


@frappe.whitelist()
def remove_candidate(name,email,parent):
	frappe.db.sql('''delete from `tabShortlisted Candidates` where name=%(name)s''',{'name':name})
	frappe.db.sql('''UPDATE `tabInterview Candidates` SET short_listed=0 WHERE parent=%(parent)s and candidate_email=%(email)s''',{"parent":parent,"email":email})
	return "success"



@frappe.whitelist()
def auto_add_questionlevels():
	levels = frappe.db.sql('''SELECT question_level FROM `tabQuestion Level`''',as_dict=1)
	if levels:
		return levels



@frappe.whitelist()
def validate_question_paper(question_paper_id):
	old_question_paper = frappe.get_doc("Interview Question Paper",question_paper_id)
	new_doc = frappe.copy_doc(old_question_paper)
	new_doc.shortlist_html = None
	new_doc.shortlisted_candidates = []
	new_doc.mail_sent = 0
	new_doc.candidate_list = []
	new_doc.candidate_html = None
	new_doc.save(ignore_permissions=True)
	return {"status":"success","message":new_doc.name}
	

@frappe.whitelist()
def update_questions_for_question_paper1(questions,question_paper_id):
	frappe.db.sql('''delete from `tabQuestion Paper Questions` where parent=%(paper_id)s''',{'paper_id':question_paper_id})
	for x in json.loads(questions):
		question1 = x['question']
		paper_question = frappe.new_doc("Question Paper Questions")
		paper_question.interview_question=question1
		paper_question.parent=question_paper_id
		paper_question.parentfield="questions"
		paper_question.parenttype="Interview Question Paper"
		paper_question.save()

	