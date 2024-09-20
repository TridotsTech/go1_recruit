import frappe

def get_context(context):
	context.user_type = frappe.form_dict.user

# @frappe.whitelist()
# def call_socket():
#     frappe.publish_realtime('hello')
