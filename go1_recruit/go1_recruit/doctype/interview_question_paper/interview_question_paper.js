
frappe.provide("go1_recruit.interview_question_paper");


frappe.ui.form.on('Interview Question Paper', {
  
    refresh: function(frm) {
        cur_frm.trigger('options_html')
        //Topic 
        $('div[data-fieldname="topics"]').on('click', function() {
            var questions_lists = []
            if (cur_frm.doc.topics) {
                questions_lists = cur_frm.doc.topics.map(val => val.topic)
            }
            var subjects_lists = []
            if (cur_frm.doc.subject) {
                subjects_lists = cur_frm.doc.subject.map(val => val.subjects)
            }
            if (questions_lists.length > 0 && subjects_lists.length >0) {
                cur_frm.set_query("topics", function(doc) {
                    return {
                        "filters": {
                            "subject": ["in",subjects_lists],
                          
                            "name": ["not in", questions_lists]
                        }
                    }
                })
            }
        })

        //Subject
        $('[data-fieldname="subject"] .control-input.form-control.table-multiselect').click(function(){
           
            var questions_lists = []
            if (cur_frm.doc.subject) {
                questions_lists = cur_frm.doc.subject.map(val => val.subjects)
            }
            if (questions_lists.length > 0) {

                cur_frm.set_query("subject", function(doc) {
                    return {
                        "filters": {
                            "name": ["not in", questions_lists]
                        }
                    }
                })
            }
            else{

                cur_frm.set_query("subject", function(doc) {
                    return {
                        "filters": {
                            "name": ["not in", []]
                        }
                    }
                })

            }
        })

        $('div[data-fieldname="questions"] .grid-footer .grid-add-multiple-rows').removeClass('hide');
        $('div[data-fieldname="questions"] .grid-footer .grid-add-row').addClass('hide');
        $('div[data-fieldname="questions"] .grid-footer .grid-add-multiple-rows').addClass('hidden');
       


        $('.addQuestions').click(function() {
            cur_frm.trigger('get_all_questions_list')
        })
       

        $('button[data-fieldname="auto_generate_questions"]').addClass('btn-primary')
        $('button[data-fieldname="auto_generate_questions"]').removeClass('btn-xs')
        $('button[data-fieldname="pick_the_question"]').addClass('btn-primary')
      
        $('button[data-fieldname="pick_the_question"]').removeClass('btn-xs')
        
       
    
        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.questionpaper_candidates_count',
            args: { questionpaper_id: cur_frm.doc.name },
            async: false,
            callback: function(data) {
                frappe.candidates_mailed_count = data.message[0].count;
            }
        })

      
        if (cur_frm.doc.docstatus == 1) {
            cur_frm.add_custom_button(__('Mail Candidates'), function() {
                if (cur_frm.doc.mail_sent == 0) {
                    var msg="Do you want to mail this question paper to the candidates?<br><br><b>NOTE:</b>You can not add/remove question after mailing the candidates!";
                
                    frappe.confirm(__(msg), () => {
                        cur_frm.trigger('mail_candidates')
                    });
                } else {
                    var msg="Do you want to mail this question paper to the candidates?<br><br><b>NOTE:</b>You can not add/remove question after mailing the candidates!";
                  
                    frappe.confirm(__(msg), () => {
                        cur_frm.trigger('mail_candidates')
                    });
                }
            });
        }

        if (cur_frm.doc.docstatus == 1) {
             cur_frm.add_custom_button(__('Copy Question Paper'), function() {
                    var msg="Are you sure want to duplicate this Question Paper?";
                     frappe.confirm(__(msg), () => {
                         frappe.call({
                            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.validate_question_paper',
                            args: {
                                "question_paper_id":cur_frm.doc.name
                            },
                            async: false,
                            callback: function(r) {
                                if(r.message.status=="Failed"){
                                    frappe.msgprint(__(r.message.message))
                                }
                                else{
                                    window.location.href="/desk#Form/Interview%20Question%20Paper/"+r.message.message
                                }
                            }
                        })
                     });
             });

        }

        // $(cur_frm.$wrapper).find('button[data-label="Mail%20Candidates"]').attr('style', "background:green;color:#ffffff;height: 26px");
        // $(cur_frm.$wrapper).find('button[data-label="Mail%20Candidates"]').html("<i class='fa fa-envelope' style='margin-right:5px'></i> Mail Candidates");
        // $(cur_frm.$wrapper).find('button[data-label="Copy%20Question%20Paper"]').html("<i class='fa fa-clone' style='margin-right:5px'></i> Copy Question Paper");

        // $(cur_frm.$wrapper).find('button[data-label="Copy%20Question%20Paper"]').attr('style', "background:#ff5858;color:#ffffff;height: 26px;border-color:#ff5858;margin-left: 15px;");

        
        if (!frappe.all_timezones) {
            frappe.call({
                method: "frappe.core.doctype.user.user.get_timezones",
                callback: function(r) {
                    var timezones = [];
                    for (var i = 0; i < r.message.timezones.length; i++) {
                        if (r.message.timezones[i].includes("America") == true) {
                            timezones.push(r.message.timezones[i])
                        }
                    }
                    frappe.all_timezones = timezones;
                    update_tz_select();
                }
            });
        } else {
            update_tz_select();
        }
        
    },
  
    auto_generate_questions: function(frm) {
  
        auto_generate_questions_dialog()
    },


    pick_the_question: function(frm) {
        cur_frm.trigger('get_all_questions_list')
    },



subject: function(frm) {
    if (cur_frm.doc.subject) {
        cur_frm.set_value('topics', '')
        var subjects_lists = []

        if (cur_frm.doc.subject) {
            subjects_lists = cur_frm.doc.subject.map(val => val.subjects)
        }

        cur_frm.set_query("topics", function() {                
            return {
                "filters": {
                    "subject": ["in", subjects_lists]
                }
            }
        })


        if(cur_frm.doc.all_topics == 1){
            var all_topic = []
            var subjects = []

            for(var i=0; i<cur_frm.doc.subject.length; i++){
                var subject = cur_frm.doc.subject[i].subjects;
                subjects.push({"name":subject})
            }
            
            frappe.call({
                method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_topics_list',
                args: {
                    "subjects":subjects
                },
                async: false,
                callback: function(r) {
                    if(r.message){
                        for(var i=0; i<r.message.length; i++){
                            all_topic.push({"topic":r.message[i].name})
                        }
                    }
                }
            })

            cur_frm.set_value('topics', all_topic)
            cur_frm.refresh_field("topics");
        }
    }
},


all_topics: function(frm){
    cur_frm.set_value('topics', '')
    if(cur_frm.doc.all_topics == 1){
            var all_topic = []
            var subjects = []
            for(var i=0; i<cur_frm.doc.subject.length; i++){
                var subject = cur_frm.doc.subject[i].subjects;
                subjects.push({"name":subject})
            }
            frappe.call({
                method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_topics_list',
                args: {
                    "subjects":subjects
                },
                async: false,
                callback: function(r) {
                    if(r.message){
                        for(var i=0; i<r.message.length; i++){
                            all_topic.push({"topic":r.message[i].name})
                        }
                    }
                }
            })
            cur_frm.set_value('topics', all_topic)
            cur_frm.refresh_field("topics");
        }
},


get_all_questions_list: function(frm) {
    let d = {
        'subject': cur_frm.doc.subject,
        'topics': cur_frm.doc.topics,
        'page_no': 1,
        'page_len': 5
    }
    cur_frm.questions_list = [];
    new go1_recruit.PickQuestions({
        subject: cur_frm.doc.subject,
        topics: cur_frm.doc.topics,
        page_len: 3,
        no_of_questions: cur_frm.doc.noof_questions,
        questions_list: cur_frm.doc.questions
    })
},

get_all_questions_list1: function(frm) {
    frappe.call({
        method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.create_level_and_type_combination',
        args: { subject: cur_frm.doc.subject, topic: cur_frm.doc.topics },
        async: false,
        callback: function(data) {
            if (data.message) {
                if (data.message.length > 0) {
                    
                    cur_frm.combination = data.message;
                    let combination = data.message;
                    questions_dialog2(combination);
                }
            } else {
                frappe.throw(__("No questions found!"))
            }

        }
    })

},


