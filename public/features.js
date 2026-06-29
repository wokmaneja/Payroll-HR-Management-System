// Document Filing
let currentDocFile = null;

function renderDocuments() {
    var docs = DB.findAll('documents');
    var staffList = DB.findAll('staff');
    var docTypes = DB.findAll('doc_types');
    var role = APP.currentUser ? APP.currentUser.role : '';
    
    if(role === 'staff' && APP.currentUser.linkedStaffId) {
        var staffRec = DB.findOne('staff', { _id: APP.currentUser.linkedStaffId });
        if(staffRec) {
            docs = docs.filter(d => d.staffName === staffRec.name);
        } else {
            docs = [];
        }
    }
    
    // Default types if empty
    if(docTypes.length === 0) {
        docTypes = [{name: 'ID Card'}, {name: 'Driver License'}, {name: 'Contract'}, {name: 'Certificate'}];
    }

    var html = '<div style="display:flex;justify-content:space-between;margin-bottom:1rem">';
    html += '<h3 style="color:var(--navy);font-size:18px"><span data-i18n="lbl_doc_center">Document Center</span></h3>';
    if(role === 'admin' || role === 'manager' || role === 'it') {
        html += '<button class="btn btn-primary" onclick="showDocumentForm()"><i class="ti ti-plus"></i> <span data-i18n="btn_req_add_doc">Request / Add Document</span></button>';
    }
    html += '</div>';

    html += '<table><thead><tr><th><span data-i18n="th_staff_name">Staff Name</span></th><th><span data-i18n="th_doc_type">Doc Type</span></th><th><span data-i18n="th_file">File</span></th><th><span data-i18n="th_date">Date</span></th><th><span data-i18n="th_action">Action</span></th></tr></thead><tbody>';
    if(docs.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center;color:#888"><span data-i18n="msg_no_docs">No documents filed yet.</span></td></tr>';
    } else {
        docs.forEach(function(d) {
            html += '<tr>';
            html += '<td style="font-weight:600">'+(d.staffName||'')+'</td>';
            html += '<td>'+(d.docType||'')+'</td>';
            let fileDisplay = '--';
            if (d.fileName && d.fileName.startsWith('/uploads/')) {
                let niceName = d.fileName.split('_').slice(1).join('_') || 'Download File';
                fileDisplay = '<a href="'+d.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-file"></i> '+niceName+'</a>';
            } else if (d.fileName) {
                fileDisplay = '<a href="'+d.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-link"></i> <span data-i18n="btn_ext_link">External Link</span></a>';
            } else {
                fileDisplay = '<span style="color:#e24b4a;font-weight:600"><i class="ti ti-alert-circle"></i> <span data-i18n="lbl_requested">Requested</span></span>';
                if (role === 'staff') {
                    fileDisplay += ' <button class="btn btn-primary btn-sm" style="margin-left:8px" onclick="showFulfillDocForm(\''+d._id+'\')"><span data-i18n="btn_upload">Upload</span></button>';
                }
            }
            html += '<td>'+fileDisplay+'</td>';
            html += '<td>'+(d._created ? new Date(d._created).toLocaleDateString() : '')+'</td>';
            html += '<td>';
            if(role === 'admin' || role === 'manager') {
                html += '<button class="btn btn-danger btn-sm" onclick="deleteDocument(\''+d._id+'\')"><span data-i18n="btn_delete">Delete</span></button>';
            }
            html += '</td>';
            html += '</tr>';
        });
    }
    html += '</tbody></table>';

    // Form modal
    html += '<div id="doc-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:480px">';
    html += '<h4 id="doc-modal-title" style="margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_add_staff_doc">Add Staff Document</span></h4>';
    
    html += '<div id="doc-staff-container" style="margin-bottom:1rem"><label><span data-i18n="lbl_staff_member">Staff Member</span></label><select id="doc-staff">';
    html += '<option value=""><span data-i18n="opt_sel_staff">-- Select Staff --</span></option>';
    staffList.forEach(s => {
        html += '<option value="'+s.name+'">'+s.name+' ('+(s.empid||'')+')</option>';
    });
    html += '</select></div>';
    
    html += '<div id="doc-type-container" style="margin-bottom:1rem"><label><span data-i18n="lbl_doc_type">Document Type</span></label><div style="display:flex;gap:0.5rem">';
    html += '<select id="doc-type" style="flex:1">';
    docTypes.forEach(t => {
        html += '<option value="'+t.name+'">'+t.name+'</option>';
    });
    html += '</select>';
    if (APP.currentUser && (APP.currentUser.role === 'admin' || APP.currentUser.role === 'manager')) {
        html += '<button class="btn btn-outline" onclick="showDocTypeManager()" style="padding:0.5rem;font-size:12px"><span data-i18n="btn_manage_types">Manage Types</span></button>';
    }
    html += '</div></div>';
    
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_upload_file">Upload File</span> <span id="doc-upload-optional" style="color:#888;font-size:12px"><span data-i18n="msg_upload_opt">(Optional - leave blank to request file)</span></span></label>';
    html += '<div id="doc-dropzone" style="border:2px dashed #ccc;border-radius:8px;padding:2rem;text-align:center;background:#fafafa;cursor:pointer;transition:all 0.2s">';
    html += '<i class="ti ti-cloud-upload" style="font-size:32px;color:#aaa"></i>';
    html += '<p style="margin:10px 0 0 0;color:#666" id="doc-drop-text"><span data-i18n="msg_drag_drop">Drag and drop a file here, or click to browse</span></p>';
    html += '<input type="file" id="doc-file-input" style="display:none">';
    html += '</div></div>';
    
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveDocument()"><span data-i18n="btn_save_doc">Save Document</span></button><button class="btn btn-outline" onclick="document.getElementById(\'doc-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';
    
    // Doc Type Manager Modal
    html += '<div id="doc-type-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:10000;width:350px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_manage_doc_types">Manage Document Types</span></h4>';
    html += '<div style="display:flex;gap:0.5rem;margin-bottom:1rem">';
    html += '<input type="text" id="new-doc-type" placeholder="New Type Name" style="flex:1">';
    html += '<button class="btn btn-primary" onclick="addDocType()"><span data-i18n="btn_add">Add</span></button>';
    html += '</div>';
    html += '<div id="doc-types-list" style="max-height:200px;overflow-y:auto;border:1px solid #eee;border-radius:6px;padding:0.5rem;margin-bottom:1rem"></div>';
    html += '<button class="btn btn-outline" style="width:100%;justify-content:center" onclick="document.getElementById(\'doc-type-modal\').classList.add(\'hidden\')"><span data-i18n="btn_close">Close</span></button>';
    html += '</div>';

    document.getElementById('section-documents').innerHTML = html;


    if (typeof changeLang === 'function') changeLang();
    if (typeof changeLang === 'function') changeLang();
    
    setTimeout(setupDocDropzone, 50);
}

function showDocTypeManager() {
    renderDocTypesList();
    document.getElementById('doc-type-modal').classList.remove('hidden');
}

function renderDocTypesList() {
    var types = DB.findAll('doc_types');
    var html = '';
    if (types.length === 0) {
        html = '<div style="color:#888;text-align:center;font-size:13px;padding:0.5rem"><span data-i18n="msg_no_custom_types">No custom types added.</span></div>';
    } else {
        types.forEach(t => {
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #f0f0f0">';
            html += '<span style="font-size:14px">'+t.name+'</span>';
            html += '<i class="ti ti-trash" style="color:var(--error);cursor:pointer" onclick="deleteDocType(\''+t._id+'\')"></i>';
            html += '</div>';
        });
    }
    document.getElementById('doc-types-list').innerHTML = html;
}

function addDocType() {
    var name = document.getElementById('new-doc-type').value.trim();
    if (!name) return;
    DB.insert('doc_types', { name: name });
    document.getElementById('new-doc-type').value = '';
    renderDocTypesList();
    renderDocuments();
    document.getElementById('doc-modal').classList.remove('hidden'); // keep main modal open
    document.getElementById('doc-type-modal').classList.remove('hidden'); // keep type modal open
}

async function deleteDocType(id) {
    if(await uiConfirm('Remove this document type?')) {
        DB.remove('doc_types', { _id: id });
        renderDocTypesList();
        renderDocuments();
        document.getElementById('doc-modal').classList.remove('hidden');
        document.getElementById('doc-type-modal').classList.remove('hidden');
    }
}

function setupDocDropzone() {
    var dropzone = document.getElementById('doc-dropzone');
    var fileInput = document.getElementById('doc-file-input');
    var dropText = document.getElementById('doc-drop-text');
    if(!dropzone) return;

    dropzone.onclick = () => fileInput.click();
    
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--gold)';
        dropzone.style.background = '#fff8e1';
    };
    
    dropzone.ondragleave = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
    };
    
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleDocFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleDocFileSelect(e.target.files[0]);
        }
    };
    
    function handleDocFileSelect(file) {
        dropText.innerHTML = '<strong style="color:var(--navy)">' + file.name + '</strong><br><span style="font-size:12px">(' + Math.round(file.size/1024) + ' KB) - Ready to save</span>';
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentDocFile = {
                filename: file.name,
                base64: evt.target.result
            };
        };
        reader.readAsDataURL(file);
    }
}

