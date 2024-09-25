from __future__ import unicode_literals
import frappe
import json
from frappe import _
import frappe.handler
import frappe.client

# catalog_settings=frappe.get_single('Catalog Settings')
# media_settings=frappe.get_single('Media Settings')
# cart_settings=frappe.get_single('Shopping Cart Settings')
# order_settings=frappe.get_single('Order Settings')

@frappe.whitelist()
def boot_session(bootinfo):
	try:
		from frappe.utils import get_site_name
		bootinfo.sitename = get_site_name(frappe.local.request.host)
	except Exception:
		frappe.log_error(frappe.get_traceback(), title="go1_recruit.go1_recruit.api.boot_session") 	

def update_website_context(context):
	alert_messages = frappe.get_single('Alert Messages')
	if alert_messages:
		content ={}
		for messages in alert_messages.alerts:
			content[messages.content]=messages.message
		context.custom_alerts = content	
	
@frappe.whitelist(allow_guest=True)
def update_result_files(doc, method):
	if doc.attached_to_doctype == 'Exam Result':
		if doc.attached_to_field in ['user_video', 'screen_video']:
			result = frappe.get_doc('Exam Result', doc.attached_to_name)
			if doc.attached_to_field == 'user_video':
				result.user_video = doc.file_url
			else:
				result.screen_video = doc.file_url
			result.save(ignore_permissions=True)

@frappe.whitelist(allow_guest=True)
def goto_dashboard():
	redirect_url="/desk"
	user_type=frappe.db.get_value('User',frappe.session.user,'user_type')
	if user_type!='Website User':
		from dashboard.dashboard.api import get_dashboard_items_for_menu
		dashboard=get_dashboard_items_for_menu()
		if dashboard:
			redirect_url='/desk#dashboard/'+dashboard[0].name
		else:
			redirect_url='/desk'
	return redirect_url

@frappe.whitelist(allow_guest=True)
def insert_exam_result(doc):
	try:
		exam_result=json.loads(doc)
		# frappe.log_error("Exam Doc", exam_result)
		# frappe.log_error("Token", exam_result.get('token'))
		test_attempted=frappe.db.sql('''UPDATE `tabQuestion Paper Candidates` SET test_attempted=1 WHERE encrypted_url=%(token)s''',{'token':'{0}/online_interview1?token={1}'.format(frappe.utils.get_url(), exam_result.get("token"))})
		result_doc=frappe.new_doc("Exam Result")
		result_doc.exam_id=exam_result.get("exam_id")
		result_doc.exam_start_date=exam_result.get("exam_start_date")
		result_doc.exam_end_date=exam_result.get("exam_end_date")
		result_doc.user=exam_result.get("user")
		if exam_result.get('user_video'):
			result_doc.user_video = exam_result.get('user_video')
		if exam_result.get('screen_video'):
			result_doc.screen_video = exam_result.get('screen_video')
		result_doc.save(ignore_permissions=True)
		# frappe.log_error("Exam Result", result_doc)
		return result_doc
	except Exception:
		frappe.log_error(title="ecommerce_business_store.ecommerce_business_store.api.insert_exam_result", message=frappe.get_traceback())

