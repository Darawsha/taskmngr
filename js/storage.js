class StorageManager {
    constructor() {
        this.key = 'taskflow_data';
    }

    save(tasks) {
        try {
            const data = tasks.map(t => t.toJSON());
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return [];
            return JSON.parse(data).map(t => Task.fromJSON(t));
        } catch (e) {
            return [];
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.key);
            return true;
        } catch (e) {
            return false;
        }
    }

    isAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}
