frappe.ui.form.on('Interview Question', {
    subject: function(frm) {
        if (frm.doc.subject) {
            frm.set_value('topic','')
            frm.set_query("topic", function() {
                return {
                    "filters": {
                        "subject": frm.doc.subject
                    }
                }
            })
        }
    },

    refresh:function(frm){
        $('button[data-fieldname="add_options"]').addClass('btn-primary')
        $('button[data-fieldname="add_options"]').removeClass('btn-xs')
        frm.trigger('options_html')
    },

    add_options:function(frm){
        frm.edit_option=0;
        frm.trigger('option_dialog')
    },

    option_dialog:function(frm){
        let title='Add Options';
        let primary_text='Add';
        if(frm.edit_option==1){
            title='Edit Option';
            primary_text='Save'
        }
        let dialog=new frappe.ui.Dialog({
            title:__(title),
            fields:[
                {
                    "fieldtype":"Text Editor",
                    "fieldname":"option",
                    "label":__("Option"),
                    "reqd":1
                },
                {
                    "fieldtype":"Check",
                    "fieldname":"is_correct",
                    "label":__("Is Correct"),
                    "reqd":0
                }
            ]
        })

        dialog.set_primary_action(__(primary_text),function(){
            let values=dialog.get_values();
            if(frm.edit_option!=1){
                if(values.option != '<div><br></div>'){
                            let child=frappe.model.add_child(frm.doc, "Question Option", "options");
                            child.option=values.option;
                            child.is_correct=values.is_correct;
                }
                else
                    {
                        var msg ="Enter the Option Value"
                        frappe.throw(__(msg))
                    }
            }else{
                frappe.model.set_value('Question Option', frm.option.name, 'option', values.option)
                frappe.model.set_value('Question Option', frm.option.name, 'is_correct', values.is_correct)
            }  

            cur_frm.refresh_field("options");
            dialog.hide();
           
            if(!frm.doc.__islocal)
                cur_frm.save();
             cur_frm.trigger('options_html')

        })


        dialog.show();
        $(dialog.$wrapper).find('.ql-snow .ql-editor').css('min-height','300px');
    },

    options_html:function(frm){
        let wrapper = $(frm.get_field('options_html').wrapper).empty();
        let table_html=$(`<table class="table table-bordered" style="cursor:pointer; margin:0px;">
            <thead>
                <tr>
                    <th style="width: 70%">Option</th>
                    <th>Is Correct</th>
                    <th style="width:15%;"></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`).appendTo(wrapper);
        if(frm.doc.options){
            if(frm.doc.options.length>0){
                frm.doc.options.map( f => {
                    if(f.is_correct==1){
                        f.correct_value='Yes';
                    }else{
                        f.correct_value='No';
                    }
                    let row_data=$(`<tr data-id="${f.name}" data-idx="${f.idx}">
                        <td>${f.option}</td>
                        <td>${f.correct_value}</td>
                        <td>
                            <button class="btn btn-xs btn-danger" style="margin-right:10px;">Delete</button>
                            <button class="btn btn-xs btn-warning">Edit</button>
                        </td>
                    </tr>`);
                    table_html.find('tbody').append(row_data);
                });
            }else{
                table_html.find('tbody').append(`<tr><td colspan="3">No records found!</td></tr>`);
            }
        }
        else{
            table_html.find('tbody').append(`<tr><td colspan="3">No records found!</td></tr>`);
        }
        $(frm.get_field('options_html').wrapper).find('tbody .btn-danger').on('click', function(){
                let id=$(this).parent().parent().attr('data-id');
                let idx=$(this).parent().parent().attr('data-idx');
                var msg ="Do you want to delete this option?"
                

                frappe.confirm(__(msg), () => {
                if(id){
                    frappe.call({
                        method:'go1_recruit.go1_recruit.doctype.interview_question.interview_question.delete_option',
                        args:{
                            name:id
                        },
                        callback:function(f){
                            frm.trigger('options_html')
                            cur_frm.reload_doc()
                        }
                    })                        
                }
            });
        })


        $(frm.get_field('options_html').wrapper).find('tbody .btn-warning').on('click', function(){
            let id=$(this).parent().parent().attr('data-id');
            let idx=$(this).parent().parent().attr('data-idx');
            frm.option=frm.doc.options.find(obj=>obj.name==id);
            frm.edit_option=1;
            frm.trigger('option_dialog');
        })
    }

});