mail_candidates: function(frm) {
    if (cur_frm.doc.questions.length > 0 && cur_frm.doc.candidate_list.length > 0) {
        
        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.insert_mail_to_candidates',
            args: {
                question_paper_id: cur_frm.doc.name
            },
            callback: function(r) {
                if(r.message){
					var message = ""
					if (r.message.status == "success") {
						message= "Mail has been sent to the interview members!";
					
						frappe.show_alert(message);
						frappe.current_mailCount = r.message.count
					} else if (r.message.status == "failure") {
						message = "Mail for the existing candidates has already been sent!<br>Please add new candidates and try again."
						frappe.throw(__(message))
					} else if (r.message.status == "default_email_not_set") {
						message = "Please set a default email account for outgoing messages in this site."	
						frappe.throw(__(message))
					}
                }
            }
        });
        
    } else if (cur_frm.doc.questions.length == 0) {
        var msg="Please add questions!"
        
        frappe.msgprint(__(msg))
    } else if (cur_frm.doc.candidate_list.length == 0) {
        var msg="Please add candidates!"
        
        frappe.msgprint(__(msg))
    }
},


options_html: function(frm) {
    if (!cur_frm.doc.__islocal) {
    let wrapper = $(cur_frm.get_field('questions_html').wrapper).empty();
    let table_html = ""
    if (cur_frm.doc.mail_sent == 0) {
        table_html = $(`<table class="table table-bordered" style="cursor:pointer; margin:0px;">
            <thead>
                <tr>
                    <th>S.no</th>
                    <th style="width: 45%;">Question</th>
                    <th style="width:12%;">Subject</th>
                    <th style="width:18%;">Topic</th>
                    <th style="width:10%;">Question Type</th>
                    <th style="width:10%;">Question Level</th>
                    <th style="width:25%;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`).appendTo(wrapper);
    } else {
        table_html = $(`<table class="table table-bordered" style="cursor:pointer; margin:0px;">
            <thead>
                <tr>
                    <th>S.no</th>
                    <th style="width: 45%;">Question</th>
                    <th style="width:12%;">Subject</th>
                    <th style="width:18%;">Topic</th>
                    <th style="width:10%;">Question Type</th>
                    <th style="width:10%;">Question Level</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`).appendTo(wrapper);
    }
    var s_no = 0
    if (cur_frm.doc.questions.length > 0) {
        cur_frm.doc.questions.map(f => {
            s_no += 1;
            f.s_no = s_no;
            let row_data = ""
            if (cur_frm.doc.mail_sent == 0) {
                row_data = $(`<tr data-id="${f.name}" data-idx="${f.idx}">
                    <td>${f.s_no}</td>
                    <td>${f.question}</td>
                    <td>${f.subject}</td>
                    <td>${f.topic}</td>
                    <td>${f.question_type}</td>
                    <td>${f.question_level}</td>
                    <td><button class="btn btn-xs btn-danger" style="margin-right:10px;">Delete</button>
                    </td>
                </tr>`);
            } else {
                row_data = $(`<tr data-id="${f.name}" data-idx="${f.idx}">
                    <td>${f.s_no}</td>
                    <td>${f.question}</td>
                    <td>${f.subject}</td>
                    <td>${f.topic}</td>
                    <td>${f.question_type}</td>
                    <td>${f.question_level}</td>
                </tr>`);
            }
            table_html.find('tbody').append(row_data);
        });
    } else {
        table_html.find('tbody').append(`<tr><td colspan="7" align="center">No records found!</td></tr>`);
    }
    $(cur_frm.get_field('questions_html').wrapper).find('tbody .btn-danger').on('click', function() {
        let id = $(this).parent().parent().attr('data-id');
        var msg = "Do you want to delete this question?"
        
        frappe.confirm(msg, () => {
            if (id) {
                frappe.call({
                    method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.delete_question',
                    args: {
                        name: id
                    },
                    callback: function(f) {
                        cur_frm.trigger('options_html')
                        cur_frm.reload_doc()
                    }
                })
            }
        })
    })
}
},
});


var update_tz_select = function(user_language) {
    frappe.meta.get_docfield("Interview Candidates", "time_zone", cur_frm.docname).options = [""].concat(frappe.all_timezones);
}


