// Copyright (c) 2019, TridotsTech and contributors
// For license information, please see license.txt
frappe.require("assets/go1_recruit/assets/apexcharts/apexcharts.min.js");


frappe.ui.form.on('Exam Result', {
    refresh: function(frm) {
        $('*[data-fieldname="user_answer"]').find('.grid-footer').hide();

        if (cur_frm.doc.status == "Evaluated") {
            cur_frm.add_custom_button(__('Share Result'), function() {
                cur_frm.trigger('send_mail')
            });
            cur_frm.trigger('generate_chart') 
        }
        cur_frm.trigger('generate_video_html')
        $("head").append('<style>.apexcharts-canvas{height:120px !important;}.apexcharts-datalabel-label{display: none;}.chart_box{min-height:unset !important;}</style>');

        if (!cur_frm.doc.__islocal) {
            if (cur_frm.doc.user_answer) {
                cur_frm.trigger('answer_html')
            }
            if (cur_frm.doc.user && cur_frm.doc.user_answer) {
                cur_frm.trigger('user_html')
            }
        }
    },


    generate_chart: function(frm) {
        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.exam_result.exam_result.get_percentage_basedon_topics',
            args: {
                exam_result_id: cur_frm.doc.name
            },
            callback: function(data) {
                $("div[data-fieldname='chart_section']").css({
                    "float": "left",
                    "width": "100%",
                    "display": "none"
                })
                let wrapper = $(cur_frm.get_field('chart_section').wrapper).empty();
                let row_data = $('<div id="chart-row" class="row" style="background: #fafbfc;border-bottom: 1px solid #d1d8dd;border-radius: 0;margin-left: -20px;margin-right: -20px;margin-top: -15px;border-top: 1px solid #d1d8dd;"></div>').appendTo(wrapper);

                if (data.message) {
                    
                    frappe.run_serially([
                        () => {
                            for (var i = 0; i < data.message.length; i++) {
                                var data_id = data.message[i].topic
                                data_id = data_id.replace(/[&\/\\#,+()$~%. '":*?<>{}]/g,'_');
                                let content_html = '<div class="col-md-3" style="min-height:100px;"><div style="margin: 20px 5px; background: white; border: 1px solid #efefef;box-shadow: 0 22px 35px -16px rgba(0,0,0, 0.1)"><div><h6 style="font-size: 14px;text-align: center;margin: 0px;padding: 10px 10px 3px;height: 50px;line-height: 20px;overflow: hidden;">'+data.message[i].topic+'</h6><p style="text-align: center;margin: 0px;color: #aeaeae;">'+data.message[i].is_correct+'/'+data.message[i].question_count+'</p></div><div class="chart_box" id="chart-' + data_id + '"></div></div></div>';
                                $("div[data-fieldname='chart_section']").find("#chart-row").append(content_html)
                                
                                
                            }
                        },
                        () => {
                            setTimeout(function() {
                                $("div[data-fieldname='chart_section']").css("display", "block");
                                for (var i = 0; i < data.message.length; i++) {

                                    var options = {
                                        chart: {
                                            height: 170,
                                            type: 'radialBar',
                                            offsetY: -10,
                                        },
                                        plotOptions: {
                                            radialBar: {

                                                startAngle: -145,
                                                endAngle: 145,
                                                dataLabels: {
                                                    enabled: false,
                                                    name: {
                                                        fontSize: '16px',
                                                        color: "#333",
                                                        offsetY: 72,
                                                    },
                                                    style: {
                                                        fontSize: '18px',
                                                        fontFamily: 'Helvetica, Arial, sans-serif',
                                                        colors: undefined
                                                    },
                                                    value: {
                                                        offsetY: -9,
                                                        fontSize: '14px',
                                                        color: undefined,
                                                        formatter: function(val) {
                                                            return val + "%";
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        colors: ['#2ECC71'],
                                        fill: {
                                            type: 'gradient',
                                            gradient: {
                                                shade: 'dark',
                                                shadeIntensity: 0.15,
                                                inverseColors: false,
                                                opacityFrom: 1,
                                                opacityTo: 1,
                                                stops: [0, 50, 65, 91]
                                            },
                                        },
                                        stroke: {

                                            dashArray: 2,
                                        },
                                        series: [data.message[i].percentage],
                                        labels: [data.message[i].topic],

                                    }

                                    var data_id = data.message[i].topic
                                    data_id = data_id.replace(/[&\/\\#,+()$~%. '":*?<>{}]/g,'_');

                                    var chart = new ApexCharts(
                                        document.querySelector("#chart-" + data_id),
                                        options
                                    );
                                    chart.render();

                                }

                                }, 1000);
                            }
                        ])
                    }
                }
            })

                                
    },
	candidate_recording(frm) {
		var d = new frappe.ui.Dialog({
		    title: "Video Recording",
		    fields: [{
                        fieldname: 'video_recording',
                        fieldtype: 'HTML'
                    }],
            size: 'large'
		})
		$('.modal-backdrop').on('click',function(){
			$('.candidate-video').attr('src', '')
		});
		var html = `<video width="757" height="480" controls playsinline autoplay src="${frm.doc.user_video}" class="video">Video Not Supported</video>`
		d.fields_dict.video_recording.$wrapper.html(html);
		d.show()
		close_video()
	},
	screen_recording(frm) {
		var d = new frappe.ui.Dialog({
		    title: "Screen Recording",
		    fields: [{
                        fieldname: 'screen_recording',
                        fieldtype: 'HTML'
                    }],
            size: 'large'
		})
		var html = `<video width="757" height="480" controls playsinline autoplay src="${frm.doc.screen_video}" class="video">Video Not Supported</video>`
		d.fields_dict.screen_recording.$wrapper.html(html);
		d.show()
		close_video()
	},
    generate_video_html: function(frm) {
        // let wrapper = $(cur_frm.get_field('video_html').wrapper).empty();
        // var user_video = '';
        // var Screen_video = '';
        // if (cur_frm.doc.screen_video || cur_frm.doc.user_video) {
        //     $(cur_frm.get_field('video_html').wrapper).parent().parent().parent().parent().show();
        //     if (cur_frm.doc.user_video) {
        //         let html = $('<div class="row" style="background: #fafbfc;border-bottom: 1px solid #d1d8dd;border-radius: 0;margin-left: -30px;margin-right: -30px;margin-top: -15px;"><div class="col-md-12" style="padding: 20px 30px;"><a href="' + window.location.origin + cur_frm.doc.user_video + '" style="font-weight: 600;" target="_blank">Play Candidate Video<i class="fa fa-file-video-o" aria-hidden="true" style="font-size: 19px;padding-left:15px"></i></a></div></div>').appendTo(wrapper);
        //     }
        //     if (cur_frm.doc.screen_video) {
        //         let html = $('<div class="row" style="background: #fafbfc;border-bottom: 1px solid #d1d8dd;border-radius: 0;margin-left: -30px;margin-right: -30px;margin-top: -15px;"><div class="col-md-12" style="padding: 20px 30px;"><a href="' + window.location.origin + cur_frm.doc.screen_video + '" style="font-weight: 600;" target="_blank">Play Screen Video<i class="fa fa-file-video-o" aria-hidden="true" style="font-size: 19px;padding-left:15px"></i></a></div></div>').appendTo(wrapper);
        //     }
        // }else{
        //     $(cur_frm.get_field('video_html').wrapper).parent().parent().parent().parent().hide();
        // }
    },

    send_mail: function(frm) {
        let dialog = new frappe.ui.Dialog({
            title: 'Sharing Result',
            fields: [{
                "fieldname": "email",
                "label": __("Email Ids"),
                "fieldtype": "Data",
                "reqd": 1
            }, ]
        });
        dialog.set_primary_action(__('Send'), function() {
            var email1 = []
            var email = [];
            var email_id = $('div[data-fieldname="email"]').find('input[type="text"]').val();
           
            email = email_id.split(',')
            for (var i = 0; i < email.length; i++) {
                email1.push({ "email": email[i] })
            }
            var msg="Are you sure you want to share the test results?"
            
            frappe.confirm(__(msg), () => {
                frappe.call({
                    method: 'go1_recruit.go1_recruit.doctype.exam_result.exam_result.insert_mail_to_candidates1',
                    args: {
                        exam_result_id: cur_frm.doc.name,
                        question_paper_id: cur_frm.doc.exam_id,
                        email: email1
                    },
                    callback: function(r) {
                        if (r.message.status == "success") {
                            var msg="Mail has been sent to the members!"
                            
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
    },

    answer_html: function(frm) {
        let wrapper = $(cur_frm.get_field('answer_html').wrapper).empty();
        let html = $(`<div style="float:left;width:100%;">
            <table class="table table-bordered" style="cursor:pointer;margin: 15px 0 10px 0;">
                <thead>
                    <tr>
                        <th>S.no</th>
                        <th>Question</th>
                        <th>Candidate Answer</th>
                        <th>Correct Answer</th>
                        <th>Status</th>                    
                        <th>Actions</th>
                    </tr>
                </thead> 
                <tbody> </tbody>
        </table></div>`).appendTo(wrapper);


        var s_no = 0
        cur_frm.doc.user_answer.map(f => {
            if (f.is_evaluated) {
                if (f.is_correct == 1) {
                    f.actions = '';
                    f.status = '<span class="Green"><span class="indicator green"></span> Correct </span><span class="blue" style="display:none;"><span class="indicator blue"></span> Not Evaluated</span><span class="Red" style="display:none;"><span class="indicator red"></span> Wrong</span>';
                } else {

                    if (f.user_answer && $.trim(f.user_answer) != "") {
                        f.actions = '';
                        f.status = '<span class="Red"><span class="indicator red"></span> Wrong</span><span class="blue" style="display:none;"><span class="indicator blue"></span> Not Evaluated</span><span class="Green" style="display:none;"><span class="indicator green"></span> Correct </span>';
                    } else {
                        f.actions = '';
                        f.status = '<span class="indicator darkgrey"></span> Not Attempted';
                    }
                }
            } else {
                if (f.user_answer && $.trim(f.user_answer) != "") {
                    f.actions = `<button class="btn btn-warning" style="display:none" title="Edit"> <i class="octicon octicon-pencil"></i></button><button class="btn btn-success"><span class="octicon octicon-check"></span></button>
                     <button class="btn btn-danger"><span class="octicon octicon-x"></span></button>`;
                    f.status = '<span class="blue"><span class="indicator blue"></span> Not Evaluated</span> <span class="Green" style="display:none;"><span class="indicator green"></span> Correct </span><span class="Red" style="display:none;"><span class="indicator red"></span> Wrong</span>';

                } else {
                    f.actions = '';
                    f.status = '<span class="indicator darkgrey"></span> Not Attempted';
                }
            }
            if (f.is_evaluated == 1) {
                if (f.user_answer && $.trim(f.user_answer) != "") {
                    f.actions = `<button class="btn btn-warning" title="Edit"> <i class="octicon octicon-pencil"></i></button><button title="Correct" class="btn btn-success" style="display: none;"><span class="octicon octicon-check"></span></button>
                     <button class="btn btn-danger" style="display: none;" title="Wrong"><span class="octicon octicon-x"></span></button>`;
                } else {
                    f.actions = '';
                }
            }
            if (f.user_answer) {
                let a = (f.user_answer).split('-')
                if (a[0] == "/private/files/AudioRecord") {
                    f.custom_user_answer = '<audio controls preload="auto"><source src="' + f.user_answer + '" type="audio/mpeg">Your browser does not support the audio tag.</audio>'
                } else {
                    f.custom_user_answer = f.user_answer
                }
            } else{
                f.custom_user_answer = "";
            }
            

            s_no += 1;
            f.s_no = s_no;
            let row_data = $(`<tr data-id="${f.name}">
                <td>${f.s_no}</td>
                <td>${f.question}</td>
                <td>${f.custom_user_answer}</td>
                <td>${f.answer}</td>
                <td>${f.status}</td>
                <td align="center" style="width:158px;">${f.actions}</td>                    
            </tr>`);
            html.find('tbody').append(row_data);
        })



        $(cur_frm.get_field('answer_html').wrapper).find('tbody .btn-danger').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            frappe.model.set_value('User Answer', id, 'is_evaluated', 1)
            frappe.model.set_value('User Answer', id, 'is_correct', 0)
            $(this).parent().find('.btn-warning').show();
            $(this).parent().find('.btn-success').hide();
            $(this).parent().find('.btn-danger').hide();
            $(this).parent().parent().find('.blue').hide();
            $(this).parent().parent().find('.Green').hide();
            $(this).parent().parent().find('.Red').show();
            cur_frm.refresh_fields();
        })
        $(cur_frm.get_field('answer_html').wrapper).find('tbody .btn-success').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            frappe.model.set_value('User Answer', id, 'is_evaluated', 1)
            frappe.model.set_value('User Answer', id, 'is_correct', 1)
            frappe.model.set_value('User Answer', id, 'secured_marks', 1)
            $(this).parent().find('.btn-warning').show();
            $(this).parent().find('.btn-success').hide();
            $(this).parent().find('.btn-danger').hide();
            $(this).parent().parent().find('.blue').hide();
            $(this).parent().parent().find('.Green').show();
            $(this).parent().parent().find('.Red').hide();

            cur_frm.refresh_fields();
        })
        $(cur_frm.get_field('answer_html').wrapper).find('tbody .btn-warning').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            frappe.model.set_value('User Answer', id, 'is_evaluated', '')
            frappe.model.set_value('User Answer', id, 'is_correct', '')
            $(this).parent().find('.btn-warning').hide();
            $(this).parent().find('.btn-success').show();
            $(this).parent().find('.btn-danger').show();
            $(this).parent().parent().find('.blue').show();
            $(this).parent().parent().find('.Green').hide();
            $(this).parent().parent().find('.Red').hide();

        })
        $(cur_frm.get_field('answer_html').wrapper).find('audio').on('play', function(){
            let id = $(this).parent().parent().attr('data-id');
            $(cur_frm.get_field('answer_html').wrapper).find('audio').each(function(k, v){
                let idx = $(v).parent().parent().attr('data-id')
                if(id != idx){
                    $(v)[0].pause();
                }
            })
        })
    },

    user_html: function(frm) {
        let wrapper = $(cur_frm.get_field('user_html').wrapper).empty();
        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.exam_result.exam_result.get_user_information',
            args: {
                user: cur_frm.doc.user,
                exam_id: cur_frm.doc.exam_id
            },
            callback: function(data) {
                var row_data = ''
                if (data.message) {
                    let exam = data.message;
                    let subjects = [];
                    var topics = [];
                    for (let i = 0; i < data.message['exam_info'].length; i++) {
                        subjects.push(data.message['exam_info'][i].subjects);
                    }
                    for (let i = 0; i < data.message['exam_info'].length; i++) {
                        topics.push(data.message['exam_info'][i].topic);
                    }
                    var subject = subjects.filter(function(elem, index, self) {
                        return index === self.indexOf(elem);
                    });
                    var topic = topics.filter(function(elem, index, self) {
                        return index === self.indexOf(elem);
                    });

                    let html = $('<div class="row" style="background: #fafbfc;border-bottom: 1px solid #d1d8dd;border-radius: 0;margin-left: -20px;margin-right: -20px;margin-top: -15px;border-radius: 8px 8px 0px 0;"><div class="col-md-4"><p style="margin:20px 0"><b> Name :</b> ' + exam['user_list'][0].candidate_name + '</p><p style="margin:20px 0"> <b>Email :</b> ' + cur_frm.doc.user + '</p><p style="margin:20px 0"> <b>Subject :</b> ' + subject.join(', ') + '</p></div><div class="col-md-4"><p style="margin:20px 0"> <b>Question Paper Id : </b>' + cur_frm.doc.exam_id + '</p><p style="margin:20px 0"> <b>Question Paper Name :</b> ' + exam['exam_info'][0].question_paper_name + '</p><p style="margin:20px 0"><b> Topics : </b>' + topic.join(', ') + '</p></div><div class="col-md-4"><p style="margin:20px 0"> <b> Number Of Questions :</b> ' + cur_frm.doc.total_noof_questions + '</p> <p style="margin:20px 0"> <b>Start Time :</b> ' + cur_frm.doc.exam_start_date + '</p><p style="margin:20px 0"> <b>End Time :</b> ' + cur_frm.doc.exam_end_date + '</p><p style="margin:20px 0"> <b>Total Correct Answers :</b> ' + cur_frm.doc.total_secured_marks + '</p></div></div>').appendTo(wrapper);
                   
                }
            }
        })
    }

});


function send_mail() {
    let dialog = new frappe.ui.Dialog({
        title: 'Exam Result',
        fields: [{
            "fieldname": "email",
            "label": __("Email"),
            "fieldtype": "Data",
            "reqd": 1
        }, ]
    });
    dialog.set_primary_action(__('Send'), function() {

    })
    dialog.show();
}

function close_video(){
	setTimeout(function(){
		$(document).mouseup(function(e) {
			var container = $('[class="modal-content"]');
			if (!container.is(e.target) && container.has(e.target).length === 0) 
			{
				$('.video').attr('src', '')
			}
		});
	}, 250)
}