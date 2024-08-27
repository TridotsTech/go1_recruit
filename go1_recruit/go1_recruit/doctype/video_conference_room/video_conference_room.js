// Copyright (c) 2020, TridotsTech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Video Conference Room', {
	refresh: function(frm) {
		if (!cur_frm.doc.__islocal) {
            cur_frm.add_custom_button(__('Invite Participants'), function() {
                cur_frm.trigger('send_mail')
            });        }
		},
	send_mail: function(frm) {
        let dialog = new frappe.ui.Dialog({
            title: 'Invite Participants',
            fields: [{
                "fieldname": "email",
                "label": __("Email Ids"),
                "fieldtype": "Data",
                "reqd": 1
            }, ]
        });
        dialog.set_primary_action(__('Send'), function() {
            var email1 = []
            // let obj = {};
            var email = [];
            var email_id = $('div[data-fieldname="email"]').find('input[type="text"]').val();
            // obj={email:(email_id.split(','))};
            email = email_id.split(',')
            for (var i = 0; i < email.length; i++) {
                email1.push({ "email": email[i] })
            }
            var msg="Are you sure you want to invite these participants?"
            frappe.confirm(__(msg), () => {
                frappe.call({
                    method: 'go1_recruit.go1_recruit.doctype.video_conference_room.video_conference_room.insert_mailTo_participants',
                    args: {
                        name: cur_frm.doc.name,
                        email: email1
                    },
                    callback: function(r) {
                        if (r.message.status == "success") {
                            var msg="Mail has been sent to the participants!"
                            frappe.show_alert(msg);
                            dialog.hide();
                            location.reload();
                        } else if (r.message.status == "failure") {
                            var msg="Something went wrong! Mail hasn't been sent!"
                            frappe.show_alert(msg)
                            location.reload();
                        }
                    }
                });
            });

        })
        dialog.show();
    }
});