let fulfillDocId = null;

function showDocumentForm() {
    fulfillDocId = null;
    currentDocFile = null;
    var dropText = document.getElementById('doc-drop-text');
    if (dropText) dropText.innerHTML = 'Drag and drop a file here, or click to browse';
    var staffCont = document.getElementById('doc-staff-container');
    if(staffCont) staffCont.style.display = 'block';
    var typeCont = document.getElementById('doc-type-container');
    if(typeCont) typeCont.style.display = 'block';
    var title = document.getElementById('doc-modal-title');
    if(title) title.innerText = 'Add / Request Staff Document';
    var opt = document.getElementById('doc-upload-optional');
    if(opt) opt.style.display = 'inline';
    document.getElementById('doc-modal').classList.remove('hidden');
}

function showFulfillDocForm(id) {
    fulfillDocId = id;
    currentDocFile = null;
    var dropText = document.getElementById('doc-drop-text');
    if (dropText) dropText.innerHTML = 'Drag and drop your file here, or click to browse';
    var staffCont = document.getElementById('doc-staff-container');
    if(staffCont) staffCont.style.display = 'none';
    var typeCont = document.getElementById('doc-type-container');
    if(typeCont) typeCont.style.display = 'none';
    var title = document.getElementById('doc-modal-title');
    if(title) title.innerText = 'Upload Requested Document';
    var opt = document.getElementById('doc-upload-optional');
    if(opt) opt.style.display = 'none';
    document.getElementById('doc-modal').classList.remove('hidden');
}

async function saveDocument() {
    var staff = document.getElementById('doc-staff') ? document.getElementById('doc-staff').value : '';
    var type = document.getElementById('doc-type') ? document.getElementById('doc-type').value : '';
    
    if (fulfillDocId) {
        if (!currentDocFile) return alert('Please select a file to upload.');
        let fileUrl = '';
        var doc = DB.findOne('documents', { _id: fulfillDocId });
        if(!doc) return alert('Document record not found');
        
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentDocFile.filename,
                    base64: currentDocFile.base64,
                    staffName: doc.staffName
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch (e) {
            alert('File upload error');
            return;
        }
        
        DB.update('documents', { _id: fulfillDocId }, { fileName: fileUrl });
        fulfillDocId = null;
        document.getElementById('doc-modal').classList.add('hidden');
        renderDocuments();
        return;
    }
    
    if(!staff) return alert('Please select a staff member.');
    
    let fileUrl = '';
    
    if (currentDocFile) {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentDocFile.filename,
                    base64: currentDocFile.base64,
                    staffName: staff
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch(e) {
            alert('File upload failed: ' + e.message);
            return;
        }
    }
    
    DB.insert('documents', { staffName: staff, docType: type, fileName: fileUrl, _created: Date.now() });
    
    // Also notify staff
    if (!fileUrl && typeof createNotification === 'function') {
        var sInfo = DB.findOne('staff', { name: staff });
        if (sInfo && sInfo.username) {
            createNotification('info', 'Document Requested', 'HR has requested you to upload: ' + type, { section: 'documents' }, [sInfo.username]);
        }
    }
    
    document.getElementById('doc-modal').classList.add('hidden');
    renderDocuments();
}

async function deleteDocument(id) {
    if(await uiConfirm('Delete this document?')) {
        DB.remove('documents', { _id: id });
        renderDocuments();
    }
}


// Recruitment
let currentRecruitFile = null;

