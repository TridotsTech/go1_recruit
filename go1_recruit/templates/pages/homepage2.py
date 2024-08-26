# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
# import frappe
# from _future_ import unicode_literals
import frappe
import frappe.utils
import json 
from frappe import _
from frappe.utils import getdate,nowdate
from urllib.parse import unquote
from datetime import date
import datetime

 

def get_context(context):  
	# banner=frappe.db.sql('''select banner_image,redirect_url from `tabHomepage Banner`''',as_dict=1)
	banner = [{"banner_image":"","redirect_url":""}]
	context.slider_banners=banner
	theme_settings=frappe.get_single('Theme Settings')
	Items=frappe.db.get_all('Product',fields=['*'],filters={'is_active':1})
	if Items:
		for x in Items:
			plan_features=frappe.db.sql('''select pf.name,pf.feature_name,(if(exists(select pr.name from `tabProduct Feature` pr where pr.feature_id=pf.name and pr.parent=%(parent)s),1,0)) as flag from `tabPlan Feature` pf''',{'parent':x.name},as_dict=1)
			x.features=plan_features
			plan_price=frappe.db.get_all("Plan and Price",fields=['plan','price'],filters={'parent':x.name},order_by='idx')
			x.plans=plan_price
			x.price_and_plan = frappe.db.sql('''select Pp.plan,Pp.price from `tabPlan and Price` Pp where Pp.parent=%(parent)s''',{'parent':x.name},as_dict=1)

	context.Items=Items
	plan_and_price=frappe.db.sql('''select PP.plan,PP.price from `tabProduct` P inner join `tabPlan and Price` PP  on P.name=PP.parent''',as_dict=1)
	context.plans = plan_and_price

	price = frappe.db.sql('''select price from `tabPlan and Price` where plan="month" ''',as_dict=1)
	context.prices =price
	context.price1 = frappe.db.sql('''select price from `tabPlan and Price` where plan="6month" ''',as_dict=1)
	context.price2 = frappe.db.sql('''select price from `tabPlan and Price` where plan="year" ''',as_dict=1)		
	# EventLocation = frappe.request.cookies.get('CurrentLocation')
	# if not EventLocation:
	# 	EventLocation="Detroit"
	# if EventLocation.find('%20')!=-1:
	# 	EventLocation=EventLocation.replace('%20',' ')
	# context.EventLocation=EventLocation
	# EventList=frappe.db.get_all('Events',fields=['*'], filters={'published':1,'event_location':EventLocation}, order_by='start_date desc',limit_page_length=6)
	# categoryarray = []
	# EventsList=[]
	# now=getdate(nowdate())
	
	# for x in EventList:
	# 	x.CategoryList=frappe.db.get_all('Events Category',fields=['*'], filters={'name':x.event_category})		
	# 	if x.end_date:
	# 		if x.end_date.date()>=now:
	# 			x.end_date=x.end_date.strftime("%b %d, %Y %I:%M %p") 
	# 			x.start_date = x.start_date.strftime("%b %d, %Y %I:%M %p") 
	# 			EventsList.append(x)			  
	# 	else:
	# 		if x.start_date.date()>=now:
	# 			x.start_date = x.start_date.strftime("%b %d, %Y %I:%M %p") 
	# 			EventsList.append(x)
	# context.EventList=EventsList
	# EventCategoryList=frappe.db.get_all('Events Category',fields=['*'])
	# context.EventCategoryList=EventCategoryList
	# FeaturedEventCategoryList=frappe.db.get_all('Events Category',fields=['*'],limit_page_length=8)
	# context.FeaturedEventCategoryList=FeaturedEventCategoryList
	# BlogList=frappe.db.get_all('Blog',fields=['*'], filters={'published':1},limit_page_length=3)
	# for x in BlogList:
	# 	if x.short_description:
	# 		if len(x.short_description)>70:
	# 			x.short_description=x.short_description[:70]+'...'
	# 	if x.blog_name:
	# 		if len(x.blog_name)>20:
	# 			x.blog_name=x.blog_name[:20]+'...'  
	# 	x.creation = x.creation.strftime("%b %d, %Y")  
	# context.BlogList=BlogList
	# # context.title="i9Live"
	# if frappe.request.cookies.get('CurrentLocation'):
	# 	context.location = unquote(frappe.request.cookies.get('CurrentLocation'))
	# else:
	# 	context.location ="Detroit"	

	courses_list=frappe.db.sql('''select course_title,route,background_color,sub_title from `tabCourses` where show_in_website=1''',as_dict=1)
	context.courses=courses_list
	eventslist=frappe.db.sql('''select event_name,event_location,date_format(start_date, "%d %b, %Y") as start_date,
		date_format(start_date, "%h:%i %p") as start_time,short_description,image,route from `tabEvents` 
		where start_date>=curdate() and published=1''',as_dict=1)
	context.events=eventslist
	blogs_list=frappe.db.sql('''select blog_name,date_format(published_on,"%d %b, %Y") as published_date,
		user,route,short_description,description,avatar from `tabBlogs` where published=1 order by 
		creation desc''',as_dict=1)
	context.blogs=blogs_list
	testimonials=frappe.db.get_all('Testimonials',fields=['full_name','designation','message','image'],filters={'show_in_website':1},order_by='date desc',limit_page_length=5)
	context.testimonials=testimonials
	certificates=frappe.db.get_all('Certificate',fields=['*'],limit_page_length=20)
	context.certificates=certificates
	current_route='/'+context.route
	google_code=frappe.db.get_single_value('Social Tracking Codes','google_site_verification')
	context.google_code=google_code
	if current_route:
		seo=frappe.db.get_all('Page SEO',filters={'page_route':current_route},fields=['meta_title','meta_description','meta_keywords'])
		if seo:
			context.meta_title=seo[0].meta_title
			context.meta_description=seo[0].meta_description
			context.meta_keywords=seo[0].meta_keywords