# -*- coding: utf-8 -*-
# from __future__ import unicode_literals

app_name = "go1_recruit"
app_title = "Go1 Recruit"
app_publisher = "TridotsTech"
app_description = "Go1 Recruit"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@tridotstech.com"
app_license = "MIT"


website_route_rules=[
	{"from_route":"/contact-us","to_route":"contact_us"},
	{"from_route":"/business-registration","to_route":"businessdetail"},
	{"from_route":"/expert-registration","to_route":"expertregistration"},
	{"from_route":"/registration-completed","to_route":"registerinfo"},
	{"from_route":"/business-payment","to_route":"business_payment_request"},
	{"from_route":"/payment-completed","to_route":"registrationpay"},
]
boot_session = "go1_recruit.go1_recruit.api.boot_session"
# update_website_context = "go1_recruit.go1_recruit.api.update_website_context"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/go1_recruit/css/go1_recruit.css"
# app_include_js = "/assets/go1_recruit/js/go1_recruit.js"
# app_include_js = "dashboard/public/assets/apexcharts/apexcharts.min.js"

# include js, css files in header of web template
# web_include_css = "/assets/go1_recruit/css/go1_recruit.css"
# web_include_js = "/assets/go1_recruit/js/go1_recruit.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "go1_recruit.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]



# Installation
# ------------

# before_install = "go1_recruit.install.before_install"
# after_install = "go1_recruit.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "go1_recruit.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"File": {
		"on_update": "go1_recruit.go1_recruit.api.update_result_files"
	}
}