function setupRecruitDropzone() {
    var dropzone = document.getElementById('rec-dropzone');
    var fileInput = document.getElementById('rec-file-input');
    var dropText = document.getElementById('rec-drop-text');
    if(!dropzone) return;

    dropzone.onclick = () => fileInput.click();
    
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--gold)';
        dropzone.style.background = '#fff8e1';
    };
    
    dropzone.ondragleave = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
    };
    
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleRecruitFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleRecruitFileSelect(e.target.files[0]);
        }
    };
    
    function handleRecruitFileSelect(file) {
        dropText.innerHTML = '<strong style="color:var(--navy)">' + file.name + '</strong><br><span style="font-size:12px">(' + Math.round(file.size/1024) + ' KB) - Ready to save</span>';
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentRecruitFile = {
                filename: file.name,
                base64: evt.target.result
            };
        };
        reader.readAsDataURL(file);
    }
}
function renderRecruitment() {
    var recruits = DB.findAll('recruitment');
    var vacancies = DB.findAll('vacancies');
    
    var html = '';
    
    // Internal Vacancies Section
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:1rem;margin-top:1rem">';
    html += '<h3 style="color:var(--navy);font-size:18px"><span data-i18n="lbl_int_vacancies">Internal Vacancies</span></h3>';
    html += '<button class="btn btn-primary" onclick="showVacancyForm()"><i class="ti ti-plus"></i> <span data-i18n="btn_post_vacancy">Post Vacancy</span></button>';
    html += '</div>';

    html += '<table><thead><tr><th><span data-i18n="th_position">Position</span></th><th><span data-i18n="th_description">Description</span></th><th><span data-i18n="th_due_date">Due Date</span></th><th><span data-i18n="th_action">Action</span></th></tr></thead><tbody>';
    if(vacancies.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;color:#888"><span data-i18n="msg_no_vacancies">No active vacancies.</span></td></tr>';
    } else {
        vacancies.forEach(function(v) {
            html += '<tr>';
            html += '<td style="font-weight:600">'+(v.position||'')+'</td>';
            html += '<td>'+(v.description||'')+'</td>';
            html += '<td>'+(v.dueDate||'')+'</td>';
            html += '<td><button class="btn btn-danger btn-sm" onclick="deleteVacancy(\''+v._id+'\')"><span data-i18n="btn_delete">Delete</span></button></td>';
            html += '</tr>';
        });
    }
    html += '</tbody></table><br><hr><br>';

    // Recruitment Management Section
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:1rem">';
    html += '<h3 style="color:var(--navy);font-size:18px"><span data-i18n="lbl_work_recruit">Work Recruitment Management</span></h3>';
    html += '<button class="btn btn-primary" onclick="showRecruitForm()"><i class="ti ti-plus"></i> <span data-i18n="btn_add_candidate">Add Candidate</span></button>';
    html += '</div>';

    html += '<table><thead><tr><th><span data-i18n="th_candidate_name">Candidate Name</span></th><th><span data-i18n="th_position">Position</span></th><th><span data-i18n="th_status">Status</span></th><th><span data-i18n="th_attached_file">Attached File</span></th><th><span data-i18n="th_notes">Notes</span></th><th><span data-i18n="th_action">Action</span></th></tr></thead><tbody>';
    if(recruits.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:#888"><span data-i18n="msg_no_candidates">No candidates yet.</span></td></tr>';
    } else {
        recruits.forEach(function(r) {
            html += '<tr>';
            html += '<td style="font-weight:600">'+(r.name||'')+'</td>';
            html += '<td>'+(r.position||'')+'</td>';
            html += '<td><span class="status-pill '+(r.status==='Hired'?'pill-approved':(r.status==='Rejected'?'pill-rejected':(r.status==='Internal Application'?'pill-pending':'pill-pending')))+'">'+(r.status||'New')+'</span></td>';
            
            let fileDisplay = '--';
            if (r.fileName && r.fileName.startsWith('/uploads/')) {
                let niceName = r.fileName.split('_').slice(1).join('_') || 'Download File';
                fileDisplay = '<a href="'+r.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-file"></i> '+niceName+'</a>';
            } else if (r.fileName) {
                fileDisplay = '<a href="'+r.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-link"></i> <span data-i18n="btn_download">Download</span></a>';
            }
            html += '<td>'+fileDisplay+'</td>';

            html += '<td>'+(r.notes||'')+'</td>';
            html += '<td>';
            if (r.status === 'Internal Application') {
                html += '<button class="btn btn-primary btn-sm" style="margin-right:5px" onclick="approveInternalApplicant(\''+r._id+'\')"><span data-i18n="btn_approve">Approve</span></button>';
            }
            html += '<button class="btn btn-danger btn-sm" onclick="deleteRecruit(\''+r._id+'\')"><span data-i18n="btn_delete">Delete</span></button>';
            html += '</td>';
            html += '</tr>';
        });
    }
    html += '</tbody></table>';

    // Form modal
    html += '<div id="recruit-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:400px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)"><span data-i18n="btn_add_candidate">Add Candidate</span></h4>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_candidate_name">Candidate Name</span></label><input type="text" id="rec-name"></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_pos_applied">Position Applied</span></label><input type="text" id="rec-pos"></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_status">Status</span></label><select id="rec-status"><option><span data-i18n="opt_new">New</span></option><option><span data-i18n="opt_interviewing">Interviewing</span></option><option><span data-i18n="opt_hired">Hired</span></option><option><span data-i18n="opt_rejected">Rejected</span></option></select></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_notes">Notes</span></label><textarea id="rec-notes"></textarea></div>';
    
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_cv_file">Application/CV File (Optional)</span></label>';
    html += '<div id="rec-dropzone" style="border:2px dashed #ccc;border-radius:8px;padding:2rem;text-align:center;background:#fafafa;cursor:pointer;transition:all 0.2s">';
    html += '<i class="ti ti-cloud-upload" style="font-size:32px;color:#aaa"></i>';
    html += '<p style="margin:10px 0 0 0;color:#666" id="rec-drop-text"><span data-i18n="msg_drag_drop">Drag and drop a file here, or click to browse</span></p>';
    html += '<input type="file" id="rec-file-input" style="display:none">';
    html += '</div></div>';

    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveRecruit()"><span data-i18n="btn_save">Save</span></button><button class="btn btn-outline" onclick="document.getElementById(\'recruit-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    // Vacancy Modal
    html += '<div id="vacancy-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:400px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_post_int_vac">Post Internal Vacancy</span></h4>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_position">Position</span></label><input type="text" id="vac-pos"></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_description">Description</span></label><textarea id="vac-desc" style="height:80px"></textarea></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_due_date">Due Date</span></label><input type="date" id="vac-due"></div>';
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveVacancy()">Post</button><button class="btn btn-outline" onclick="document.getElementById(\'vacancy-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    document.getElementById('section-recruitment').innerHTML = html;


    if (typeof changeLang === 'function') changeLang();
    if (typeof changeLang === 'function') changeLang();
    setTimeout(setupRecruitDropzone, 50);
}

function showRecruitForm() {
    currentRecruitFile = null;
    var dropText = document.getElementById('rec-drop-text');
    if (dropText) dropText.innerHTML = 'Drag and drop a file here, or click to browse';
    document.getElementById('recruit-modal').classList.remove('hidden');
}

async function saveRecruit() {
    var name = document.getElementById('rec-name').value;
    var pos = document.getElementById('rec-pos').value;
    var status = document.getElementById('rec-status').value;
    var notes = document.getElementById('rec-notes').value;
    if(!name) return alert('Name required');

    let fileUrl = '';
    
    if (currentRecruitFile) {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentRecruitFile.filename,
                    base64: currentRecruitFile.base64,
                    staffName: name
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch (e) {
            alert('File upload error');
            return;
        }
    }

    DB.insert('recruitment', { name: name, position: pos, status: status, notes: notes, fileName: fileUrl });
    renderRecruitment();
}

async function deleteRecruit(id) {
    if(await uiConfirm('Delete candidate?')) {
        DB.remove('recruitment', { _id: id });
        renderRecruitment();
    }
}

function approveInternalApplicant(id) {
    var r = DB.findOne('recruitment', { _id: id });
    if(r) {
        r.status = 'Interviewing';
        DB.update('recruitment', { _id: id }, r);
        renderRecruitment();
    }
}

function showVacancyForm() {
    document.getElementById('vacancy-modal').classList.remove('hidden');
}

function saveVacancy() {
    var pos = document.getElementById('vac-pos').value;
    var desc = document.getElementById('vac-desc').value;
    var due = document.getElementById('vac-due').value;
    if(!pos) return alert('Position required');
    DB.insert('vacancies', { position: pos, description: desc, dueDate: due, _created: Date.now() });
    
    // Notify staff
    if (typeof createNotification === 'function') {
        createNotification('info', 'Internal Vacancy: ' + pos, 'A new internal vacancy has been posted. Due Date: ' + (due||'Open'), { section: 'dashboard' }, ['staff']);
    }
    
    renderRecruitment();
}

async function deleteVacancy(id) {
    if(await uiConfirm('Delete this vacancy?')) {
        DB.remove('vacancies', { _id: id });
        renderRecruitment();
    }
}

// KPI Tracking
let currentKPIFile = null;

function setupKPIDropzone() {
    var dropzone = document.getElementById('kpi-dropzone');
    var fileInput = document.getElementById('kpi-file-input');
    var dropText = document.getElementById('kpi-drop-text');
    if(!dropzone) return;

    dropzone.onclick = () => fileInput.click();
    
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--gold)';
        dropzone.style.background = '#fff8e1';
    };
    
    dropzone.ondragleave = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
    };
    
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleKPIFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleKPIFileSelect(e.target.files[0]);
        }
    };
    
    function handleKPIFileSelect(file) {
        dropText.innerHTML = '<strong style="color:var(--navy)">' + file.name + '</strong><br><span style="font-size:12px">(' + Math.round(file.size/1024) + ' KB) - Ready to save</span>';
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentKPIFile = {
                filename: file.name,
                base64: evt.target.result
            };
        };
        reader.readAsDataURL(file);
    }
}
function renderKPI() {
    var role = APP.currentUser ? APP.currentUser.role : '';
    var kpis = DB.findAll('kpi');
    
    if(role === 'staff' && APP.currentUser.linkedStaffId) {
        var staffRec = DB.findOne('staff', { _id: APP.currentUser.linkedStaffId });
        if(staffRec) {
            kpis = kpis.filter(k => k.staffName === staffRec.name);
        } else {
            kpis = [];
        }
    }

    var staffList = DB.findAll('staff');
    var html = '<div style="display:flex;justify-content:space-between;margin-bottom:1rem">';
    html += '<h3 style="color:var(--navy);font-size:18px">'+(role === 'staff' ? '<span data-i18n="lbl_my_kpi">My KPIs & Appraisals</span>' : '<span data-i18n="lbl_kpi_track">Staff KPI Tracking</span>')+'</h3>';
    if(role === 'admin' || role === 'manager') {
        html += '<button class="btn btn-primary" onclick="showKPIForm()"><i class="ti ti-plus"></i> <span data-i18n="btn_add_kpi">Add KPI Goal</span></button>';
    }
    html += '</div>';

    html += '<table><thead><tr><th><span data-i18n="th_staff_name">Staff Name</span></th><th><span data-i18n="lbl_kpi_name">Goal / Objective</span></th><th style="width:250px"><span data-i18n="th_score">Score</span></th><th><span data-i18n="lbl_period">Review Period</span></th><th><span data-i18n="th_attached_file">Attached File</span></th><th><span data-i18n="lbl_feedback">Feedback</span></th><th><span data-i18n="th_action">Action</span></th></tr></thead><tbody>';
    if(kpis.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;color:#888"><span data-i18n="msg_no_kpi">No KPIs assigned yet.</span></td></tr>';
    } else {
        kpis.forEach(function(k) {
            var s = parseInt(k.score) || 0;
            var color = s >= 80 ? '#16a34a' : (s < 50 ? '#dc2626' : '#d97706');
            var badgeText = s >= 80 ? 'Exceeds Expectations' : (s < 50 ? 'Needs Improvement' : 'Meets Expectations');
            var badgeBg = s >= 80 ? '#dcfce7' : (s < 50 ? '#fee2e2' : '#fef3c7');
            var badgeColor = s >= 80 ? '#166534' : (s < 50 ? '#991b1b' : '#92400e');
            
            html += '<tr>';
            html += '<td style="font-weight:600">'+(k.staffName||'')+'</td>';
            html += '<td>'+(k.goal||'')+'</td>';
            
            // Progress Bar & Badge
            html += '<td>';
            html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
            html += '<span style="font-weight:700;color:'+color+';width:35px">'+s+'%</span>';
            html += '<div style="flex:1;height:8px;background:#eee;border-radius:4px;overflow:hidden">';
            html += '<div style="width:'+s+'%;height:100%;background:'+color+';border-radius:4px"></div>';
            html += '</div></div>';
            html += '<span style="font-size:11px;padding:2px 6px;border-radius:10px;background:'+badgeBg+';color:'+badgeColor+';display:inline-block">'+badgeText+'</span>';
            html += '</td>';
            
            // File Link
            let fileDisplay = '--';
            if (k.fileName && k.fileName.startsWith('/uploads/')) {
                let niceName = k.fileName.split('_').slice(1).join('_') || 'Download File';
                fileDisplay = '<a href="'+k.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-file"></i> '+niceName+'</a>';
            } else if (k.fileName) {
                fileDisplay = '<a href="'+k.fileName+'" target="_blank" style="color:var(--gold);text-decoration:none"><i class="ti ti-link"></i> <span data-i18n="btn_download">Download</span></a>';
            }
            html += '<td>'+fileDisplay+'</td>';

            html += '<td><div style="font-size:12px;color:#555;max-width:200px;max-height:40px;overflow-y:auto">'+(k.feedback||'<i>No feedback provided</i>')+'</div></td>';
            
            html += '<td>';
            if (role === 'admin' || role === 'manager') {
                html += '<button class="btn btn-primary btn-sm" onclick="showKPIFeedbackForm(\''+k._id+'\')" style="margin-right:8px"><span data-i18n="lbl_feedback">Feedback</span></button>';
                html += '<button class="btn btn-danger btn-sm" onclick="deleteKPI(\''+k._id+'\')"><span data-i18n="btn_delete">Delete</span></button>';
            } else if (role === 'staff') {
                html += '<button class="btn btn-primary btn-sm" onclick="showKPIFeedbackForm(\''+k._id+'\')"><span data-i18n="btn_submit_feedback">Submit Feedback</span></button>';
            }
            html += '</td>';
            html += '</tr>';
        });
    }
    html += '</tbody></table>';

    // Form modal
    html += '<div id="kpi-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:9999;width:450px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Add Staff KPI</h4>';
    
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_staff_member">Staff Member</span></label><select id="kpi-staff">';
    html += '<option value=""><span data-i18n="opt_sel_staff">-- Select Staff --</span></option>';
    staffList.forEach(st => {
        html += '<option value="'+st.name+'">'+st.name+' ('+(st.empid||'')+')</option>';
    });
    html += '</select></div>';
    
    html += '<div style="margin-bottom:1rem"><label>Goal / Objective</label><textarea id="kpi-goal" placeholder="Describe the KPI objective"></textarea></div>';
    
    html += '<div style="display:flex;gap:1rem;margin-bottom:1rem">';
    html += '<div style="flex:1"><label>Score (0-100)</label><input type="number" min="0" max="100" id="kpi-score" placeholder="e.g. 85"></div>';
    html += '<div style="flex:1"><label>Review Period</label><input type="text" id="kpi-period" placeholder="e.g. Q1 2026"></div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:1.5rem"><label>Manager Feedback</label><textarea id="kpi-feedback" placeholder="Leave qualitative feedback or comments..."></textarea></div>';
    
    html += '<div style="margin-bottom:1rem"><label>Attach Form / Scorecard (Optional)</label>';
    html += '<div id="kpi-dropzone" style="border:2px dashed #ccc;border-radius:8px;padding:2rem;text-align:center;background:#fafafa;cursor:pointer;transition:all 0.2s">';
    html += '<i class="ti ti-cloud-upload" style="font-size:32px;color:#aaa"></i>';
    html += '<p style="margin:10px 0 0 0;color:#666" id="kpi-drop-text"><span data-i18n="msg_drag_drop">Drag and drop a file here, or click to browse</span></p>';
    html += '<input type="file" id="kpi-file-input" style="display:none">';
    html += '</div></div>';
    
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveKPI()">Save KPI</button><button class="btn btn-outline" onclick="document.getElementById(\'kpi-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    // Staff Feedback Modal
    html += '<div id="kpi-feedback-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:9999;width:400px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Submit KPI Feedback</h4>';
    html += '<input type="hidden" id="kpi-feedback-id">';
    html += '<div style="margin-bottom:1rem"><label>Your Comments</label><textarea id="kpi-staff-feedback" placeholder="Enter your feedback or comments..." style="height:100px"></textarea></div>';
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveKPIFeedback()"><span data-i18n="btn_submit">Submit</span></button><button class="btn btn-outline" onclick="document.getElementById(\'kpi-feedback-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    document.getElementById('section-kpi').innerHTML = html;


    if (typeof changeLang === 'function') changeLang();
    if (typeof changeLang === 'function') changeLang();
    setTimeout(setupKPIDropzone, 50);
}

function showKPIForm() {
    currentKPIFile = null;
    var dropText = document.getElementById('kpi-drop-text');
    if (dropText) dropText.innerHTML = 'Drag and drop a file here, or click to browse';
    document.getElementById('kpi-modal').classList.remove('hidden');
}

function showKPIFeedbackForm(id) {
    document.getElementById('kpi-feedback-id').value = id;
    document.getElementById('kpi-staff-feedback').value = '';
    document.getElementById('kpi-feedback-modal').classList.remove('hidden');
}

function saveKPIFeedback() {
    var id = document.getElementById('kpi-feedback-id').value;
    var feedback = document.getElementById('kpi-staff-feedback').value;
    if(!feedback) return alert('Please enter feedback');
    var k = DB.findOne('kpi', { _id: id });
    if(k) {
        var existing = k.feedback || '';
        var roleStr = (APP.currentUser && APP.currentUser.role === 'staff') ? 'Staff Feedback' : 'Manager Feedback';
        k.feedback = existing + '<br><br><b>[' + roleStr + ']:</b> ' + feedback;
        DB.update('kpi', { _id: id }, k);
    }
    renderKPI();
}

async function saveKPI() {
    var staff = document.getElementById('kpi-staff').value;
    var goal = document.getElementById('kpi-goal').value;
    var score = document.getElementById('kpi-score').value;
    var period = document.getElementById('kpi-period').value;
    var feedback = document.getElementById('kpi-feedback').value;
    if(!staff || !goal) return alert('Staff member and goal required');
    
    let fileUrl = '';
    
    if (currentKPIFile) {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentKPIFile.filename,
                    base64: currentKPIFile.base64,
                    staffName: staff
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch (e) {
            alert('File upload error');
            return;
        }
    }
    
    DB.insert('kpi', { staffName: staff, goal: goal, score: score, period: period, feedback: feedback, fileName: fileUrl });
    if(fileUrl) {
        DB.insert('documents', { staffName: staff, docType: 'KPI / Appraisal', fileName: fileUrl });
    }
    renderKPI();
}

async function deleteKPI(id) {
    if(await uiConfirm('Delete this KPI record?')) {
        DB.remove('kpi', { _id: id });
        renderKPI();
    }
}

// Vacancy Application (Staff Portal)
let currentVacancyApplyFile = null;
let currentVacancyPosition = '';

function setupVacancyApplyDropzone() {
    var dropzone = document.getElementById('vac-apply-dropzone');
    var fileInput = document.getElementById('vac-apply-file-input');
    var dropText = document.getElementById('vac-apply-drop-text');
    if(!dropzone) return;

    dropzone.onclick = () => fileInput.click();
    
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--gold)';
        dropzone.style.background = '#fff8e1';
    };
    
    dropzone.ondragleave = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
    };
    
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleVacFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleVacFileSelect(e.target.files[0]);
        }
    };
    
    function handleVacFileSelect(file) {
        dropText.innerHTML = '<strong style="color:var(--navy)">' + file.name + '</strong><br><span style="font-size:12px">(' + Math.round(file.size/1024) + ' KB) - Ready to save</span>';
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentVacancyApplyFile = {
                filename: file.name,
                base64: evt.target.result
            };
        };
        reader.readAsDataURL(file);
    }
}