//Autogenerating the Questions
var dialog;
function auto_generate_questions_dialog(frm) {
    var auto_add_queslevels = []
    frappe.call({
                method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.auto_add_questionlevels',
                args: {
                },
                callback: function(r) {
                    if(r.message){
                        for(var i=0; i<r.message.length; i++){
                            auto_add_queslevels.push({"question_level":r.message[i].question_level})
                        }
                    }
                }
            })
    $("#OptionsData").remove();
    var topics = cur_frm.doc.topic
    var questions_list = [];


    let dialog = new frappe.ui.Dialog({
        title: __("Auto Generate Questions"),
        fields: [
            { fieldname: "modal_questin_types_heading", fieldtype: "Heading", label: "Question Types" },
            { fieldname: "modal_single_questions", fieldtype: "Check", label: "Single", default: 1 },
            { fieldname: "modal_multiple_questions", fieldtype: "Check", label: "Multiple", default: 1 },
            { fieldname: "modal_freetext_questions", fieldtype: "Check", label: "Free Text", default: 1 },
            { fieldname: "audio_frm_questions", fieldtype: "Check", label: "Audio", default: 1 },
            { fieldname: "modal_freeform_codecompiler", fieldtype: "Check", label: "Coding Question", default: 1 },
            { fieldname: "modal_questin_levels_heading", fieldtype: "Heading", label: "Question Levels" },
            { fieldname: "modal_question_levels", fieldtype: "Table MultiSelect", options: "Question Level Link" },
            { fieldtype: 'Button', fieldname: 'apply_pattern', label: __("Apply pattern") },
            { fieldtype: "Column Break", fieldname: "column_break" },
            { fieldname: 'refresh', fieldtype: 'Button', label: __("Refresh") },
            { fieldname: 'ht', fieldtype: 'HTML' },
            { fieldname: 'preview', fieldtype: 'Button', label: __("Preview"), hidden: 1 },
            { fieldname: 'htl', fieldtype: 'HTML', hidden: 1 }
        ]
    });


    console.log(auto_add_queslevels)
    dialog.set_value('modal_question_levels',auto_add_queslevels);
    


    let height = String($(window).height() - 40) + "px"
    // $(dialog.$wrapper).find('.modal-content').css("height", height);
    $(dialog.$wrapper).find('div[data-fieldname="modal_question_levels"]').css('margin-top', '-30px')
    $(dialog.$wrapper).find('button[data-fieldname="refresh"]').parent().parent().parent().parent().css({"z-index":"9999999"})
    $(dialog.$wrapper).find('[class="modal-header"]').css({"z-index":"99999999"})

    $(dialog.$wrapper).find('button[data-fieldname="refresh"]').css({"padding": "5px 10px", "margin-right":"10px", "float": "right", "background": "#488fdb", "color": "white"})
    $(dialog.$wrapper).find('div[data-fieldname="modal_single_questions"]').parent().parent().removeClass('col-sm-6')
    $(dialog.$wrapper).find('div[data-fieldname="modal_single_questions"]').parent().parent().addClass('col-sm-3')
    $(dialog.$wrapper).find('div[data-fieldname="modal_single_questions"]').parent().parent().parent().parent().css('padding', '0px')
    $(dialog.$wrapper).find('div[data-fieldname="modal_single_questions"]').parent().parent().css({ "height": String($(window).height() - 99.5) + "px", "background-color": "#eee", "border-right": "1px solid #ddd" });
    $(dialog.$wrapper).find('div[data-fieldname="ht"]').parent().parent().removeClass('col-sm-6')
    $(dialog.$wrapper).find('div[data-fieldname="ht"]').parent().parent().addClass('col-sm-9')
    $(dialog.$wrapper).find('div[data-fieldname="ht"]').parent().parent().css({ "height": String($(window).height() - 99.5) + "px", "overflow-y": "auto"});
    $("button[data-fieldname='ht']").attr("style", "padding: 5px 10px;font-size: 12px;line-height: 1.5;border-radius: 3px;color: #fff;background-color: #2ecc71;border-color: #2ecc71;");
    $(dialog.$wrapper).find(".modal-dialog").css("max-width", "90%");
    $(dialog.$wrapper).find(".modal-body").css("padding", "0 15px 0 0");
    $(dialog.$wrapper).find(".form-section .form-column:first-child").css("padding", "15px");
    $(dialog.$wrapper).find('button[data-fieldname="apply_pattern"]').removeClass('btn-xs');
    $(dialog.$wrapper).find('button[data-fieldname="apply_pattern"]').addClass('btn-sm btn-primary');
    dialog.$wrapper.find('.form-section').css('max-height', height)
    // dialog.$wrapper.find('.form-section').css('overflow-y', 'auto')
    dialog.$wrapper.find('.buttons').find($(".btn-primary")).attr("disabled", true);

    
    dialog.set_primary_action(__('Add'), function() {
        add_questions_to_paper(dialog)

    })

    dialog.show();
    html_pattern(dialog)

    setTimeout(function() {
        cur_dialog.get_field('modal_question_levels').refresh();
        all_questions_list(dialog);
    }, 500);

    dialog.fields_dict.apply_pattern.input.onclick = function() {
        all_questions_list(dialog);
    }

    dialog.fields_dict.refresh.input.onclick = function() {
        all_questions_list(dialog);
    }


    function all_questions_list(dialog) {
        let values = dialog.get_values();
        let ques_level_values = dialog.fields_dict.modal_question_levels.get_value()
        var ques_types = []
        var ques_level = []
        if (values.modal_freeform_codecompiler == 1) {
            ques_types.push('Coding Question')
        }
        if (values.modal_freetext_questions == 1) {
            ques_types.push('Free Text')
        }
         if (values.audio_frm_questions == 1) {
            ques_types.push('Audio')
        }
        if (values.modal_multiple_questions == 1) {
            ques_types.push('Multiple')
        }
        if (values.modal_single_questions == 1) {
            ques_types.push('Single')
        }

        if (ques_level_values.length > 0) {
            for (var i = 0; i < ques_level_values.length; i++) {
                ques_level.push(ques_level_values[i].question_level)
            }
        }
        if (ques_types.length > 0 && ques_level.length > 0) {
            frappe.call({
                method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.create_level_and_type_combination2',
                args:  { subject: cur_frm.doc.subject, topic: cur_frm.doc.topics, types: ques_types, levels: ques_level ,
                      },
                async: false,
                callback: function(data) {
                    if (data.message) {
                        if (data.message.length > 0) {
                            questions_list = (data.message)
                            html_pattern(dialog)
                        } else {
                            var msg = "No questions found!"
                            frappe.throw(__(msg))
                        }
                    } else {
                        var msg = "No questions found!"                    
                        frappe.throw(__(msg))
                    }

                }
            })
        } else {
            var msg='Please select values in Both "Question Types" and "Question Levels" to generate a pattern !'
            if(frappe.boot.custom_alerts.autogenerate_select_both_type_and_level){
                msg = frappe.boot.custom_alerts.autogenerate_select_both_type_and_level
            }
            frappe.throw(__(msg))
        }

    }


    
    function add_questions_to_paper(dialog) {
        var selectedQuestions = [];
        $("#OptionsData tbody tr").each(function() {
            var check_box = $(this).find('td:eq(3)').find($("input[type='text'][name='question']")).val();
            if (check_box > 0) {
                let obj = {};
                obj.question_type = $(this).find('td:eq(0)').text();
                obj.question_level = $(this).find('td:eq(1)').text();
                obj.no_of_questions = $(this).find('td:eq(3)').find($("input[type='text'][name='question']")).val();
                selectedQuestions.push(obj)
            }
        });
        let result12 = selectedQuestions
        var question_type1 = 0;
        var check_box1 = [];
        $("#OptionsData tbody tr").each(function() {
            check_box1 = $(this).find('td:eq(3)').find("input[type='text'][name='question']").val();
            if (check_box1 > 0) {
                question_type1 += parseInt($(this).find('td:eq(3)').find("input[type='text'][name='question']").val());
            }
        })
        let allowsubmit = true;
        $("#OptionsData tbody tr input[type='text']").each(function() {
            var quest = $(this).parent().parent().find('td:eq(3)').find("input[type='text']").val();
            if (quest == '' || quest == undefined || quest == null) {
                allowsubmit = false;
                frappe.throw(__('Please Enter the Number Of Questions'))
            } else {
                if (question_type1 > cur_frm.doc.noof_questions) {
                    allowsubmit = false;
                    frappe.throw(__('Maxmimum allowed questions is ' + cur_frm.doc.noof_questions))
                }
            }
        })
        let questions_lists = ''
        if (cur_frm.doc.topics) {
            $(cur_frm.doc.topics).each(function(k, v) {
                questions_lists = questions_lists + '"' + v.topic + '",';
            })
        }
        questions_lists = questions_lists.slice(0, -1)
        var question_ids = []
        var html = '<input type="hidden" id="hdnQuestionid"/><table class="table table-bordered" id="hdnQuestionid"><thead style="background: #F7FAFC;"><tr><th>Question</th></tr></thead>';
        if (allowsubmit) {
            frappe.call({
                method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_random_questions',
                args: {
                    questions: selectedQuestions,
                    subject: cur_frm.doc.subject,
                    topic: cur_frm.doc.topics,
                    question_paper_id: cur_frm.doc.name
                },
                async: false,
                callback: function(r) {
                    if (r.message.length > 0) {
                        for (var i = 0; i < r.message.length; i++) {
                            question_ids.push({ "question": r.message[i].name })
                        }
                    }
                  
                }
            })
            if (question_ids.length > 0) {
                frappe.call({
                    method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.update_questions_for_question_paper1',
                    args: {
                        questions: question_ids,
                        question_paper_id: cur_frm.doc.name
                    },
                    async: false,
                    callback: function(r) {
                        location.reload();
                    }
                })
            }
        }
    }


    function html_pattern(dialog) {
        var max_count = cur_frm.doc.noof_questions
        var html = '<input type="hidden" id="hdnAttributeOptionid"/><p>Please choose the pattern and number of question</p><table class="table table-bordered" id="OptionsData"><thead style="background: #F7FAFC;"><tr><!--<th></th>--><th style="width: 30%;">Question Type</th><th style="width: 30%;">Question Level</th><th style="width: 15%;">Available Questions</th><th style="width: 15%;">Number Of Questions</th></tr></thead>';
        html += `<script>
					function IncrementQty(element) {
						var input = element.siblings('input[name="question"]');
						var max = parseInt(input.attr('max'));
						var value = parseInt(input.val());
						if (value < max) {
							input.val(value + 1);
						}
					}
					function DecrementQty(element) {
						var input = element.siblings('input[name="question"]');
						var value = parseInt(input.val());
						if (value > 0) {
							input.val(value - 1);
						}
					}
				</script>`
		html += '<tbody>';
        if (questions_list.length > 0) {
            
            
            for (var i = 0; i < questions_list.length; i++) { 
     
                var num = 0;
                var random_limit=0;
                if(questions_list[i].count <= max_count){
                    random_limit = questions_list[i].count
                }else{
                    random_limit = max_count
                }
                var random_num = Math.floor(Math.random() * random_limit);
                if(random_num <= max_count){
                    num = random_num
                    max_count = max_count-num
                }

    
                html += ' <tr><!--<td>' + '<input type="checkbox" name="checkbox" class="check">' + '</td>--> ';
                html += '<td>' + questions_list[i].question_type + '</td> ';
                html += ' <td>' + questions_list[i].question_level + '</td> ';
                html += ' <td>' + questions_list[i].count + '</td> ';
                html += ' <td align="center">';
                html += '<a id="decr_count-' + i + '" data-addons="" onclick="DecrementQty($(this))" style="background: #f3f4f5; border: 1px solid #ddd; padding: 1.5px 8px;"><i class="fa fa-minus" aria-hidden="true" style="color: #36414c;"></i></a>';
                html += '<input type="text" name="question" id="combination-' + i + '" min="0" max="' + questions_list[i].count + '" onkeyup="key_press_validation($(this))" class="texts" value ="'+num+'" style="width: 50px; text-align: center; margin: 0; border: 1px solid #ece5e5;"></input>';
                html += '<a id="incr_count-' + i + '" onclick="IncrementQty($(this))" style="background: #f3f4f5; border: 1px solid #ddd; padding: 1.5px 8px;"><i class="fa fa-plus" aria-hidden="true" style="color: #36414c;"></i></a>';
                html += '</td></tr> ';
            }
        } else {
            html += '<tr><td colspan="4">No records found!</td></tr>'
        }
        html += '</tbody>';
        html += '</table>';

        dialog.fields_dict.ht.$wrapper.html(html);

        
        if(max_count>0){
            var i = 0;
            do {
                dialog.fields_dict.ht.$wrapper.find('tbody').find('tr').each(function(){
                    var max =  parseInt($(this).find('input').attr('max'));
                    var value = parseInt($(this).find('input').val());
                    if(value<max && max_count>0){
                        $(this).find('input').val(value+1)
                        max_count = max_count - 1;
                    }
                });
                i++
            }while (max_count>=i);
        }
       
    }

}

   
  
