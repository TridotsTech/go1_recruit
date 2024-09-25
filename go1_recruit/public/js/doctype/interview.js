frappe.ui.form.on('Interview', {
	refresh(frm){
		cur_frm.add_custom_button(__('Mail Candidates'), function() {
			frappe.call({
				method: 'go1_recruit.go1_recruit.api.insert_candidate_mail',
				args: {
					interview_id: cur_frm.doc.name
				},
			})
		}, __('Actions'))
	}
})