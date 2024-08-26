# -*- coding: utf-8 -*-
# Copyright (c) 2019, TridotsTech and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe import _
custom_alerts ={}
class InterviewQuestion(Document):
	def validate(self):
		if self.question_type=="Single":
			if (len(self.options))<2:
				if custom_alerts and custom_alerts["minimum_options_alert"]:
					frappe.throw(_(custom_alerts["minimum_options_alert"]))
				else:
					frappe.throw("Please add the options. Minimum options are 2")
		elif self.question_type=="Multiple":
			if (len(self.options))<2:
				if custom_alerts and custom_alerts["minimum_options_alert"]:
					frappe.throw(_(custom_alerts["minimum_options_alert"]))
				else:
					frappe.throw("Please add the options. Minimum options are 2")
		elif self.question_type=="Coding Question":
			if self.reference_code:
				code = self.reference_code.strip()
				if code == "" or self.reference_code == None:
					if custom_alerts and custom_alerts["reference_code_required"]:
						frappe.throw(_(custom_alerts["reference_code_required"]))
					else:
						frappe.throw("Please add a reference code for your coding question !")
			else:
				if custom_alerts and custom_alerts["reference_code_required"]:
					frappe.throw(_(custom_alerts["reference_code_required"]))
				else:
					frappe.throw("Please add a reference code for your coding question !")
     

@frappe.whitelist()
def delete_option(name):
	frappe.db.sql('''delete from `tabQuestion Option` where name=%(name)s''',{'name':name})
	return "success"

