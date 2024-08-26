// Copyright (c) 2016, Valiantsystems and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Candidate Usage History"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
		},
		{
			"fieldname":"business",
			"label":__("Company / Business"),
			"fieldtype":"Link",
			"options":"Business"				
		},
		
	]
};
