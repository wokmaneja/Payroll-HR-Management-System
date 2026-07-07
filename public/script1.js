
    function openDeptModal(){document.getElementById('dept-modal').style.display='flex';renderDeptList();}
    function closeDeptModal(){document.getElementById('dept-modal').style.display='none';}
    function renderDeptList(){var wrap=document.getElementById('dept-list-wrap');var all=DB.findAll('departments').sort(function(a,b){return a.name.localeCompare(b.name)});var seen={};all=all.filter(function(d){if(seen[d.name])return false;seen[d.name]=true;return true;});if(!all.length){wrap.innerHTML='<div style="padding:1rem;color:#888;font-size:12px;text-align:center"><span data-i18n="msg_empty_dept">No departments</span></div>';return}var html='';all.forEach(function(d){html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #eee;font-size:13px"><span>'+d.name+'</span><i class="ti ti-trash" style="color:#dc2626;cursor:pointer" onclick="deleteDept(\''+d._id+'\')"></i></div>'});wrap.innerHTML=html; setTimeout(translateUI, 10); }
    function addDept(){var val=document.getElementById('dept-new-name').value.trim();if(!val)return;DB.insert('departments',{name:val});document.getElementById('dept-new-name').value='';renderDeptList();refreshDeptDropdown();}
    function deleteDept(id){customConfirm('Delete this department?', function(){ DB.remove('departments',{_id:id});renderDeptList();refreshDeptDropdown(); });}
    function refreshDeptDropdown(){var sel=document.getElementById('sf-department');if(!sel)return;var cur=sel.value;var html='<option value="">-- Select Department --</option>';var all=DB.findAll('departments').sort(function(a,b){return a.name.localeCompare(b.name)});var seen={};all=all.filter(function(d){if(seen[d.name])return false;seen[d.name]=true;return true;});all.forEach(function(d){html+='<option value="'+d.name+'">'+d.name+'</option>'});sel.innerHTML=html;if(cur)sel.value=cur;}
    window.addEventListener('DOMContentLoaded', function() { setTimeout(refreshDeptDropdown, 500); });

    async function changePassword() {
      const cur = document.getElementById('cpw-current').value;
      const new1 = document.getElementById('cpw-new').value;
      const new2 = document.getElementById('cpw-confirm').value;
      const msg = document.getElementById('cpw-msg');
      if (!cur || !new1 || !new2) { msg.style.display='block'; msg.style.color='red'; msg.textContent='All fields required.'; return; }
      if (new1 !== new2) { msg.style.display='block'; msg.style.color='red'; msg.textContent='New passwords do not match.'; return; }
      
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
        body: JSON.stringify({ currentPassword: cur, newPassword: new1 })
      });
      const data = await res.json();
      if (!res.ok) {
        msg.style.display='block'; msg.style.color='red'; msg.textContent=data.error || 'Failed to change password.';
      } else {
        msg.style.display='block'; msg.style.color='green'; msg.textContent='Password changed successfully!';
        setTimeout(() => {
          document.getElementById('modal-changepw').style.display='none';
          document.getElementById('cpw-current').value='';
          document.getElementById('cpw-new').value='';
          document.getElementById('cpw-confirm').value='';
          msg.style.display='none';
        }, 1500);
      }
    }
  