function showVacancyApplyForm(position) {
    currentVacancyApplyFile = null;
    currentVacancyPosition = position;
    var dropText = document.getElementById('vac-apply-drop-text');
    if (dropText) dropText.innerHTML = 'Drag and drop your CV here, or click to browse';
    document.getElementById('vac-apply-notes').value = '';
    document.getElementById('vac-apply-modal').classList.remove('hidden');
}

async function submitVacancyApplication() {
    var notes = document.getElementById('vac-apply-notes').value;
    var name = APP.currentUser.name;
    if(APP.currentUser.linkedStaffId) {
        var s = DB.findOne('staff', { _id: APP.currentUser.linkedStaffId });
        if(s) name = s.name;
    }
    
    let fileUrl = '';
    
    if (currentVacancyApplyFile) {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentVacancyApplyFile.filename,
                    base64: currentVacancyApplyFile.base64,
                    staffName: name
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch (e) {
            alert('File upload error');
            return;
        }
    }
    
    DB.insert('recruitment', { name: name, position: currentVacancyPosition, status: 'Internal Application', notes: notes, fileName: fileUrl });
    alert('Application submitted successfully!');
    document.getElementById('vac-apply-modal').classList.add('hidden');
}

// ══════════════════════════════════════════════════
// STAFF DISCIPLINE MODULE
// ══════════════════════════════════════════════════

