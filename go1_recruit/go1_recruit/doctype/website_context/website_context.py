# -*- coding: utf-8 -*-
# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import datetime
import pyotp, os
from pyqrcode import create as qrcreate
from six import BytesIO
from datetime import date, datetime, time
from frappe.utils import getdate, add_months, add_to_date, nowdate, today, now
from frappe.utils import get_url, get_datetime, time_diff_in_seconds
from frappe.utils import cint
import frappe.handler
import frappe.client
import json
import requests
from frappe.utils.response import build_response
from frappe import _
from six.moves.urllib.parse import urlparse, urlencode
from base64 import b64encode, b32encode
from datetime import datetime
from frappe.utils.password import update_password as _update_password
from frappe.utils.password_strength import test_password_strength as _test_password_strength
from html.parser import HTMLParser

class WebsiteContext(Document):
	pass


@frappe.whitelist(allow_guest=True)
def update_website_context(context):
	try:
		# get all single doctypes values
		context.catalog_settings=frappe.get_single('Catalog Settings')
		context.media_settings=frappe.get_single('Media Settings')
		context.cart_settings=frappe.get_single('Shopping Cart Settings')
		context.order_settings=frappe.get_single('Order Settings')
		context.theme_settings=frappe.get_single('Theme Settings')
		context.common_settings=frappe.get_single('Common Settings')
		context.contact_settings=frappe.get_single('Contact Settings')
		context.site_configuration=frappe.get_single('Site Configuration')
		tracking_codes= frappe.get_doc('Social Tracking Code')
		h = HTMLParser()
		script_codes=[]
		default_columns=['owner','name','modified_by','_meta','creation','doctype','modified','idx','docstatus','facebook_page_id']
		for attr, value in tracking_codes.__dict__.iteritems():
			if not attr in default_columns:
				if value:
					# print(attr)
					script_codes.append(h.unescape(value))
		context.social_tracking_code=script_codes
		# context.social_tracking_code=frappe.get_single('Social Tracking Code')
		context.meta_title=context.catalog_settings.meta_title
		context.meta_description=context.catalog_settings.meta_description
		context.meta_keywords=context.catalog_settings.meta_keywords
		context.footer_address=context.theme_settings.footer_address
		context.footer_email=context.theme_settings.footer_email
		context.footer_phone=context.theme_settings.footer_phone
		currency=frappe.db.get_all('Currency',fields=["*"], filters={"name":context.catalog_settings.default_currency},limit_page_length=1)
		context.currency=currency[0].symbol
		frappe.cache().hset('currency','symbol',context.currency)
		header_links=frappe.db.sql('''SELECT link_name, link_url, display_order FROM `tabHeader Links` WHERE parent="Site Configuration" ORDER BY display_order ASC''',as_dict=1)
		if header_links:
			context.header_links=header_links
		
		# check customer
		if frappe.session.user!="Guest" and "Customer" in frappe.get_roles(frappe.session.user):
			customer=frappe.request.cookies.get('customer_id')
			context.customer_id=customer	
		if frappe.session.user!="Guest":
			UserDetails=frappe.get_doc('User',frappe.session.user)
			context.UserDetails=UserDetails
		if "Vendor" in frappe.get_roles(frappe.session.user):
			context.userRole="Vendor"
		if "System Manager" in frappe.get_roles(frappe.session.user):
			context.userRole="Administrator"
		if "Super Admin" in frappe.get_roles(frappe.session.user):
			context.userRole="Super Admin"
		if "Admin" in frappe.get_roles(frappe.session.user):
			context.userRole="Admin"
		if "Expert" in frappe.get_roles(frappe.session.user):
			context.userRole="Expert"
		# check for map api
		map_api=None
		enable_map=False
		maps=frappe.get_single('Google Settings')
		if maps.api_key:
			map_api=maps.api_key
		if maps.enable==1 and maps.api_key:				
			enable_map=True
		context.map_api=map_api		
		context.enable_map=enable_map 
		
		# dynamic header
		header=frappe.db.get_all('Header Template',fields=['route'], filters={"name":context.theme_settings.header_template})
		if header:
			context.header_file=header[0].route
		else:
			context.header_file=None	
		# dynamic footer
		footer=frappe.db.get_all('Footer Template',fields=['route'], filters={"name":context.theme_settings.footer_template})
		if footer:
			context.footer_file=footer[0].route
		else:
			context.footer_file=None
		
		# get csrf token
		if frappe.local.session.data.csrf_token:
			context.csrf_token=frappe.local.session.data.csrf_token
		else:
			context.csrf_token=''

		#custom_alerts
		alert_messages = frappe.get_single('Alert Messages')
		if alert_messages:
			content ={}
			for messages in alert_messages.alerts:
				content[messages.content]=messages.message
			context.custom_alerts = content
	except Exception:
		frappe.log_error(frappe.get_traceback(), "cmswebsite.cmswebsite.doctype.website_context.update_website_context") 			