@frappe.whitelist(allow_guest=True)
def insert_exam_result_user_answers(doc,token):
	try:
		exam_result=json.loads(doc)
		result_value=[]
		for x in exam_result:
			x=json.loads(json.dumps(x))
			result_doc=frappe.new_doc("User Answer")
			result_doc.parent=x.get("parent")
			result_doc.parenttype=x.get("parenttype")
			result_doc.question=x.get("question")
			result_doc.parentfield=x.get("parentfield")
			result_doc.user_answer=x.get("user_answer")
			result_doc.question_id=x.get("question_paper_id")
			user_answers=x.get("user_answer").split(',')
			
			opt=""
			question_detail = frappe.db.sql('''SELECT question_type, reference_code FROM `tabInterview Question` WHERE name=%(answer)s''',{'answer':result_doc.question_id},as_dict=1)
			if question_detail[0].question_type == "Coding Question":
				for n in question_detail:
					if n.reference_code != None:
						opt+= n.reference_code
			else:
				answers=frappe.db.sql('''select qo.option from `tabInterview Question` iq ,`tabQuestion Option` qo where qo.parent=iq.name and qo.is_correct=1 and iq.name=%(answer)s''',{'answer':result_doc.question_id},as_dict=1)
				# print("==answers=========")
				# print(answers)
				if answers:
					opt=""
					i=0
					for n in answers:
						i+=1
						if i>1:
							opt+=","+n.option
						else:
							opt+=n.option
					correct_answers=opt.split(',')
					user_correct_ans = []
					if(len(user_answers)>0 and len(correct_answers)>0):
						c = user_answers
						d = correct_answers
						for i in user_answers:
							# # print("======iiiiii")
							# # print(i)
							# for j in correct_answers:
							# 	print(i)
							# 	print(j)
							# 	print(i == j)
							# 	if i == j:
							# 		c.remove(i)
							# 		d.remove(j)
							# 		# print("=====user_answers11111")
							# 		# print(user_answers)
							# 		# print("=======correct_answers")
							# 		# print(correct_answers)
							if i in d:
								user_correct_ans.append(i)
						# valuated_ans = c + d
						
						# print("=======valuated_ans")
						# print(valuated_ans)
						# if(len(valuated_ans)==0):
						# 	result_doc.is_evaluated=1
						# 	result_doc.is_correct=1
						# 	result_doc.secured_marks=1
						# else:
						# 	result_doc.is_evaluated=1
						# 	result_doc.is_correct=0
						# 	result_doc.secured_marks=0
						
						if len(d) == len(user_correct_ans):
							result_doc.is_evaluated=1
							result_doc.is_correct=1
							result_doc.secured_marks=1
						else:
							result_doc.is_evaluated=1
							result_doc.is_correct=0
							result_doc.secured_marks=0

			result_doc.answer=opt
			if result_doc.answer:
				if result_doc.user_answer==result_doc.answer:
					# result_doc.is_correct=1
					result_doc.secured_marks=1
				else:
					result_doc.is_correct=0
					result_doc.secured_marks=0
			else:
				result_doc.is_correct=0
				result_doc.secured_marks=0
			result_doc.save(ignore_permissions=True)
			exam_result1 = frappe.get_doc('Exam Result',result_doc.parent)
			result={}
			count=frappe.db.sql('''select count(question) as count from `tabUser Answer` c where c.parent=%(parent)s''',{'parent':exam_result1.name},as_dict=1)
			result["count"]=count[0].count
			not_attempt = frappe.db.sql('''select count(question) as not_attempt from `tabUser Answer` c where c.is_correct=0 and REPLACE(c.user_answer,CHAR(10),'')='' and c.parent=%(parent)s''',{'parent':exam_result1.name},as_dict=1)
			result["not_attempt"]=not_attempt[0].not_attempt
			result["exam_info"] = frappe.db.sql('''select QPT.topic,IQP.question_paper_name,QPS.subjects from `tabInterview Question Paper` IQP inner join `tabQuestion Paper Topics` QPT on IQP.name=QPT.parent join `tabQuestion Paper Subject` QPS on IQP.name=QPS.parent where IQP.name=%(exam_id)s''',{'exam_id':exam_result1.exam_id},as_dict=1)
			result["user_list"] = frappe.db.sql('''select candidate_name,candidate_email,start_time,end_time from `tabQuestion Paper Candidates` where questionpaper_id=%(id)s and candidate_email=%(email)s''',{'id':exam_result1.exam_id,'email':x.get("user")},as_dict=1)
			result_value.append(result)
			exam_result_save=frappe.get_doc('Exam Result',x.get("parent"))
			exam_result_save.save(ignore_permissions=True)
		# frappe.log_error("Result", result_value)
		return result_value[-1]
	except Exception:
		frappe.log_error("ecommerce_business_store.ecommerce_business_store.api.insert_exam_result_user_answers", frappe.get_traceback())
  

@frappe.whitelist()
def execute_realtime():
    frappe.publish_realtime('update_status', {"doc":"Hi"})
    # for i in range(1,10001):
    # 	frappe.publish_progress(i/10000*100, title='Execution in Progress...', description=f"{i} out of 10000 completed")
    
@frappe.whitelist(allow_guest=True)
def offer(localSDP):
    frappe.publish_realtime("offer", {"localSDP":json.loads(localSDP)})
    
@frappe.whitelist(allow_guest=True)
def answer(remoteSDP):
    frappe.publish_realtime("answer", {"remoteSDP":json.loads(remoteSDP)})
    
@frappe.whitelist(allow_guest=True)
def check_candidate_presence():
    frappe.log_error("Check candidate Presence Triggered")
    frappe.publish_realtime('check_candidate_presence')
    
@frappe.whitelist(allow_guest=True)
def notify_interviewer():
    frappe.publish_realtime("candidate_joined")