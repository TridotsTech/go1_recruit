frappe.listview_settings['Exam Result'] = {
	get_indicator: function (doc) {
		if (doc.status == "Evaluated") {
			return [__("Evaluated"), "green", "status,=,Evaluated"];
		} 
		else if (doc.status == "Not Evaluated") {
			return [__("Not Evaluated"), "red", "status,=,Not Evaluated"];
		} 
	},
	onload: function(me) {
		 if((frappe.user.has_role('Vendor')) || (frappe.user.has_role('Member') ) && (!(frappe.user.has_role('System Manager'))) && (!(frappe.user.has_role('Admin')))){
               $("[data-page-route='List/Exam Result/List'] .page-title .title-text").text("Results");
                $("[data-page-route='List/Exam Result/List'] .no-result.text-muted.flex.justify-center.align-center").find("p:first-child").text("No Results found")
                
                
            }
        },
};