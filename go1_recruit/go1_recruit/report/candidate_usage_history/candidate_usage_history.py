# Copyright (c) 2013, Valiantsystems and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
# import frappe

def execute(filters=None):
	columns, data = [], []
	if not filters: filters={}
	columns=get_columns()
	data=customer_report(filters)
	return columns, data
def get_columns():
	columns = [
		"Business Id" + ":Link/Business:100",
		"Company / Business Name"+ ":Data:120",
		"Question Paper" + ":Link/Interview Question Paper:120",
		"Question Paper Name" + ":Data:120",
		"Candidate Name" + ":Data:250",
		"Candidate Email" + ":Data:120",
		"Candidate Phone" + ":Data:120",
		"Created On" + ":Data:120"
		
	]
	return columns
	
def customer_report(filters):
	condition=' '
	if filters.get('from_date'):
		if not condition:
			condition = " WHERE "
		condition+=' and U.creation>="%s"' % filters.get('from_date')
	if filters.get('to_date'):
		if not condition:
			condition = " WHERE "
		else:
			condition+= ' and'
		condition+=' and U.creation<="%s"' % filters.get('to_date')
	if filters.get('business'):
		if not condition:
			condition = " WHERE "
		else:
			condition+= ' and'
		condition+=' U.business="%s"' % filters.get('business') 

	data = frappe.db.sql(""" SELECT U.business,B.restaurant_name,U.questtion_paper,
							Q.question_paper_name,U.candidate_name,U.candidate_email,
							U.candidate_email,U.creation FROM `tabCandidate Used History` U 
							INNER JOIN `tabBusiness` B on B.name = U.business
							INNER JOIN `tabInterview Question Paper` Q ON Q.name = U.questtion_paper {condition}""".format(condition=condition),as_list=1)
	return data