function IncrementQty(element) {
    var input = element.siblings('input[name="question"]');
    var max = parseInt(input.attr('max'));
    var value = parseInt(input.val());
    if (value < max) {
        input.val(value + 1);
    }
}

function DecrementQty(element) {
    var input = element.siblings('input[name="question"]');
    var value = parseInt(input.val());
    if (value > 0) {
        input.val(value - 1);
    }
}

function key_press_validation(element) {
    var input = element;
    var max = parseInt(input.attr('max'));
    var value = parseInt(input.val());
    if (value < 0 || value > max) {
        frappe.throw(__('Value must be between 0 and {0}', [max]));
        input.val(0);
    }
}


frappe.ui.form.on('Interview Question Paper', {
    refresh: function(frm) {
        var subjects_lists = []
            if (cur_frm.doc.subject) {
                subjects_lists = cur_frm.doc.subject.map(val => val.subjects)
            }
        cur_frm.set_query("topics", function(doc) {
            return {
                "filters": {
                    "subject": ["in",subjects_lists]
                    
                }
            }
        })
    }
})




//Manual Selection 
go1_recruit.PickQuestions = Class.extend({
    init: function(opts) {
        this.opts = opts;
        this.questions_list = [];
        this.total_records = 0;
        this.page_no = 1;
        this.question_html = '';
        this.selected_questions_list = [];
        this.max_questions = opts.no_of_questions;
        this.already_added_questions = opts.questions_list;
        this.setup();
    },

    setup: function() {
        let me = this;
        frappe.run_serially([
            () => {
                me.args = {};
                me.args.subject = me.opts.subject;
                me.args.topics = me.opts.topics;
                me.args.page_no = me.page_no;
                me.args.page_len = me.opts.page_len;
                me.args.question_paper = cur_frm.doc.name;
                me.get_questions_list();
            },
            () => {
                me.construct_question_list();
            },
            () => {
                me.selected_question_html();
            },
            () => {
                me.tab_html();
            },
            () => {
                me.make_dialog();
            }
        ])
    },

    get_questions_list: function() {
        var me = this;
    
        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_questions_list',
            args: me.args,
            async: false,
            callback: function(data) {
                if (data.message) {
                    if (data.message.questions.length > 0) {
                        me.questions_list = data.message.questions;
                        me.total_records = data.message.count;
                    } else {
                        me.questions_list = [];
                        me.total_records = 0;
                    }
                } else {
                    me.questions_list = [];
                    me.total_records = 0;
                }
            }
        });
    },
    

    construct_question_list: function() {
        var me = this;
        var html = $(`
            <p>Click on any question to select it.</p>
            <div class="pickQuestions">
                <table class="table table-bordered" style="cursor:pointer; margin:0px;">
                    <thead>
                        <tr>
                            <th style="width:45%">Question</th>
                            <th style="width:12%">Subject</th>
                            <th style="width:18%">Topic</th>
                            <th style="width:10%">Question Level</th>
                            <th style="width:10%">Question Type</th>                    
                            <th style="width:8%">Visibility</th>
                            <th style="width:15%"></th>
                        </tr>
                    </thead> 
                    <tbody> </tbody>
                </table>
            </div>
            <div class="page-list" style="margin-top:20px;"></div>
            <style>.page-list{text-align: right;}.page-list .active{background: #5e646b;}.page-list button{margin-left: 5px;}</style>
        `);
    
        if (me.questions_list && me.questions_list.length > 0) {
            me.questions_list.forEach(question => {
                if (question.is_private == 1) {
                    question.type = '<span class="indicator red">Private</span>';
                } else {
                    question.type = '<span class="indicator green">Public</span>';
                }
    
                question.check_existing = undefined;
                if (me.selected_questions_list.length > 0) {
                    question.check_existing = me.selected_questions_list.find(obj => obj.name == question.name);
                } else if (me.already_added_questions.length > 0) {
                    question.check_existing = me.already_added_questions.find(obj => obj.interview_question == question.name);
                }
    
                if (!question.check_existing) {
                    question.button = `
                        <div class="text-center">
                            <button type="button" data-id="${question.name}" class="btn btn-warning add-question" style="width: 72px; display: block;">Add</button>
                            <button type="button" data-id="${question.name}" class="btn btn-danger remove-question" style="width: 72px; display: none;">Remove</button>
                        </div>`;
                } else {
                    question.button = `
                        <div class="text-center">
                            <button type="button" data-id="${question.name}" class="btn btn-danger remove-question" style="width: 72px; display: block;">Remove</button>
                            <button type="button" data-id="${question.name}" class="btn btn-warning add-question" style="width: 72px; display: block;">Add</button>
                        </div>`;
                }
    
                let row_data = $(`
                    <tr class="lists" data-id="${question.name}">
                        <td>${question.question}</td>
                        <td>${question.subject}</td>
                        <td>${question.topic}</td>
                        <td>${question.question_level}</td>
                        <td>${question.question_type}</td>
                        <td>${question.type}</td>
                        <td>${question.button}</td>                    
                    </tr>`);
                
                html.find('tbody').append(row_data);
            });
        } else {
            html.find('tbody').append(`<tr><td colspan="7">No records found!</td></tr>`);
        }
    
        me.question_html = html;
    },
    

    selected_question_html: function() {
        let me = this;
        me.selected_question_html = $(`<h4>Selected Questions</h4>
        <div class="selectedQuestion"><table class="table table-bordered" style="cursor:pointer; margin:0px;background:#f1f1f1;">
                <thead>
                    <tr>
                    
                        <th>Question</th>
                    </tr>
                </thead> 
                <tbody><tr id="no-record"><td colspan="1">No Records Found!</td></tr></tbody>
        </table></div>`);
       
    },

    tab_html: function() {
        this.tab_html = $(`<div class="tab">
            <ul>
                <li class="active" id="question">Add Question</li>
                <li id="view">Selected Questions <span class="badge">0</span></li>
            </ul>
        </div>
        <style>.tab{margin:0 20%;text-align:center;}.tab ul{list-style:none;display:flex;}.tab ul li{padding:10px 40px;font-size:15px;font-weight:500;}.tab ul li.active{border-bottom:3px solid #1b8fdb;}.tab ul li .badge{background: #1b8fdb;color: #fff;}</style>`);
    },


    make_dialog: function() {
        var me = this;
        let sub_arr = [];
        let topic_arr = [];
    
     
        $(this.opts.subject).each(function(k, v) {
            sub_arr.push(v.subjects);
        });
    
        $(this.opts.topics).each(function(k, v) {
            topic_arr.push(v.topic);
        });
    
      
        this.dialog = new frappe.ui.Dialog({
            title: __('Questions'),
            fields: [
                { fieldtype: 'Heading', fieldname: 'heading', label: __("Filters") },
                {
                    fieldtype: 'Select',
                    fieldname: 'question_type',
                    options: '\nSingle\nMultiple\nFree Text\nCoding Question\nAudio',
                    label: __("Question Type"),
                },
                {
                    fieldtype: 'Link',
                    fieldname: 'question_level',
                    options: 'Question Level',
                    label: __("Question Level"),
                },
                {
                    fieldtype: 'Table MultiSelect',
                    fieldname: 'subject',
                    label: __("Subjects"),
                    options: 'Question Paper Subject',
                    get_query: function() {
                        return {
                            filters: {
                                name: ['in', sub_arr],
                            },
                        };
                    },
                },
                {
                    fieldtype: 'Table MultiSelect',
                    fieldname: 'topics',
                    label: __("Topics"),
                    options: 'Question Paper Topics',
                    height: 10,
                    get_query: function() {
                        return {
                            filters: {
                                subject: ['in', sub_arr],
                                name: ['in', topic_arr],
                            },
                        };
                    },
                },
                { fieldtype: 'Button', fieldname: 'apply_filters', label: __("Apply Filters") },
                { fieldtype: 'Column Break', fieldname: 'cb1' },
                { fieldtype: 'HTML', fieldname: 'tab_html', options: me.tab_html },
                { fieldtype: 'HTML', fieldname: 'question_list', options: me.question_html, depends_on: 'eval:doc.view_enable != 1' },
                { fieldtype: 'HTML', fieldname: 'selected_question', options: me.selected_question_html, depends_on: 'eval:doc.view_enable == 1' },
                { fieldtype: 'Check', fieldname: 'view_enable', hidden: 1 },
            ],
        });
    
      
        me.set_dialog_primary_action();
        me.dialog_style();
    
       
        me.dialog.show();
        me.click_events();
        me.pagination();
        me.tab_click_event();
        me.apply_filters();
    },
    


    set_dialog_primary_action: function() {
        var me = this;
        me.dialog.set_primary_action(__('Submit'), function() {
            if (me.selected_questions_list.length > 0) {
                $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] tbody tr').each(function() {
                    if ($(this).attr('id') == 'no-records') {
                        // Skip if no records row
                    } else {
                        let row = frappe.model.add_child(cur_frm.doc, 'Question Paper Questions', 'questions');
                        row.interview_question = $(this).attr('data-id');
                    }
                });
                cur_frm.refresh_field('questions');
                cur_frm.save_or_update();
                me.dialog.hide();
                cur_frm.trigger('options_html')
            } else {
                var msg = "Please select any questions";
                frappe.throw(__(msg));
            }
        });
    },
    
 

    dialog_style: function() {
        let me = this;
        let height = String($(window).height() - 40) + "px"
        let scrollheight = ($(window).height() - 40) - 200
        $(me.dialog.$wrapper).find('.modal-dialog').css("min-width", "98%");
        $(me.dialog.$wrapper).find('.modal-content').css("height", height);
        $('.modal[data-types="question_list"').each(function() {
            $(this).remove();
        })
        $(me.dialog.$wrapper).attr('data-types', 'question_list')
        $(me.dialog.$wrapper).find('.form-section').css('padding', '0 7px');
        $(me.dialog.$wrapper).attr('data-types', 'question_list');
        setTimeout(function(){
        $('[data-fieldname="cb1"]').removeClass("col-sm-6").addClass("col-sm-10");

    },1000);
        $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"]').parent().parent().parent().parent().css('border-bottom', 'none')
        $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"]').parent().parent().parent().parent().css('padding', '0px')
        $(me.dialog.$wrapper).find('div[data-fieldname="question_type"]').parent().parent().removeClass('col-sm-6')
        $(me.dialog.$wrapper).find('div[data-fieldname="question_type"]').parent().parent().addClass('col-sm-2')
        $(me.dialog.$wrapper).find('div[data-fieldname="question_type"]').parent().parent().css({ "height": String($(window).height() - 99.5) + "px", "background-color": "#eee", "border-right": "1px solid #ddd" });
        $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').parent().parent().removeClass('col-sm-6')
        $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').parent().parent().addClass('col-sm-10')
        $(me.dialog.$wrapper).find('.modal-dialog').css('margin', '15px auto')
        $(me.dialog.$wrapper).find(".modal-body").css("padding", "0 15px 0 0");
        $(me.dialog.$wrapper).find(".form-section .form-column:first-child").css("padding", "15px");
        $(me.dialog.$wrapper).find('button[data-fieldname="apply_filters"]').removeClass('btn-xs');
        $(me.dialog.$wrapper).find('button[data-fieldname="apply_filters"]').addClass('btn-sm btn-primary');
       
    },

    click_events: function() {
        let me = this;
        me.add_question()
        me.remove_question()

    },

    add_question: function() {
        var me = this;
        $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] tbody .lists .add-question').click(function() {

            let question_id = $(this).attr('data-id');
            if ((me.selected_questions_list.length + me.already_added_questions.length) >= parseInt(me.max_questions)) {
                frappe.throw(__('Maximum allowed questions for this question paper is/are ' + me.max_questions))
            }


            let question_detail = { 'name': question_id, 'question': $(this).parent().parent().parent().find('td:eq(0)').html() };
            if (question_detail) {
                me.selected_questions_list.push(question_detail)
                if (question_detail) {
                    $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] table tbody #no-record').remove();
                    $(me.dialog.$wrapper).find('tr[data-id="' + question_id + '"]').find('td:eq(6)').find('.add-question').css("display", "none")
                    $(me.dialog.$wrapper).find('tr[data-id="' + question_id + '"]').find('td:eq(6)').find('.remove-question').css("display", "block")
                    let tr_count = $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] table tbody tr').length;
                    let row = '<tr data-id="' + question_detail.name + '"><td>' + question_detail.question + '</td></tr>';
                    $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] table tbody').append(row);
                }
            }

            $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"] .badge').text(me.selected_questions_list.length)
        })
    },


    remove_question: function() {
        var me = this;
        $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] tbody .lists .remove-question').click(function() {
            let question_id = $(this).attr('data-id');
            if (question_id) {
                for (var i = 0; i < me.selected_questions_list.length; i++)
                    if (me.selected_questions_list[i].name === question_id) {
                        me.selected_questions_list.splice(i, 1);
                        break;
                    }
                if (me.selected_questions_list.length == 0) {
                    let row = '<tr id="no-record"><td colspan="1">No Records Found!</td></tr>'
                    $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] table tbody').append(row)
                }
                $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"] table tbody').find('tr[data-id="' + question_id + '"]').remove();
                $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"] .badge').text(me.selected_questions_list.length)
                $(me.dialog.$wrapper).find('tr[data-id="' + question_id + '"]').find('td:eq(6)').find('.add-question').css("display", "block")
                $(me.dialog.$wrapper).find('tr[data-id="' + question_id + '"]').find('td:eq(6)').find('.remove-question').css("display", "none")
            }
            $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"] .badge').text(me.selected_questions_list.length)
        })

    },

    pagination: function() {
        var me = this;
        if (me.total_records > 0) {
            let count = me.total_records / me.opts.page_len;
            if (count % 1 === 0) {
                count = count
            } else {
                count = parseInt(count) + 1;
            }
            if (count) {
                let page_btn_html = '<button class="btn btn-default prev">Prev</button>';
                for (var i = 0; i < count; i++) {
                    let active_class = '';
                    if ((i + 1) == me.page_no)
                        active_class = 'active'
                    page_btn_html += '<button class="btn btn-info paginate ' + active_class + '" data-id="' + (i + 1) + '">' + (i + 1) + '</button>'
                }
                page_btn_html += '<button class="btn btn-default next">Next</button>';
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list').html(page_btn_html)
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list .paginate').click(function() {
                    if (me.page_no != parseInt($(this).text())) {
                        me.page_no = parseInt($(this).text());
                        me.paginate_questions()
                    }
                })
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list .prev').click(function() {
                    let pg_no = me.page_no - 1;
                    if (me.page_no > 0) {
                        me.page_no = me.page_no - 1;
                        me.paginate_questions()
                    }
                })
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list .next').click(function() {
                    let pg_no = me.page_no + 1;
                    if (pg_no <= count) {
                        me.page_no = me.page_no + 1;
                        me.paginate_questions()
                    }
                })
                if (count > 7) {
                    $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list .paginate').hide();
                    let arr = [me.page_no, me.page_no + 1, me.page_no + 2, me.page_no + 3, me.page_no + 4, me.page_no + 5, me.page_no + 6];
                    let pg = 1;
                    for (var i = 0; i < 7; i++) {
                        if (arr[i] > count) {
                            arr[i] = me.page_no - pg;
                            pg = pg + 1;
                        }
                    }
                    $(arr).each(function(k, v) {
                        $(me.dialog.$wrapper).find('div[data-fieldname="question_list"] .page-list .paginate[data-id="' + v + '"]').show();
                    })
                }
            }
        }
    },

    
    paginate_questions: function() {
        let me = this;
        let values = me.dialog.get_values();
      
        if (!values.subject) {
            values.subject = me.opts.subject;
        }
        values.page_len = me.opts.page_len;
        values.page_no = me.page_no;
        if (!values.topics) {
            values.topics = me.opts.topics;
        }
        values.question_paper = cur_frm.doc.name;
        me.args = values;
        me.get_quests();
    },

    get_quests: function() {
        let me = this;
        frappe.run_serially([
            () => {
                me.get_questions_list()
            },
            () => {
                let html = $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').find('tbody');
                html.empty();
                if (me.questions_list.length > 0) {
                    scroll = true;
                    if (me.questions_list && me.questions_list.length > 0) {
                        me.questions_list.map(f => {
                            if (f.is_private == 1) {
                                f.type = '<span class="indicator red">Private</span>';
                            } else {
                                f.type = '<span class="indicator green">Public</span>';
                            }
                            f.check_existing = undefined;
                            if (me.selected_questions_list.length > 0) {
                                f.check_existing = me.selected_questions_list.find(obj => obj.name == f.name);
                            } else if (me.already_added_questions.length > 0) {
                                f.check_existing = me.already_added_questions.find(obj => obj.interview_question == f.name)
                            }
                            if (!f.check_existing) {
                                f.button = '<div class="text-center"><button type="button" data-id="' + f.name + '" class="btn btn-warning add-question" style="width : 72px;display : block !important;">Add</button><button type="button" data-id="' + f.name + '" class="btn btn-danger remove-question" style="width : 72px;display : none !important;">Remove</button></div>'
                            } else {
                                f.button = '<div class="text-center"><button type="button" data-id="' + f.name + '" class="btn btn-danger remove-question" style="width : 72px;display : block !important;">Remove</button><button type="button" data-id="' + f.name + '" class="btn btn-warning add-question" style="width : 72px;display : none !important;">Add</button></div>'
                            }
                            let row_data = $(`<tr class="lists" data-id="${f.name}">
                                    <td>${f.question}</td>
                                    <td>${f.subject}</td>
                                    <td>${f.topic}</td>
                                    <td>${f.question_level}</td>
                                    <td>${f.question_type}</td>
                                    <td>${f.type}</td> 
                                    <td>${f.button}</td>                   
                                </tr>`);
                            html.append(row_data);
                        });
                    }
                } else {
                    html.append(`<tr><td colspan="4">No records found!</td></tr>`);
                }
                me.pagination();
            },
            () => {
                me.click_events();
            }
        ])
    },


    tab_click_event: function() {
        let me = this;
        $(me.dialog.$wrapper).find('div[data-fieldname="tab_html"] ul li').click(function() {
            $(this).parent().find('li').removeClass('active');
            $(this).addClass('active')
            if ($(this).attr('id') == 'view') {
                $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"]').removeClass('hide-control')
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').addClass('hide-control')
            } else {
                $(me.dialog.$wrapper).find('div[data-fieldname="selected_question"]').addClass('hide-control')
                $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').removeClass('hide-control')
            }
        })
    },

    apply_filters: function() {
        let me = this;
        me.dialog.fields_dict.apply_filters.input.onclick = function() {
            let values = me.dialog.get_values();
            if (!values.topics) {
                values.topics = me.opts.topics;
            }
            
            if (!values.subject) {
                values.subject = me.opts.subject;
            }
            values.page_no = 1;
            values.page_len = me.opts.page_len;
            values.question_paper = cur_frm.doc.name;
            me.page_no = 1;
            scroll = true;
            me.questions_list = [];
            let html = $(me.dialog.$wrapper).find('div[data-fieldname="question_list"]').find('tbody');
            me.args = values;
            me.get_quests()
        }
    },
 
})