fixtures = [
    {
		"doctype": "Workspace",
		"filters": {
			"name": "Go1 Recruit"
		}
	},
    {
		"doctype": "Interview Subject",
		"filters": {
			"name": ["in",["Automation testing","Software Quality Assurance","SQL", "Python", "Java", "C"]]
		}
	},
    {
		"doctype": "Interview Topic",
		"filters": {
			"name": ["in", ['Jenkins - Software Quality Assurance', 'JUnit - Software Quality Assurance', 'Cucumber - Software Quality Assurance', 'Mongo DB - Software Quality Assurance', 'MYSQL - Software Quality Assurance', 'Xapth, selenium RC, Selenium ID, Webdriver, - Automation testing', 'TestNG - Software Quality Assurance', 'RestAssured - Software Quality Assurance', 'Selenium - Software Quality Assurance', 'Test Case Authoring - Software Quality Assurance', 'QA Terminologies - Software Quality Assurance', 'QA Process - Software Quality Assurance', 'My SQL - SQL', 'Tuples - Python', 'Socket Programming - Python', 'Regular Expressions - Python', 'CGI Programming - Python', 'Exceptions - Python', 'Loops - Python', 'Objects - Python', 'Classes - Python', 'Overriding - Java', 'Overloading - Java', 'Polymorphism - Java', 'Encapsulation - Java', 'Oops Concepts - Java', 'Swing - Java', 'Multithreading - Java', 'File Handling - C', 'Data Structure - C', 'Sorting - C', 'Searching - C', 'Recursion - C', 'String - C', 'Pointer - C', 'Array - C']]
		}
	},
    {
		"doctype": "Question Level",
		"filters": {
			"name": ["in", ['Advanced', 'Beginner', 'Hard', 'Intermediate']]
		}
	},
    {
		"doctype": "Interview Question",
		"filters": {
			"name": ["in", ['IQ-00257', 'IQ-00256', 'IQ-00255', 'IQ-00254', 'IQ-00253', 'IQ-00252', 'IQ-00251', 'IQ-00246', 'IQ-00245', 'IQ-00243', 'IQ-00241', 'IQ-00239', 'IQ-00238', 'IQ-00237', 'IQ-00236', 'IQ-00235', 'IQ-00234', 'IQ-00233', 'IQ-00231', 'IQ-00230', 'IQ-00229', 'IQ-00226', 'IQ-00225', 'IQ-00224', 'IQ-00223', 'IQ-00222', 'IQ-00221', 'IQ-00220', 'IQ-00219', 'IQ-00218', 'IQ-00217', 'IQ-00214', 'IQ-00213', 'IQ-00211', 'IQ-00210', 'IQ-00209', 'IQ-00208', 'IQ-00207', 'IQ-00206', 'IQ-00205', 'IQ-00204', 'IQ-00202', 'IQ-00201', 'IQ-00200', 'IQ-00199', 'IQ-00197', 'IQ-00193', 'IQ-00192', 'IQ-00191', 'IQ-00190', 'IQ-00189', 'IQ-00188', 'IQ-00187', 'IQ-00186', 'IQ-00185', 'IQ-00184', 'IQ-00183', 'IQ-00182', 'IQ-00181', 'IQ-00180', 'IQ-00179', 'IQ-00178', 'IQ-00177', 'IQ-00176', 'IQ-00175', 'IQ-00174', 'IQ-00173', 'IQ-00172', 'IQ-00171', 'IQ-00170', 'IQ-00169', 'IQ-00168', 'IQ-00167', 'IQ-00166', 'IQ-00165', 'IQ-00164', 'IQ-00163', 'IQ-00162', 'IQ-00161', 'IQ-00160', 'IQ-00159', 'IQ-00158', 'IQ-00157', 'IQ-00156', 'IQ-00155', 'IQ-00154', 'IQ-00153', 'IQ-00152', 'IQ-00151', 'IQ-00150', 'IQ-00149', 'IQ-00148', 'IQ-00147', 'IQ-00146', 'IQ-00145', 'IQ-00144', 'IQ-00143', 'IQ-00142', 'IQ-00141', 'IQ-00140', 'IQ-00138', 'IQ-00136', 'IQ-00135', 'IQ-00134', 'IQ-00133', 'IQ-00132', 'IQ-00131', 'IQ-00130', 'IQ-00129', 'IQ-00128', 'IQ-00127', 'IQ-00126', 'IQ-00125', 'IQ-00124', 'IQ-00123', 'IQ-00122', 'IQ-00121', 'IQ-00120', 'IQ-00119', 'IQ-00118', 'IQ-00117', 'IQ-00116', 'IQ-00115', 'IQ-00114', 'IQ-00113', 'IQ-00112', 'IQ-00111', 'IQ-00110', 'IQ-00109', 'IQ-00108', 'IQ-00107', 'IQ-00106', 'IQ-00105', 'IQ-00104', 'IQ-00103', 'IQ-00102', 'IQ-00101', 'IQ-00100', 'IQ-00099', 'IQ-00098', 'IQ-00097', 'IQ-00096', 'IQ-00095', 'IQ-00094', 'IQ-00093', 'IQ-00092', 'IQ-00091', 'IQ-00090', 'IQ-00089', 'IQ-00088', 'IQ-00087', 'IQ-00086', 'IQ-00085', 'IQ-00084', 'IQ-00083', 'IQ-00082', 'IQ-00081', 'IQ-00080', 'IQ-00079', 'IQ-00078', 'IQ-00077', 'IQ-00076', 'IQ-00075', 'IQ-00074', 'IQ-00073', 'IQ-00072', 'IQ-00071', 'IQ-00070', 'IQ-00069', 'IQ-00068', 'IQ-00067', 'IQ-00066', 'IQ-00065', 'IQ-00064', 'IQ-00063', 'IQ-00062', 'IQ-00061', 'IQ-00060', 'IQ-00059', 'IQ-00057', 'IQ-00056', 'IQ-00055', 'IQ-00054', 'IQ-00053', 'IQ-00052', 'IQ-00051', 'IQ-00050', 'IQ-00049', 'IQ-00048', 'IQ-00047', 'IQ-00046', 'IQ-00045', 'IQ-00044', 'IQ-00043', 'IQ-00041', 'IQ-00040', 'IQ-00039', 'IQ-00038', 'IQ-00037', 'IQ-00036', 'IQ-00035', 'IQ-00034', 'IQ-00033', 'IQ-00032', 'IQ-00031', 'IQ-00030', 'IQ-00029', 'IQ-00028', 'IQ-00027', 'IQ-00026', 'IQ-00025', 'IQ-00024', 'IQ-00023', 'IQ-00022', 'IQ-00021', 'IQ-00020', 'IQ-00019', 'IQ-00018', 'IQ-00017', 'IQ-00016', 'IQ-00015', 'IQ-00014', 'IQ-00013', 'IQ-00012', 'IQ-00011', 'IQ-00010', 'IQ-00009', 'IQ-00008', 'IQ-00007', 'IQ-00006', 'IQ-00005', 'IQ-00004', 'IQ-00003', 'IQ-00002', 'IQ-00001']]
		}
	}
]


# update_website_context = "go1_recruit.go1_recruit.doctype.website_context.website_context.update_website_context"

# Scheduled Tasks
# ---------------

scheduler_events = {
	"cron": {
		"* * * * *": [
			"frappe.email.queue.flush"
		]
	}
}

# Testing
# -------

# before_tests = "go1_recruit.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "go1_recruit.event.get_events"
# }

