class Task {
    constructor(title, description = '', status = 'todo', id = null) {
        this.id = id || this._generateId();
        this.title = title;
        this.description = description;
        this.status = status;
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    setStatus(status) {
        this.status = status;
        this.updatedAt = new Date().toISOString();
    }

    update(title, description, status) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        const task = new Task(data.title, data.description, data.status, data.id);
        task.createdAt = data.createdAt;
        task.updatedAt = data.updatedAt || data.createdAt;
        return task;
    }
}
