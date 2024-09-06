
frappe.ui.form.on('ToDo', {
	onload(frm){
		frappe.realtime.on('update_status', (data) => {
			console.log("Realtime")
		})
	},
	priority(frm){
		frappe.call({
			method:"go1_recruit.go1_recruit.api.execute_realtime"
		})
	}
})