let currentDiscFile = null;
let actionDiscId = null;

function renderDiscipline() {
    var docs = DB.findAll('discipline');
    var staffList = DB.findAll('staff');
    var role = APP.currentUser ? APP.currentUser.role : '';
    
    if(role === 'staff' && APP.currentUser.linkedStaffId) {
        var staffRec = DB.findOne('staff', { _id: APP.currentUser.linkedStaffId });
        if(staffRec) {
            docs = docs.filter(d => d.staffName === staffRec.name);
        } else {
            docs = [];
        }
    }
    
    docs.sort((a,b) => b._created - a._created);

    var html = '<div style="display:flex;justify-content:space-between;margin-bottom:1rem">';
    html += '<h3 style="color:var(--navy);font-size:18px"><span data-i18n="lbl_discipline_mgmt">Staff Discipline Management</span></h3>';
    if(role === 'admin' || role === 'manager') {
        html += '<button class="btn btn-primary" onclick="showIncidentForm()"><i class="ti ti-plus"></i> <span data-i18n="btn_log_discipline">Log Disciplinary Action</span></button>';
    }
    html += '</div>';

    html += '<table class="table"><thead><tr><th><span data-i18n="th_staff_name">Staff Name</span></th><th><span data-i18n="th_type">Type</span></th><th><span data-i18n="th_severity">Severity</span></th><th><span data-i18n="th_date">Date</span></th><th><span data-i18n="th_status">Status</span></th><th><span data-i18n="th_action">Action</span></th></tr></thead><tbody>';
    if(docs.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:#888"><span data-i18n="msg_no_discipline">No disciplinary records found.</span></td></tr>';
    } else {
        docs.forEach(function(d) {
            html += '<tr>';
            html += '<td style="font-weight:600">'+(d.staffName||'')+'</td>';
            html += '<td>'+(d.type||'')+'</td>';
            html += '<td>'+(d.severity||'')+'</td>';
            html += '<td>'+(d.date ? new Date(d.date).toLocaleDateString() : '')+'</td>';
            
            let statusColor = d.status === 'Finalized' ? '#16a34a' : (d.status === 'Pending Explanation' ? '#e24b4a' : '#f59e0b');
            html += '<td style="color:'+statusColor+';font-weight:600">'+(d.status||'')+'</td>';
            
            html += '<td>';
            if (d.status === 'Pending Explanation' && role === 'staff') {
                html += '<button class="btn btn-primary btn-sm" onclick="showExplanationForm(\''+d._id+'\')"><span data-i18n="btn_add_explanation">Add Explanation</span></button>';
            } else if (d.status === 'Under Review' && (role === 'admin' || role === 'manager')) {
                html += '<button class="btn btn-gold btn-sm" onclick="showFinalizeForm(\''+d._id+'\')"><span data-i18n="btn_feedback_finalize">Feedback / Finalize</span></button>';
            } else if (d.status === 'Finalized') {
                html += '<button class="btn btn-outline btn-sm" onclick="viewDisciplineRecord(\''+d._id+'\')"><span data-i18n="btn_view_record">View Record</span></button>';
            } else if (role === 'admin' || role === 'manager') {
                html += '<button class="btn btn-outline btn-sm" onclick="viewDisciplineRecord(\''+d._id+'\')"><span data-i18n="btn_view">View</span></button>';
            }
            if(role === 'admin') {
                html += ' <button class="btn btn-danger btn-sm" style="margin-left:4px" onclick="deleteDiscipline(\''+d._id+'\')"><i class="ti ti-trash"></i></button>';
            }
            html += '</td>';
            html += '</tr>';
        });
    }
    html += '</tbody></table>';

    // Log Incident Modal
    html += '<div id="disc-incident-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:500px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Log Disciplinary Incident</h4>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_staff_member">Staff Member</span></label><select id="disc-staff"><option value=""><span data-i18n="opt_sel_staff">-- Select Staff --</span></option>';
    staffList.forEach(s => { html += '<option value="'+s.name+'">'+s.name+'</option>'; });
    html += '</select></div>';
    html += '<div style="margin-bottom:1rem"><label>Incident Date</label><input type="date" id="disc-date" value="'+(new Date().toISOString().split('T')[0])+'"></div>';
    html += '<div style="margin-bottom:1rem"><label>Offense Type</label><select id="disc-type"><option>Tardiness</option><option>Absence</option><option>Insubordination</option><option>Misconduct</option><option>Performance</option><option>Other</option></select></div>';
    html += '<div style="margin-bottom:1rem"><label>Initial Severity</label><select id="disc-severity"><option><span data-i18n="opt_verbal_warn">Verbal Warning</span></option><option><span data-i18n="opt_written_warn">Written Warning</span></option><option><span data-i18n="opt_final_warn">Final Warning</span></option><option><span data-i18n="opt_suspension">Suspension</span></option></select></div>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="th_description">Description</span></label><textarea id="disc-desc" rows="4" placeholder="Describe the incident..."></textarea></div>';
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveIncident()">Log Incident</button><button class="btn btn-outline" onclick="document.getElementById(\'disc-incident-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    // Explanation Modal
    html += '<div id="disc-explain-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:500px;max-height:90vh;overflow-y:auto">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Add Explanation / Evidence</h4>';
    html += '<p style="font-size:12px;color:#666;margin-bottom:1rem">Please provide your explanation for the incident. You may optionally attach supporting evidence.</p>';
    html += '<div style="margin-bottom:1rem"><label><span data-i18n="lbl_your_exp">Your Explanation</span></label><textarea id="disc-explain" rows="4" placeholder="Type your response here..."></textarea></div>';
    html += '<div style="margin-bottom:1rem"><label>Upload Evidence <span style="color:#888;font-size:12px">(Optional)</span></label>';
    html += '<div id="disc-dropzone" style="border:2px dashed #ccc;border-radius:8px;padding:1.5rem;text-align:center;background:#fafafa;cursor:pointer;">';
    html += '<i class="ti ti-upload" style="font-size:24px;color:#aaa"></i><p style="margin:5px 0 0 0;color:#666;font-size:12px" id="disc-drop-text">Click to browse or drag file here</p>';
    html += '<input type="file" id="disc-file-input" style="display:none">';
    html += '</div></div>';
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveExplanation()">Submit Response</button><button class="btn btn-outline" onclick="document.getElementById(\'disc-explain-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';

    // Finalize Modal
    html += '<div id="disc-finalize-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:500px">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Manager Feedback & Finalize</h4>';
    html += '<div id="disc-finalize-details" style="background:#f9f9f9;padding:1rem;border-radius:8px;margin-bottom:1rem;font-size:13px;max-height:150px;overflow-y:auto"></div>';
    html += '<div style="margin-bottom:1rem"><label>Final Outcome</label><select id="disc-final-outcome"><option>Verbal Warning Recorded</option><option>Written Warning Issued</option><option>Final Warning Issued</option><option>Suspension Executed</option><option><span data-i18n="opt_termination">Termination</span></option><option>Cleared/No Action</option></select></div>';
    html += '<div style="margin-bottom:1rem"><label>Manager Feedback / Notes</label><textarea id="disc-final-notes" rows="3" placeholder="Provide feedback and additional notes..."></textarea></div>';
    html += '<div style="display:flex;gap:1rem"><button class="btn btn-primary" onclick="saveFinalize()">Finalize Record</button><button class="btn btn-outline" onclick="document.getElementById(\'disc-finalize-modal\').classList.add(\'hidden\')"><span data-i18n="btn_cancel">Cancel</span></button></div>';
    html += '</div>';
    
    // View Modal
    html += '<div id="disc-view-modal" class="hidden" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:2rem;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);z-index:9999;width:500px;max-height:90vh;overflow-y:auto">';
    html += '<h4 style="margin-bottom:1rem;color:var(--navy)">Disciplinary Record</h4>';
    html += '<div id="disc-view-content" style="font-size:13px;color:#333;line-height:1.6"></div>';
    html += '<div style="margin-top:1.5rem"><button class="btn btn-outline" style="width:100%;justify-content:center" onclick="document.getElementById(\'disc-view-modal\').classList.add(\'hidden\')"><span data-i18n="btn_close">Close</span></button></div>';
    html += '</div>';

    document.getElementById('section-discipline').innerHTML = html;


    if (typeof changeLang === 'function') changeLang();
    if (typeof changeLang === 'function') changeLang();
    setTimeout(setupDiscDropzone, 50);
}

function showIncidentForm() {
    document.getElementById('disc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('disc-desc').value = '';
    document.getElementById('disc-staff').value = '';
    document.getElementById('disc-incident-modal').classList.remove('hidden');
}

function saveIncident() {
    var staff = document.getElementById('disc-staff').value;
    var date = document.getElementById('disc-date').value;
    var type = document.getElementById('disc-type').value;
    var severity = document.getElementById('disc-severity').value;
    var desc = document.getElementById('disc-desc').value;
    
    if(!staff || !desc) return alert('Please fill in staff and description.');
    
    DB.insert('discipline', {
        staffName: staff,
        date: date,
        type: type,
        severity: severity,
        description: desc,
        status: 'Pending Explanation',
        _created: Date.now(),
        createdBy: APP.currentUser ? APP.currentUser.username : 'System'
    });
    
    if (typeof createNotification === 'function') {
        var sInfo = DB.findOne('staff', { name: staff });
        if (sInfo && sInfo.username) {
            createNotification('pending', 'Disciplinary Incident Logged', 'An incident ('+type+') requires your explanation.', { section: 'discipline' }, [sInfo.username]);
        }
    }
    
    document.getElementById('disc-incident-modal').classList.add('hidden');
    renderDiscipline();
}

async function deleteDiscipline(id) {
    if(await uiConfirm('Are you sure you want to delete this record?')) {
        DB.remove('discipline', { _id: id });
        renderDiscipline();
    }
}

function setupDiscDropzone() {
    var dropzone = document.getElementById('disc-dropzone');
    var fileInput = document.getElementById('disc-file-input');
    var dropText = document.getElementById('disc-drop-text');
    if(!dropzone) return;
    
    dropzone.onclick = () => fileInput.click();
    
    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--gold)';
        dropzone.style.background = '#f0fcf6';
    };
    dropzone.ondragleave = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
    };
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        dropzone.style.background = '#fafafa';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleDiscFileSelect(e.dataTransfer.files[0]);
        }
    };
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleDiscFileSelect(e.target.files[0]);
        }
    };
    
    function handleDiscFileSelect(file) {
        dropText.innerHTML = '<strong style="color:var(--navy)">' + file.name + '</strong><br><span style="font-size:12px">(' + Math.round(file.size/1024) + ' KB)</span>';
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentDiscFile = {
                filename: file.name,
                base64: evt.target.result
            };
        };
        reader.readAsDataURL(file);
    }
}

