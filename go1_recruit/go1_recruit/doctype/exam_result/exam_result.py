# -*- coding: utf-8 -*-
# Copyright (c) 2019, TridotsTech and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import itertools
import json
import random
import string
import requests
from frappe.model.document import Document
from frappe.utils import cstr, encode
from cryptography.fernet import Fernet, InvalidToken
from frappe.utils import flt, cstr,getdate,nowdate,today,encode,cint,now_datetime
custom_alerts={}



class ExamResult(Document):
	def validate(self):
		for x in self.user_answer:
			if x.user_answer.strip()== "":
				x.is_evaluated=1
		
		score=0	
		for x in self.user_answer:
			if x.is_evaluated and x.is_correct:
				x.secured_marks=1
				score=score+float(x.secured_marks)
		self.total_secured_marks=score
		self.total_noof_questions = len(self.user_answer)
		
		if self.user_answer:
			count = 0
			for answer in self.user_answer:
				if answer.is_evaluated == 1:
					count += 1
			length = len(self.user_answer)
			if length and count:
				if int(length) == int(count):
					self.status="Evaluated"
					not_evaluated=frappe.db.sql('''UPDATE `tabInterview Candidates` SET test_result=%(mark)s WHERE candidate_email=%(email)s AND parent=%(parent)s''',{"mark":self.total_secured_marks,"email":self.user,"parent":self.exam_id})
				elif count == 0:
					self.status="Not Evaluated"
					not_evaluated=frappe.db.sql('''UPDATE `tabInterview Candidates` SET test_result="Not Evaluated" WHERE candidate_email=%(email)s AND parent=%(parent)s''',{"email":self.user,"parent":self.exam_id})
				else:
					self.status="Not Evaluated"
					not_evaluated=frappe.db.sql('''UPDATE `tabInterview Candidates` SET test_result="Not Evaluated" WHERE candidate_email=%(email)s AND parent=%(parent)s''',{"email":self.user,"parent":self.exam_id})
     
     
	def on_change(self):
		pass
		


@frappe.whitelist()
def get_user_information(user,exam_id):
	
	exam_info = frappe.db.sql('''select QPT.topic,IQP.question_paper_name,IQP.noof_questions,QPS.subjects 
								from `tabInterview Question Paper` IQP 
								inner join `tabQuestion Paper Topics` QPT on IQP.name=QPT.parent
								inner join `tabQuestion Paper Subject` QPS on IQP.name=QPS.parent
								where IQP.name=%(exam_id)s''',{'exam_id':exam_id},as_dict=1)
	
 
	user_list = frappe.db.sql('''select candidate_name,start_time,end_time from `tabQuestion Paper Candidates` where candidate_email = %(user)s and questionpaper_id=%(id)s''',{'user':user,'id':exam_id},as_dict=1)	
	
	qsns=frappe.db.sql('''select count(*) as total from `tabQuestion Paper Questions` where parent=%(id)s''',{'id':exam_id},as_dict=1)	
	return {'exam_info':exam_info,'user_list':user_list ,'qsns' :qsns}




@frappe.whitelist()
def insert_mail_to_candidates1(exam_result_id,question_paper_id,email):
	user_list = frappe.db.sql('''select questionpaper_name,subject_name,candidate_name from `tabQuestion Paper Candidates` where questionpaper_id=%(id)s''',{'id':question_paper_id},as_dict=1)
	email=json.loads(email)
	question_paper = frappe.get_doc('Exam Result',exam_result_id)
	portal_settings = frappe.get_single("Go1 Recruit Settings")
	interview_subjects = frappe.db.sql('''SELECT subjects FROM `tabQuestion Paper Subject` WHERE parent=%(paper_id)s''',{'paper_id':question_paper_id},as_dict=1)
	subjects = []
	interview_subject = ''
	if interview_subjects:
		for subject in interview_subjects:
			subjects.append(subject.subjects)
	subject = set(subjects)
	interview_subject = ','.join(map(str, subject)) 
	if email:
		for item in email:
			emailid= item['email']
			encrypted = encrypt(exam_result_id+emailid+randomString(4))
			exam_result_sharing = frappe.new_doc("Exam Result Sharing")
			exam_result_sharing.exam_result_id = exam_result_id
			exam_result_sharing.email = emailid
			exam_result_sharing.question_paper_name = user_list[0].questionpaper_name
			exam_result_sharing.candidate_name = user_list[0].candidate_name
			exam_result_sharing.subject = interview_subject
			exam_result_sharing.encrypted_url = '{0}/result?token={1}'.format(frappe.utils.get_url(), encrypted)
			exam_result_sharing.save(ignore_permissions=True)
		return {'status':'success'}
	else:
		return {'status':'failure'}


def encrypt(url):
	cipher_suite = Fernet(encode(get_encryption_key()))
	cipher_text = cstr(cipher_suite.encrypt(encode(url)))
	return cipher_text


def randomString(stringLength):
	letters = string.ascii_lowercase
	return ''.join(random.choice(letters) for i in range(stringLength))



def get_encryption_key():
	from frappe.installer import update_site_config

	if 'encryption_key' not in frappe.local.conf:
		encryption_key = Fernet.generate_key().decode()
		update_site_config('encryption_key', encryption_key)
		frappe.local.conf.encryption_key = encryption_key

	return frappe.local.conf.encryption_key


@frappe.whitelist()
def get_percentage_basedon_topics(exam_result_id):
	datas = frappe.db.sql('''SELECT 
                       			q.subject, q.topic, count(a.question_id) as question_count, sum(a.is_correct) as is_correct, FORMAT((sum(a.is_correct)/count(a.question_id))*100, 2) as percentage, FORMAT(100-((sum(a.is_correct)/count(a.question_id))*100), 2) as wrong
							from 
       							`tabInterview Question` q 
							inner join
       							`tabUser Answer` a 
							on 
       							a.question_id=q.name 
							where a.parent=%(name)s 
       						group by q.topic''',
             {"name":exam_result_id},as_dict=1)
	return datas