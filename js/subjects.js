/**
 * ============================================================================
 * Subject Management Controller (Admin)
 * ============================================================================
 */

let allSubjects = [];

document.addEventListener('DOMContentLoaded', async () => {
  auth.protectRoute('admin');
  await loadSubjects();
  setupSubjectEvents();
});

async function loadSubjects() {
  try {
    allSubjects = await window.dbService.getSubjects();
    renderSubjects(allSubjects);
  } catch (err) {
    console.error("Error loading subjects:", err);
    showToast("Error loading subjects list", "error");
  }
}

function renderSubjects(subjects) {
  const tbody = document.getElementById('subjects-table-body');
  const countEl = document.getElementById('subject-count-badge');
  if (countEl) countEl.textContent = `${subjects.length} Subjects`;

  if (!tbody) return;

  if (subjects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-title">No Subjects Found</div>
          <p class="empty-desc">Create your first subject curriculum entry above.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subjects.map(s => `
    <tr>
      <td><span class="badge badge-primary" style="font-size: 0.85rem;">${escapeHtml(s.subject_code)}</span></td>
      <td><strong>${escapeHtml(s.subject_name)}</strong></td>
      <td>Semester ${s.semester}</td>
      <td>${s.credits} Credits</td>
      <td>
        <div class="table-actions">
          <button onclick="openEditSubjectModal('${s.id}')" class="btn btn-sm btn-secondary" title="Edit Subject">✏️</button>
          <button onclick="confirmDeleteSubject('${s.id}', '${escapeHtml(s.subject_name)}')" class="btn btn-sm btn-danger" title="Delete Subject">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setupSubjectEvents() {
  const searchInput = document.getElementById('subject-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = allSubjects.filter(s => 
        s.subject_name.toLowerCase().includes(q) || 
        s.subject_code.toLowerCase().includes(q)
      );
      renderSubjects(filtered);
    });
  }

  const form = document.getElementById('subject-form');
  if (form) {
    form.addEventListener('submit', handleSubjectFormSubmit);
  }
}

function openAddSubjectModal() {
  document.getElementById('modal-subject-title').textContent = 'Add New Subject';
  document.getElementById('subject-form').reset();
  document.getElementById('subject-id-field').value = '';
  document.getElementById('subject-modal-backdrop').classList.add('active');
}

function openEditSubjectModal(id) {
  const sub = allSubjects.find(s => s.id === id);
  if (!sub) return;

  document.getElementById('modal-subject-title').textContent = 'Edit Subject';
  document.getElementById('subject-id-field').value = sub.id;
  document.getElementById('input-subject-code').value = sub.subject_code;
  document.getElementById('input-subject-name').value = sub.subject_name;
  document.getElementById('input-subject-semester').value = sub.semester;
  document.getElementById('input-subject-credits').value = sub.credits;

  document.getElementById('subject-modal-backdrop').classList.add('active');
}

function closeSubjectModal() {
  document.getElementById('subject-modal-backdrop').classList.remove('active');
}

async function handleSubjectFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('subject-id-field').value;

  const subData = {
    subject_code: document.getElementById('input-subject-code').value.trim().toUpperCase(),
    subject_name: document.getElementById('input-subject-name').value.trim(),
    semester: document.getElementById('input-subject-semester').value,
    credits: document.getElementById('input-subject-credits').value
  };

  try {
    if (id) {
      await window.dbService.updateSubject(id, subData);
      showToast("Subject updated successfully!", "success");
    } else {
      await window.dbService.addSubject(subData);
      showToast("Subject added successfully!", "success");
    }
    closeSubjectModal();
    await loadSubjects();
  } catch (err) {
    console.error("Save subject failed:", err);
    showToast(err.message || "Failed to save subject", "error");
  }
}

async function confirmDeleteSubject(id, name) {
  if (confirm(`Are you sure you want to delete subject '${name}'?\nThis will remove related marks and attendance records.`)) {
    try {
      await window.dbService.deleteSubject(id);
      showToast("Subject deleted successfully", "success");
      await loadSubjects();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(err.message || "Failed to delete subject", "error");
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