function showExplanationForm(id) {
    actionDiscId = id;
    currentDiscFile = null;
    document.getElementById('disc-explain').value = '';
    var dropText = document.getElementById('disc-drop-text');
    if(dropText) dropText.innerHTML = 'Click to browse or drag file here';
    document.getElementById('disc-explain-modal').classList.remove('hidden');
}

async function saveExplanation() {
    var explain = document.getElementById('disc-explain').value;
    if(!explain && !currentDiscFile) return alert('Please provide an explanation or upload evidence.');
    
    var doc = DB.findOne('discipline', { _id: actionDiscId });
    if(!doc) return alert('Record not found.');
    
    let fileUrl = '';
    if (currentDiscFile) {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: currentDiscFile.filename,
                    base64: currentDiscFile.base64,
                    staffName: doc.staffName
                })
            });
            const data = await res.json();
            if(data.success) {
                fileUrl = data.filepath;
            } else {
                alert('File upload failed: ' + data.error);
                return;
            }
        } catch (e) {
            alert('File upload error');
            return;
        }
    }
    
    DB.update('discipline', { _id: actionDiscId }, {
        explanation: explain,
        explanationFile: fileUrl,
        status: 'Under Review'
    });
    
    if (typeof createNotification === 'function') {
        createNotification('info', 'Explanation Submitted', doc.staffName + ' submitted explanation for ' + doc.type, { section: 'discipline' }, ['admin', 'manager']);
    }
    
    document.getElementById('disc-explain-modal').classList.add('hidden');
    renderDiscipline();
}

