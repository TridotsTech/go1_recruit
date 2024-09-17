import frappe

def get_context(context):
	context.frappe = frappe
	context.url = frappe.utils.get_url()
