import frappe

def get_context(context):
	context.user_type = frappe.form_dict.user
	context.token = frappe.form_dict.token

# @frappe.whitelist()
# def call_socket():
#     frappe.publish_realtime('hello')
