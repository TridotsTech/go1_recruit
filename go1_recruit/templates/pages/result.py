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
# from zoomus import ZoomClient

no_cache = 1
no_sitemap = 1

def get_context(context):
	go1_recruit_settings=frappe.get_single('Go1 Recruit Settings')
	Token = frappe.form_dict.token
	context.token=Token
	encrypt_url=frappe.db.sql('''select exam_result_id,email from `tabExam Result Sharing` where encrypted_url=%(token)s''',{'token':'{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), Token)},as_dict=1)
	if encrypt_url:
		exam_id = encrypt_url[0].exam_result_id
		question_id = frappe.get_doc('Exam Result',exam_id)
		context.email = question_id.user
		exam_info=[]
		# exam_info = frappe.db.sql('''select IQP.question_paper_name,IQP.subject,IQP.name from `tabInterview Question Paper` IQP where IQP.name=%(exam_id)s''',{'exam_id':question_id.exam_id},as_dict=1)
		exam_info = frappe.db.sql('''select IQP.question_paper_name,IQP.name from `tabInterview Question Paper` IQP where IQP.name=%(exam_id)s''',{'exam_id':question_id.exam_id},as_dict=1)
		for exam in exam_info:
			exam.topic = frappe.db.get_all('Question Paper Topics',fields=['topic'],filters={'parent':exam.name})
			exam.subject = frappe.db.get_all('Question Paper Subject',fields=['subjects'],filters={'parent':exam.name})
		context.exam_info1 = exam_info
		user_list = frappe.db.sql('''select candidate_name from `tabQuestion Paper Candidates` where questionpaper_id=%(id)s''',{'id':question_id.exam_id},as_dict=1)
		context.user_list1=user_list[0].candidate_name
		exam_result = frappe.db.sql('''select UA.question,UA.answer,UA.user_answer,UA.is_correct,ER.total_secured_marks,ER.grade from `tabExam Result` ER inner join `tabUser Answer` UA on ER.name=UA.parent where ER.name=%(exam_id)s''',{'exam_id':exam_id},as_dict=1)
		context.exam_result = exam_result
		items=frappe.db.sql('''select c.question,c.answer,c.user_answer,c.is_correct,i.question_type,i.question_level from `tabUser Answer` c,`tabInterview Question` i where i.name=c.question_id and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		context.exam_result1 = items
		correct=frappe.db.sql('''select count(question) as correct from `tabUser Answer` c where c.is_correct=1 and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		context.correct=correct[0].correct
		wrong=frappe.db.sql('''select count(question) as wrong from `tabUser Answer` c where c.is_correct=0 and REPLACE(c.user_answer,CHAR(10),'')<>'' and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		context.wrong=wrong[0].wrong
		not_attempt = frappe.db.sql(''' select count(question) as not_attempt from `tabUser Answer` c where c.is_correct=0 and REPLACE(c.user_answer,CHAR(10),'')='' and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		context.not_attempt=not_attempt[0].not_attempt
		context.attempt = correct[0].correct+wrong[0].wrong
		context.over_all_question = correct[0].correct+wrong[0].wrong+not_attempt[0].not_attempt
		context.secured_marks = question_id.total_secured_marks
		context.grade = question_id.grade
		context.details = encrypt_url
		items1=frappe.db.sql('''select c.question,c.answer,c.user_answer,c.is_correct,i.question_type,i.question_level,QP.option,QP.is_correct from `tabUser Answer` c,`tabInterview Question` i, `tabQuestion Option` QP where i.name=c.question_id and i.name=QP.parent and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		context.items1=items1
		# items1=frappe.db.sql('''select c.question,c.answer,c.user_answer,c.is_correct,i.question_type,i.question_level,QP.option,QP.is_correct from `tabInterview Question` i inner join  `tabQuestion Option` QP where i.name=QP.parent .parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		# context.items1=items1
		items = []
		items=frappe.db.sql('''select c.question,c.answer,c.user_answer,c.is_correct,i.question_type,i.question_level,i.name from `tabUser Answer` c,`tabInterview Question` i where i.name=c.question_id and c.parent=%(parent)s''',{'parent':question_id.name},as_dict=1)
		
		for item in items:
			item.answer2 = frappe.db.get_all('Question Option', fields=['option','name','parent','is_correct'],filters={'parent':item.name},limit_page_length=100)
		context.answer1=items
	else:
		frappe.local.flags.redirect_location = "/404.html"
		raise frappe.Redirect