function showFinalizeForm(id) {
    actionDiscId = id;
    var doc = DB.findOne('discipline', { _id: id });
    if(!doc) return;
    
    var html = '<strong>Incident:</strong> ' + doc.description + '<br><br>';
    html += '<strong>Staff Explanation:</strong> ' + (doc.explanation || '<em>None provided</em>') + '<br>';
    if(doc.explanationFile) {
        let niceName = doc.explanationFile.split('_').slice(1).join('_') || 'View Evidence';
        html += '<strong>Evidence:</strong> <a href="'+doc.explanationFile+'" target="_blank" style="color:var(--gold)">'+niceName+'</a><br>';
    }
    
    document.getElementById('disc-finalize-details').innerHTML = html;
    document.getElementById('disc-final-notes').value = '';
    document.getElementById('disc-finalize-modal').classList.remove('hidden');
}

function saveFinalize() {
    var outcome = document.getElementById('disc-final-outcome').value;
    var notes = document.getElementById('disc-final-notes').value;
    
    var doc = DB.findOne('discipline', { _id: actionDiscId });
    if(!doc) return;
    
    DB.update('discipline', { _id: actionDiscId }, {
        finalOutcome: outcome,
        finalNotes: notes,
        status: 'Finalized',
        finalizedAt: Date.now()
    });
    
    // Auto-generate Document record in Document Center
    var docRecord = {
        staffName: doc.staffName,
        docType: 'Disciplinary Record',
        fileName: '',
        description: 'Auto-generated discipline record: ' + outcome + ' for ' + doc.type,
        _created: Date.now()
    };
    if(doc.explanationFile) {
        docRecord.fileName = doc.explanationFile;
    }
    DB.insert('documents', docRecord);
    
    if (typeof createNotification === 'function') {
        var sInfo = DB.findOne('staff', { name: doc.staffName });
        if (sInfo && sInfo.username) {
            createNotification('approved', 'Disciplinary Action Finalized', 'Your incident review is complete. Outcome: ' + outcome, { section: 'discipline' }, [sInfo.username]);
        }
    }
    
    document.getElementById('disc-finalize-modal').classList.add('hidden');
    renderDiscipline();
}