//Adding candidates
frappe.ui.form.on('Interview Question Paper', {
    refresh: function(frm) {
        // $('button[data-fieldname="add_candidates"]').addClass('btn-primary')
        // $('button[data-fieldname="add_candidates"]').removeClass('btn-xs')
        cur_frm.trigger('candidate_html')
        cur_frm.trigger('shortlist_html')
    },


    add_candidates: function(frm) {
        cur_frm.edit_option = 0;
        cur_frm.trigger('option_dialog')
    },


    option_dialog: function(frm) {

        let title = 'Add Candidates';
        let primary_text = 'Add';
        var custom_time_zones = []

        frappe.call({
            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.get_custom_timezones',
            args: {},
            async: false,
            callback: function(data) {
                custom_time_zones = data.message

            }
        })
        let dialog = new frappe.ui.Dialog({
            title: __(title),
            fields: [{
                    "fieldtype": "Data",
                    "fieldname": "candidate_name",
                    "label": __("Candidate Name"),
                    "reqd": 1
                },

                {
                    "fieldtype": "Data",
                    "fieldname": "candidate_email",
                    "label": __("Candidate Email"),
                    "reqd": 1
                },
                {
                    "fieldtype": "Date",
                    "fieldname": "start_date",
                    "label": __("Start Date"),
                    "reqd": 1
                },
                {
                    "fieldtype": "Date",
                    "fieldname": "end_date",
                    "label": __("Test Expire Date"),
                    "reqd": 1
                },               
                

                {
                    "fieldtype": "Check",
                    "fieldname": "monitered_test",
                    "label": __("Monitored Test"),
                    "reqd": 0,
					"hidden": 1,
                    onchange: function() {
                        let val = this.get_value()
                        if(val == 0){
                            $(dialog.$wrapper).find('div[data-fieldname="candidate_video"]').hide()
                            $(dialog.$wrapper).find('div[data-fieldname="record_screen"]').hide()
                            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').hide()
                          
                            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').parent().parent().parent().parent().hide()
                           
                        }else{
                            $(dialog.$wrapper).find('div[data-fieldname="candidate_video"]').show()
                            $(dialog.$wrapper).find('div[data-fieldname="record_screen"]').show()
                            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').show()
                           
                            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').parent().parent().parent().parent().show()
                          
                        }
                    }
                },  
                {
                    "fieldtype": "Column Break",
                    "fieldname": "column_break262"
                },
                {
                    "fieldtype": "Select",
                    "fieldname": "time_zone",
                    "label": __("Time Zone"),
                    "options": custom_time_zones,
                    "reqd": 1,
                    onchange: function() {
                        let val = this.get_value()
                        $(cur_dialog.$wrapper).find('div[data-fieldname="start_time"] p.text-muted').text(val)
                        $(cur_dialog.$wrapper).find('div[data-fieldname="end_time"] p.text-muted').text(val)
                    }
                },
                {
                    "fieldtype": "Data",
                    "fieldname": "candidate_phone",
                    "label": __("Candidate Phone"),
                    "reqd": 1,
					"options": "Phone"
                },
                {
                    "fieldtype": "Datetime",
                    "fieldname": "start_time",
                    "label": __("Start Date"),
                    "hidden":1
                },
                {
                    "fieldtype": "Datetime",
                    "fieldname": "end_time",
                    "label": __("Test Expire Date"),
                    "hidden":1
                },
                {
                    "fieldtype": "HTML",
                    "fieldname": "start_time_html",
                    "label": __("Start Time")
                },
                {
                    "fieldtype": "HTML",
                    "fieldname": "end_time_html",
                    "label": __("Test Expire Time")
                },
                {
                    "fieldtype": "Check",
                    "fieldname": "mail_sent",
                    "label": __("Mail Sent"),
                    "reqd": 0,
                    "read_only": 1
                },
                {
                    "fieldtype": "Section Break",
                    "label": __("Video and screen sharing"),
                    "fieldname": "section_break262"
                },
              
                {
                    "fieldtype": "Data",
                    "fieldname": "interviewer_email",
                    "label": __("Interviewer Email"),
                    "reqd": 0
                },
                {
                    "fieldtype": "Column Break",
                    "fieldname": "column_break2626"
                },
                {
                    "fieldtype": "Check",
                    "fieldname": "candidate_video",
                    "label": __("Candidate Video"),
                    "default": 1,
                    "reqd": 0
                },
                {
                    "fieldtype": "Check",
                    "fieldname": "record_screen",
                    "label": __("Screen Share"),
                    "default": 1,
                    "reqd": 0
                }
            ]
        })
        $(dialog.$wrapper).find('div[data-fieldname="candidate_video"]').hide()
        $(dialog.$wrapper).find('div[data-fieldname="record_screen"]').hide()
        $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').hide()
        $(dialog.$wrapper).find('div[data-fieldname="interviewer_email"]').parent().parent().parent().parent().hide()
    
        let starttest_wrapper = $(dialog.$wrapper).find('div[data-fieldname="start_time_html"]').empty();
        let start_datetime_html = $(`<label class="control-label" style="padding-right: 0px;">Start Time</label>
            <div class="row"><div class="col-md-6"><select class="form-control hour_input" id="start_date_hour" style="width: 75%;float: left;"></select><span class="text-muted" style="line-height:38px; padding:5px;">hr</span></div>
            <div class="col-md-6"><select class="form-control min_input" id="start_date_min" style="width: 70%;float: left;"></select><span class="text-muted" style="line-height:38px; padding:5px;">min<span></div></div>`).appendTo(starttest_wrapper);
        let endtest_wrapper = $(dialog.$wrapper).find('div[data-fieldname="end_time_html"]').empty();
        let end_datetime_html = $(`<label class="control-label" style="padding-right: 0px;">Test Expire</label>
            <div class="row"><div class="col-md-6"><select class="form-control hour_input" id="end_date_hour" style="width: 75%;float: left;"></select><span class="text-muted" style="line-height:38px; padding:5px;">hr</span></div>
            <div class="col-md-6"><select class="form-control min_input" id="end_date_min" style="width: 70%;float: left;"></select><span class="text-muted" style="line-height:38px; padding:5px;">min<span></div></div>`).appendTo(endtest_wrapper);
       
        $(function () {
          var hours=''
          for(var i=0; i<24; i++){
              var myNumber = i;
              var formattedNumber = ("0" + myNumber).slice(-2);
              hours +='<option>'+formattedNumber+'</option>'
          }
          $(dialog.$wrapper).find('.hour_input').append(hours);
        });
        $(function () {
          var mins=''
          for(var i=0; i<60; i++){
              var myNumber = i;
              var formattedNumber = ("0" + myNumber).slice(-2);
              mins +='<option>'+formattedNumber+'</option>'
          }
          $(dialog.$wrapper).find('.min_input').append(mins);
        });

        $(dialog.$wrapper).find('div[data-fieldname="start_time"] p.text-muted').text('')
        $(dialog.$wrapper).find('div[data-fieldname="end_time"] p.text-muted').text('')

        dialog.set_primary_action(__(primary_text), function() {
            let values = dialog.get_values();
            var start_hour=($(dialog.$wrapper).find('#start_date_hour').val())
            var start_min=($(dialog.$wrapper).find('#start_date_min').val())
            var end_hour=($(dialog.$wrapper).find('#end_date_hour').val())
            var end_min=($(dialog.$wrapper).find('#end_date_min').val())
            values.start_time=values.start_date+' '+start_hour+':'+start_min+':00'
            values.end_time=values.end_date+' '+end_hour+':'+end_min+':00'
            if (new Date(values.start_time) < new Date(values.end_time)) {
                let allow = false;
                let allow2 = true;
                var emails = []
                for (var i = 0; i < cur_frm.doc.candidate_list.length; i++) {
                 
                    emails.push(cur_frm.doc.candidate_list[i].candidate_email)
                }
                if (jQuery.inArray(values.candidate_email, emails) == -1) {

                    allow = true;
                }
                if (values.monitered_test == 1){
                    if(values.interviewer_email != undefined){
                        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(values.interviewer_email)) {
                            allow2= true;
                        }else{
                            allow2= false;
                        }
                    }else{
                      allow2= false;  
                    }
                }else{
                    values.candidate_video=0;
                    values.record_screen=0;
                    values.interviewer_email= undefined;
                }
                if (allow) {
                    if(allow2){
                        let today = frappe.datetime.add_days(frappe.datetime.nowdate())
                        let child = frappe.model.add_child(cur_frm.doc, "Interview Candidates", "candidate_list");
                        child.candidate_name = values.candidate_name;
                        child.candidate_email = values.candidate_email;
                        child.candidate_phone = values.candidate_phone;
                        child.candidate_email = values.candidate_email;
                        child.interviewer_email = values.interviewer_email;
                        child.monitored_test = values.monitered_test;
                        child.candidate_video = values.candidate_video;
                        child.record_screen = values.record_screen;
                        child.time_zone = values.time_zone;
                        child.start_time = values.start_time;
                        child.end_time = values.end_time;
                        child.mail_sent = values.mail_sent;
                        cur_frm.refresh_field("candidate_list");
                        dialog.hide();
                        cur_frm.save_or_update();
                        
                    
                      
                    }else {
                        var msg ="Interviewer email not present/incorrect for monitored test!"
                        frappe.throw(__(msg));
                    }
                } else {
                    var msg ="Candidate email already added for this test paper!"
                    frappe.throw(__(msg));
                }
            } else {
                var msg ="Start time should be less than end time!"
                frappe.throw(__(msg));
            }
        })
        dialog.show();
        $(dialog.$wrapper).find('.ql-snow .ql-editor').css('min-height', '300px');
    },


    candidate_html: function(frm) {
        let wrapper = $(cur_frm.get_field('candidate_html').wrapper).empty();
        let table_html = $(`
            <table class="table table-bordered" style="margin:0px;">
                <thead>
                    <tr>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">No.</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Name</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Email</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:12%;">Phone</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Interviewer</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:9%;">Type</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:9%;">Mail</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:12%;">Status</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:6%;">Shortlist</th>
                        <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:7%;"><p style="text-align:center;padding:0px;margin:0px;">View &nbsp;&nbsp; | &nbsp;&nbsp; Delete</p></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `).appendTo(wrapper);
    
        let s_no = 0;
    
        if (cur_frm.doc.candidate_list) {
            if (cur_frm.doc.candidate_list.length > 0) {
                cur_frm.doc.candidate_list.map(f => {
                    s_no += 1;
                    f.s_no = s_no;
                    f.interviewer_email_1 = f.interviewer_email || "";
                    f.monitored_test_1 = f.monitored_test == 1 ? "Monitored" : "Unmonitored";
                    f.mail_sent_1 = f.mail_sent == 1 ? "Sent" : "Not Sent";
                    f.candidate_video_1 = f.candidate_video == 1 ? "Yes" : "No";
                    f.record_screen_1 = f.record_screen == 1 ? "Yes" : "No";
    
                    if (!f.test_result || f.test_result === "") {
                        f.test_result_1 = f.mail_sent == 1
                            ? '<span class="indicator whitespace-nowrap red"><span>Test Sent</span></span>'
                            : '<span class="indicator whitespace-nowrap red"><span>Test Not Sent</span></span>';
                    } else if (f.test_result === "Not Evaluated") {
                        f.test_result_1 = '<span class="indicator whitespace-nowrap orange"><span>Not Evaluated</span></span>';
                    } else {
                        f.test_result_1 = '<span class="indicator whitespace-nowrap blue"><span>Marks Secured: ' + f.test_result + '</span></span>';
                    }
    
                    let row_data = $(`
                        <tr data-id="${f.name}" data-idx="${f.idx}">
                            <td>${f.s_no}</td>
                            <td>${f.candidate_name}</td>
                            <td>${f.candidate_email}</td>
                            <td>${f.candidate_phone}</td>
                            <td>${f.interviewer_email_1}</td>
                            <td>${f.monitored_test_1}</td>
                            <td>${f.mail_sent_1}</td>
                            <td>${f.test_result_1}</td>
                            <td>
                                <button class="btn btn-xs btn-default short-list" style="width: 100%;">Shortlist</button>
                            </td>
                            <td>
                                <button class="btn btn-xs btn-link view-candidate" style="width:45%;">
                                    <i class="fa fa-eye" aria-hidden="true" style="color:#6f6f6f;font-size:18px;"></i>
                                </button>
                                <button class="btn btn-xs btn-link delete-candidate" style="width:45%;">
                                    <i alt="Delete candidate" class="fa fa-trash-o" aria-hidden="true" style="color: red;font-size:18px;"></i>
                                </button>
                            </td>
                        </tr>
                    `);
    
                    table_html.find('tbody').append(row_data);
                });
            } else {
                table_html.find('tbody').append(`<tr><td colspan="10">No records found!</td></tr>`);
            }
        } else {
            table_html.find('tbody').append(`<tr><td colspan="10">No records found!</td></tr>`);
        }
    
        $(cur_frm.get_field('candidate_html').wrapper).find('tbody .view-candidate').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            cur_frm.option = cur_frm.doc.candidate_list.find(obj => obj.name == id);
            cur_frm.trigger('candidates_dialog');
        });
    
        $(cur_frm.get_field('candidate_html').wrapper).find('tbody .delete-candidate').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            cur_frm.option = cur_frm.doc.candidate_list.find(obj => obj.name == id);
            if (cur_frm.option.mail_sent == 0) {
                var msg = "Do you want to delete this candidate?";
                frappe.confirm(__(msg), () => {
                    if (id) {
                        frappe.call({
                            method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.delete_candidate',
                            args: { name: id },
                            callback: function(f) {
                                cur_frm.reload_doc();
                            }
                        });
                    }
                });
            } else {
                var msg = "Mailed candidate details can't be deleted!";
                frappe.throw(__(msg));
            }
        });
    
        $(cur_frm.get_field('candidate_html').wrapper).find('tbody .short-list').on('click', function() {
            let id = $(this).parent().parent().attr('data-id');
            cur_frm.option = cur_frm.doc.candidate_list.find(obj => obj.name == id);
            if (cur_frm.option.short_listed == 0) {
                if (cur_frm.option.test_result && cur_frm.option.test_result !== "" && cur_frm.option.test_result !== "Not Evaluated") {
                    var msg = "Do you want to short list this candidate?";
                    frappe.confirm(__(msg), () => {
                        if (id) {
                            frappe.model.set_value("Interview Candidates", id, "short_listed", 1);
                            let child = frappe.model.add_child(cur_frm.doc, "Shortlisted Candidates", "shortlisted_candidates");
                            child.candidate_name = cur_frm.option.candidate_name;
                            child.candidate_email = cur_frm.option.candidate_email;
                            child.candidate_phone = cur_frm.option.candidate_phone;
                            child.candidate_email = cur_frm.option.candidate_email;
                            child.interviewer_email = cur_frm.option.interviewer_email;
                            child.monitored_test = cur_frm.option.monitored_test;
                            child.test_result = cur_frm.option.test_result;
                            cur_frm.refresh_field("shortlisted_candidates");
    
                            cur_frm.save_or_update();
                        }
                    });
                } else {
                    var msg = "Test results not yet available!";
                    frappe.throw(__(msg));
                }
            } else {
                var msg = "Candidate already shortlisted!";
                frappe.throw(__(msg));
            }
        });
    },

    
    candidates_dialog: function(frm) {
        let title = 'Candidate details';
        let dialog = new frappe.ui.Dialog({
            title: __(title),
            fields: [
                {
                    fieldtype: "Data",
                    fieldname: "candidate_name_2",
                    label: __("Candidate Name"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "candidate_email_2",
                    label: __("Candidate Email"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Phone",
                    fieldname: "candidate_phone_2",
                    label: __("Candidate Phone"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "interviewer_email_2",
                    label: __("Interviewer Email"),
                    reqd: 0,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "monitored_test_2",
                    label: __("Monitored Test"),
                    reqd: 0,
                    read_only: 1
                },
                {
                    fieldtype: "Column Break",
                    fieldname: "column_break2622"
                },
                {
                    fieldtype: "Data",
                    fieldname: "time_zone_2",
                    label: __("Time Zone"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "start_time_2",
                    label: __("Start Time"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "end_time_2",
                    label: __("Test Expire"),
                    reqd: 1,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "mail_sent_2",
                    label: __("Mail Sent"),
                    reqd: 0,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "candidate_video2",
                    label: __("Candidate Video"),
                    reqd: 0,
                    read_only: 1
                },
                {
                    fieldtype: "Data",
                    fieldname: "record_screen2",
                    label: __("Screen Share"),
                    reqd: 0,
                    read_only: 1
                }
            ]
        });
    
        if (cur_frm.option.monitored_test_1 === "No") {
            $(dialog.$wrapper).find('div[data-fieldname="candidate_video2"]').hide();
            $(dialog.$wrapper).find('div[data-fieldname="record_screen2"]').hide();
            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email_2"]').hide();
        } else {
            $(dialog.$wrapper).find('div[data-fieldname="candidate_video2"]').show();
            $(dialog.$wrapper).find('div[data-fieldname="record_screen2"]').show();
            $(dialog.$wrapper).find('div[data-fieldname="interviewer_email_2"]').show();
        }
    
        dialog.get_field('candidate_name_2').set_input(cur_frm.option.candidate_name);
        dialog.get_field('candidate_name_2').refresh();
        dialog.get_field('candidate_email_2').set_input(cur_frm.option.candidate_email);
        dialog.get_field('candidate_email_2').refresh();
        dialog.get_field('candidate_phone_2').set_input(cur_frm.option.candidate_phone);
        dialog.get_field('candidate_phone_2').refresh();
        dialog.get_field('interviewer_email_2').set_input(cur_frm.option.interviewer_email_1);
        dialog.get_field('interviewer_email_2').refresh();
        dialog.get_field('time_zone_2').set_input(cur_frm.option.time_zone);
        dialog.get_field('time_zone_2').refresh();
        dialog.get_field('start_time_2').set_input(cur_frm.option.start_time);
        dialog.get_field('start_time_2').refresh();
        dialog.get_field('end_time_2').set_input(cur_frm.option.end_time);
        dialog.get_field('end_time_2').refresh();
        dialog.get_field('monitored_test_2').set_input(cur_frm.option.monitored_test_1);
        dialog.get_field('monitored_test_2').refresh();
        dialog.get_field('mail_sent_2').set_input(cur_frm.option.mail_sent_1);
        dialog.get_field('mail_sent_2').refresh();
        dialog.get_field('candidate_video2').set_input(cur_frm.option.candidate_video_1);
        dialog.get_field('candidate_video2').refresh();
        dialog.get_field('record_screen2').set_input(cur_frm.option.record_screen_1);
        dialog.get_field('record_screen2').refresh();
    
        dialog.show();
        $(dialog.$wrapper).find('.ql-snow .ql-editor').css('min-height', '300px');
    },
    


    shortlist_html: function(frm) {
        let wrapper = $(cur_frm.get_field('shortlist_html').wrapper).empty();
        let table_html = $(`<table class="table table-bordered" style="margin:0px;">
            <thead>
                <tr>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">S.no</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Name</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Email</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:12%;">Phone</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;">Interviewer</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:9%;">Monitored</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:12%;">Marks</th>
                    <th style="background-color:WhiteSmoke;color:grey;font-weight:400;" style="width:9%;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`).appendTo(wrapper);
    
        let s_no = 0;
        if (cur_frm.doc.shortlisted_candidates) {
            if (cur_frm.doc.shortlisted_candidates.length > 0) {
                cur_frm.doc.shortlisted_candidates.forEach(candidate => {
                    s_no += 1;
                    candidate.s_no = s_no;
                    candidate.interviewer_email_3 = candidate.interviewer_email || "";
                    candidate.monitored_test_3 = candidate.monitored_test ? "Yes" : "No";
    
                    let row_data = $(`<tr data-id="${candidate.name}" data-idx="${candidate.idx}">
                        <td>${candidate.s_no}</td>
                        <td>${candidate.candidate_name}</td>
                        <td>${candidate.candidate_email}</td>
                        <td>${candidate.candidate_phone}</td>
                        <td>${candidate.interviewer_email_3}</td>
                        <td>${candidate.monitored_test_3}</td>
                        <td>${candidate.test_result}</td>
                        <td>
                            <button class="btn btn-xs btn-danger remove-candidate">Remove</button>
                        </td>
                    </tr>`);
                    table_html.find('tbody').append(row_data);
                });
            } else {
                table_html.find('tbody').append(`<tr><td colspan="8" align="center">No candidates shortlisted!</td></tr>`);
            }
        } else {
            table_html.find('tbody').append(`<tr><td colspan="8" align="center">No candidates shortlisted!</td></tr>`);
        }
    
        $(cur_frm.get_field('shortlist_html').wrapper).find('tbody .remove-candidate').on('click', function() {
            let id = $(this).closest('tr').attr('data-id');
            let idx = $(this).closest('tr').attr('data-idx');
            cur_frm.option = cur_frm.doc.shortlisted_candidates.find(candidate => candidate.name === id);
    
            frappe.confirm(__('Do you want to remove this candidate from shortlist?'), () => {
                if (id) {
                    frappe.call({
                        method: 'go1_recruit.go1_recruit.doctype.interview_question_paper.interview_question_paper.remove_candidate',
                        args: {
                            name: id,
                            email: cur_frm.option.candidate_email,
                            parent: cur_frm.option.parent
                        },
                        callback: function() {
                            cur_frm.save_or_update();
                            cur_frm.reload_doc();
                        }
                    });
                }
            });
        });
    }
    
})

function IncrementQty(e) {
    var id = e.attr("id")
    var num = id.split('-')[1]
    console.log("--------num")
    console.log(num)
}

function DecrementQty(e) {
    var id = e.attr("id")
    var num = id.split('-')[1]
    console.log("--------num")
    console.log(num)
}