class TaskManager {
    constructor() {
        this.tasks = [];
        this.storage = new StorageManager();
        this._load();
    }

    _load() {
        this.tasks = this.storage.load();
    }

    _save() {
        return this.storage.save(this.tasks);
    }

    add(title, description, status = 'todo') {
        const task = new Task(title, description, status);
        this.tasks.push(task);
        this._save();
        return task;
    }

    get(id) {
        return this.tasks.find(t => t.id === id);
    }

    update(id, title, description, status) {
        const task = this.get(id);
        if (task) {
            task.update(title, description, status);
            this._save();
            return task;
        }
        return null;
    }

    delete(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this._save();
            return true;
        }
        return false;
    }

    move(id, status) {
        const task = this.get(id);
        if (task) {
            task.setStatus(status);
            this._save();
            return task;
        }
        return null;
    }

    getByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }

    getAll() {
        return this.tasks;
    }

    getCounts() {
        return {
            todo: this.getByStatus('todo').length,
            inprogress: this.getByStatus('inprogress').length,
            done: this.getByStatus('done').length,
            total: this.tasks.length
        };
    }

    clearAll() {
        this.tasks = [];
        return this.storage.clear();
    }
}