function viewDisciplineRecord(id) {
    var doc = DB.findOne('discipline', { _id: id });
    if(!doc) return;
    
    var html = '<div style="margin-bottom:10px"><strong>Staff:</strong> ' + doc.staffName + '</div>';
    html += '<div style="margin-bottom:10px"><strong>Date:</strong> ' + (doc.date ? new Date(doc.date).toLocaleDateString() : '') + '</div>';
    html += '<div style="margin-bottom:10px"><strong>Type:</strong> ' + doc.type + ' (' + doc.severity + ')</div>';
    html += '<div style="margin-bottom:15px"><strong>Incident Description:</strong><br><div style="background:#f9f9f9;padding:10px;border-radius:6px;margin-top:5px">' + doc.description + '</div></div>';
    
    if(doc.explanation || doc.explanationFile) {
        html += '<div style="margin-bottom:15px"><strong>Staff Explanation:</strong><br><div style="background:#f9f9f9;padding:10px;border-radius:6px;margin-top:5px">' + (doc.explanation || '<em>None</em>') + '</div></div>';
        if(doc.explanationFile) {
            html += '<div style="margin-bottom:15px"><strong>Evidence:</strong> <a href="'+doc.explanationFile+'" target="_blank" style="color:var(--gold)"><span data-i18n="btn_dl_file">Download File</span></a></div>';
        }
    }
    
    if(doc.status === 'Finalized') {
        html += '<div style="background:#eafaf1;padding:10px;border-radius:6px;margin-top:15px;border:1px solid #a7f3d0">';
        html += '<strong>Final Outcome:</strong> ' + doc.finalOutcome + '<br>';
        if(doc.finalNotes) html += '<strong>HR Notes:</strong> ' + doc.finalNotes + '<br>';
        html += '<strong>Finalized On:</strong> ' + new Date(doc.finalizedAt).toLocaleDateString();
        html += '</div>';
    }
    
    document.getElementById('disc-view-content').innerHTML = html;
    document.getElementById('disc-view-modal').classList.remove('hidden');
}
