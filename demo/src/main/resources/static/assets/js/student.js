const API_BASE = "/api/students";

const state = {
    keyword: "",
    editingId: null,
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadStudents();
});

function bindEvents() {
    document.getElementById("searchBtn").addEventListener("click", () => {
        state.keyword = document.getElementById("searchInput").value.trim();
        loadStudents();
    });

    document.getElementById("searchInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            state.keyword = event.target.value.trim();
            loadStudents();
        }
    });

    document.getElementById("addStudentBtn").addEventListener("click", () => {
        state.editingId = null;
        openStudentModal();
    });

    document.getElementById("studentForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveStudent();
    });
}

async function loadStudents() {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Đang tải dữ liệu...</td></tr>';

    try {
        const params = new URLSearchParams();
        if (state.keyword) {
            params.set("keyword", state.keyword);
        }

        const response = await fetch(`${API_BASE}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const students = await response.json();
        renderStudents(students || []);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Không thể tải dữ liệu.</td></tr>';
    }
}

function renderStudents(students) {
    const tbody = document.getElementById("studentTableBody");

    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu sinh viên.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td class="fw-semibold">${escapeHtml(student.studentCode || "")}</td>
            <td>${escapeHtml(student.fullName || "")}</td>
            <td>${escapeHtml(student.email || "")}</td>
            <td>${escapeHtml(student.phone || "")}</td>
            <td><span class="badge-class">${escapeHtml(student.className || "")}</span></td>
            <td class="text-end">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-action btn-view" title="Xem" data-action="view" data-id="${student.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-action btn-edit" title="Sửa" data-action="edit" data-id="${student.id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button type="button" class="btn btn-action btn-delete" title="Xóa" data-action="delete" data-id="${student.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("button[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
            const { action, id } = button.dataset;
            const student = students.find(item => item.id === id);
            if (!student) return;

            if (action === "view") {
                openStudentModal(student, true);
            }
            if (action === "edit") {
                openStudentModal(student, false);
            }
            if (action === "delete") {
                await deleteStudent(id);
            }
        });
    });
}

function openStudentModal(student = null, readOnly = false) {
    const modalEl = document.getElementById("studentModal");
    const form = document.getElementById("studentForm");

    if (typeof bootstrap === "undefined") {
        console.error("Bootstrap JS is not loaded.");
        return;
    }

    const modal = new bootstrap.Modal(modalEl);

    form.reset();
    state.editingId = student ? student.id : null;

    if (student) {
        document.getElementById("studentId").value = student.id || "";
        document.getElementById("studentCode").value = student.studentCode || "";
        document.getElementById("fullName").value = student.fullName || "";
        document.getElementById("email").value = student.email || "";
        document.getElementById("phone").value = student.phone || "";
        document.getElementById("className").value = student.className || "";
    }

    const fields = [
        document.getElementById("studentCode"),
        document.getElementById("fullName"),
        document.getElementById("email"),
        document.getElementById("phone"),
        document.getElementById("className")
    ];

    fields.forEach(field => {
        field.readOnly = readOnly;
    });

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = readOnly;
    submitButton.textContent = readOnly ? "Xem" : (student ? "Cập nhật" : "Lưu");

    modal.show();
}

async function saveStudent() {
    const studentId = document.getElementById("studentId").value;
    const payload = {
        studentCode: document.getElementById("studentCode").value.trim(),
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        className: document.getElementById("className").value.trim(),
    };

    if (!payload.studentCode || !payload.fullName || !payload.email || !payload.phone || !payload.className) {
        alert("Vui lòng nhập đầy đủ thông tin sinh viên.");
        return;
    }

    try {
        const url = studentId ? `${API_BASE}/${studentId}` : API_BASE;
        const response = await fetch(url, {
            method: studentId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const modal = typeof bootstrap !== "undefined" ? bootstrap.Modal.getInstance(document.getElementById("studentModal")) : null;
        if (modal) modal.hide();

        alert(studentId ? "Cập nhật sinh viên thành công." : "Thêm sinh viên thành công.");
        loadStudents();
    } catch (error) {
        console.error(error);
        alert("Không thể lưu dữ liệu sinh viên.");
    }
}

async function deleteStudent(studentId) {
    if (!confirm("Bạn có chắc chắn muốn xóa sinh viên này không?")) return;

    try {
        const response = await fetch(`${API_BASE}/${studentId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        alert("Xóa sinh viên thành công.");
        loadStudents();
    } catch (error) {
        console.error(error);
        alert("Xóa sinh viên thất bại.");
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

