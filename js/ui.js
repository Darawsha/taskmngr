class UIManager {
  constructor(taskManager) {
    this.tm = taskManager;
    this.editingId = null;
    this.searchQuery = "";
    this.deadlineTimer = null;
    this._cacheElements();
    this._bindEvents();
    this._setupDragDrop();
    this._setupSearch();
  }

  _cacheElements() {
    this.modal = document.getElementById("taskModal");
    this.form = document.getElementById("taskForm");
    this.titleInput = document.getElementById("taskTitle");
    this.descInput = document.getElementById("taskDescription");
    this.deadlineInput = document.getElementById("taskDeadline");
    this.statusSelect = document.getElementById("taskStatus");
    this.modalTitle = document.getElementById("modalTitle");
    this.submitBtn = document.getElementById("submitBtn");
    this.searchInput = document.getElementById("searchInput");
    this.clearSearchBtn = document.getElementById("clearSearch");
    this.themeToggle = document.getElementById("themeToggle");
    this.containers = {
      todo: document.getElementById("todoTasks"),
      inprogress: document.getElementById("inprogressTasks"),
      done: document.getElementById("doneTasks"),
    };
  }

  _bindEvents() {
    document
      .getElementById("addTaskBtn")
      .addEventListener("click", () => this.openModal());
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("cancelBtn")
      .addEventListener("click", () => this.closeModal());
    this.themeToggle.addEventListener("click", () => this._toggleTheme());

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("show")) {
        this.closeModal();
      }
    });
  }

  _toggleTheme() {
    const isDark = document.body.dataset.theme !== "light";
    document.body.dataset.theme = isDark ? "light" : "dark";
    this.themeToggle.textContent = isDark ? "Dark mode" : "Light mode";
  }

  _setupSearch() {
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.clearSearchBtn.style.display = this.searchQuery ? "flex" : "none";
      this._filterTasks();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.style.display = "none";
      this._filterTasks();
    });
  }

  _filterTasks() {
    const cards = document.querySelectorAll(".task-card");
    cards.forEach((card) => {
      const title = card.querySelector(".task-title").textContent.toLowerCase();
      const desc = card.querySelector(".task-description");
      const descText = desc ? desc.textContent.toLowerCase() : "";
      const matches =
        title.includes(this.searchQuery) || descText.includes(this.searchQuery);
      card.classList.toggle("hidden", !matches);
    });
    this._updateCounts();
  }

  _setupDragDrop() {
    let dragged = null;

    Object.values(this.containers).forEach((container) => {
      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        container.classList.add("drag-over");
      });

      container.addEventListener("dragleave", () => {
        container.classList.remove("drag-over");
      });

      container.addEventListener("drop", (e) => {
        e.preventDefault();
        container.classList.remove("drag-over");
        if (dragged) {
          const id = dragged.dataset.taskId;
          const status = container.dataset.status;
          this._moveTask(id, status);
        }
      });
    });

    this._initDrag = (card) => {
      card.draggable = true;
      card.addEventListener("dragstart", () => {
        dragged = card;
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        dragged = null;
      });
    };
  }

  openModal(task = null) {
    if (task) {
      this.editingId = task.id;
      this.modalTitle.textContent = "Edit Task";
      this.submitBtn.textContent = "Save Changes";
      this.titleInput.value = task.title;
      this.descInput.value = task.description;
      this.deadlineInput.value = task.deadline || "";
      this.statusSelect.value = task.status;
    } else {
      this.editingId = null;
      this.modalTitle.textContent = "New Task";
      this.submitBtn.textContent = "Create Task";
      this.form.reset();
    }
    this.modal.classList.add("show");
    this.titleInput.focus();
  }

  closeModal() {
    this.modal.classList.remove("show");
    this.form.reset();
    this.editingId = null;
  }

  _formatDeadline(deadline) {
    if (!deadline) return "";

    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      return deadline;
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  _getTimeLeft(deadline) {
    if (!deadline) return "No deadline";

    const diff = new Date(deadline).getTime() - Date.now();
    if (Number.isNaN(diff)) return "No deadline";

    if (diff <= 0) return "Over";

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return `${parts.join(" ")} left`;
  }

  _updateDeadlineTimers() {
    document.querySelectorAll(".task-card[data-deadline]").forEach((card) => {
      const deadlineEl = card.querySelector(".deadline-time-left");
      if (!deadlineEl) return;
      deadlineEl.textContent = this._getTimeLeft(card.dataset.deadline);
    });
  }

  _startDeadlineTimer() {
    if (this.deadlineTimer) return;
    this.deadlineTimer = setInterval(() => {
      this._updateDeadlineTimers();
    }, 1000);
  }

  _handleSubmit() {
    const title = this.titleInput.value.trim();
    const desc = this.descInput.value.trim();
    const deadline = this.deadlineInput.value.trim();
    const status = this.statusSelect.value;

    if (!title) return;

    if (this.editingId) {
      this.tm.update(this.editingId, title, desc, status, deadline);
    } else {
      this.tm.add(title, desc, status, deadline);
    }

    this.closeModal();
    this.render();
  }

  _moveTask(id, status) {
    this.tm.move(id, status);
    this.render();
  }

  _editTask(id) {
    const task = this.tm.get(id);
    if (task) this.openModal(task);
  }

  _deleteTask(id) {
    if (confirm("Delete this task?")) {
      this.tm.delete(id);
      this.render();
    }
  }

  _nextStatus(status) {
    const flow = { todo: "inprogress", inprogress: "done", done: "todo" };
    return flow[status];
  }

  _statusLabel(status) {
    const labels = {
      todo: "To Do",
      inprogress: "In Progress",
      done: "Completed",
    };
    return labels[status];
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  _createCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.dataset.taskId = task.id;
    card.dataset.status = task.status;

    const next = this._nextStatus(task.status);
    const nextLabel = this._statusLabel(next);

    const deadlineMarkup = task.deadline
      ? `
                <div class="task-deadline">
                    <div class="deadline-main">
                        <span class="deadline-label">Deadline</span>
                        <span class="deadline-value">${this._escapeHtml(this._formatDeadline(task.deadline))}</span>
                    </div>
                    <div class="deadline-time-left">${this._escapeHtml(this._getTimeLeft(task.deadline))}</div>
                </div>
            `
      : "";

    card.dataset.deadline = task.deadline || "";

    card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${this._escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="btn-edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${this._escapeHtml(task.description)}</p>` : ""}
            ${deadlineMarkup}
            <div class="task-footer">
                <button class="btn-move" data-next="${next}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    Move to ${nextLabel}
                </button>
            </div>
        `;

    card.querySelector(".btn-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      this._editTask(task.id);
    });

    card.querySelector(".btn-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      this._deleteTask(task.id);
    });

    card.querySelector(".btn-move").addEventListener("click", (e) => {
      e.stopPropagation();
      this._moveTask(task.id, next);
    });

    this._initDrag(card);
    return card;
  }

  _renderColumn(status) {
    const container = this.containers[status];
    const tasks = this.tm.getByStatus(status);
    container.innerHTML = "";

    if (tasks.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                    </svg>
                    <p>No tasks</p>
                </div>
            `;
    } else {
      tasks.forEach((task) => {
        container.appendChild(this._createCard(task));
      });
    }
  }

  _updateCounts() {
    const countVisible = (container) => {
      return container.querySelectorAll(".task-card:not(.hidden)").length;
    };
    document.getElementById("todoCount").textContent = countVisible(
      this.containers.todo,
    );
    document.getElementById("inprogressCount").textContent = countVisible(
      this.containers.inprogress,
    );
    document.getElementById("doneCount").textContent = countVisible(
      this.containers.done,
    );
  }

  render() {
    this._renderColumn("todo");
    this._renderColumn("inprogress");
    this._renderColumn("done");
    this._updateCounts();
  }

  init() {
    document.body.dataset.theme = "dark";
    this.themeToggle.textContent = "Light mode";
    this._startDeadlineTimer();
    this.render();
  }
}
