# -*- coding: utf-8 -*-
# Copyright (c) 2020, TridotsTech and contributors
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

class VideoConferenceRoom(Document):
	pass

def randomString(stringLength):
	letters = string.ascii_lowercase
	return ''.join(random.choice(letters) for i in range(stringLength))

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
def insert_mailTo_participants(name,email):
	query = '''SELECT name, subject, starting_time, ending_time, password FROM `tabVideo Conference Room` WHERE name="{name}"'''.format(name=name)
	print("----------------------------------")
	print(query)
	user_list = frappe.db.sql('''{query}'''.format(query=query),as_dict=1)
	email=json.loads(email) 
	if email:
		for item in email:
			emailid= item['email']
			encrypted = encrypt(name+emailid+randomString(4))
			video_conference_participant = frappe.new_doc("Video Conference Participant")
			video_conference_participant.video_conference_room = name
			video_conference_participant.email = emailid
			video_conference_participant.subject = user_list[0].subject
			video_conference_participant.starting_time = user_list[0].starting_time
			video_conference_participant.ending_time = user_list[0].ending_time
			video_conference_participant.password = user_list[0].password
			video_conference_participant.encrypted_url = encrypted
			video_conference_participant.save(ignore_permissions=True)
		return {'status':'success'}
	else:
		return {'status':'failure'}
