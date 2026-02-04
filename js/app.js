document.addEventListener('DOMContentLoaded', () => {
    const storage = new StorageManager();
    
    if (!storage.isAvailable()) {
        console.warn('LocalStorage unavailable. Data will not persist.');
    }

    const taskManager = new TaskManager();
    const ui = new UIManager(taskManager);
    
    ui.init();
});
