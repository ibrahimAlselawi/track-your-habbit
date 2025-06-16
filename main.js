    // DOM Elements
    const habitsList = document.getElementById('habits-list');
    const addBtn = document.getElementById('add-btn');
    const habitModal = document.getElementById('habit-modal');
    const closeModal = document.getElementById('close-modal');
    const habitForm = document.getElementById('habit-form');
    const modalTitle = document.getElementById('modal-title');
    const submitText = document.getElementById('submit-text');
    const toast = document.getElementById('toast');
    const installBtn = document.getElementById('install-btn');
    
    // Habit data
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let editingHabitId = null;
    
    // Initialize app
    function init() {
      renderHabits();
      updateStats();
      
      // Event listeners
      addBtn.addEventListener('click', openAddModal);
      closeModal.addEventListener('click', closeHabitModal);
      habitForm.addEventListener('submit', handleFormSubmit);
      
      // PWA installation
      setupPWA();
    }
    
    // Render all habits
    function renderHabits() {
      if (habits.length === 0) {
        habitsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>No habits yet</h3>
            <p>Start building your routine by adding your first habit</p>
          </div>
        `;
        return;
      }
      
      habitsList.innerHTML = '';
      
      habits.forEach(habit => {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-card';
        habitEl.innerHTML = `
          <div class="habit-header">
            <div class="habit-name">${habit.name}</div>
            <div class="frequency">${habit.frequency}</div>
          </div>
          <div class="habit-description">${habit.description || 'No description'}</div>
          <div class="habit-actions">
            <button class="btn btn-done ${habit.completedToday ? 'done' : ''}" data-id="${habit.id}">
              <i class="fas fa-${habit.completedToday ? 'check' : 'check'}"></i>
              ${habit.completedToday ? 'Done' : 'Mark Done'}
            </button>
            <button class="btn btn-edit" data-id="${habit.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-delete" data-id="${habit.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        `;
        habitsList.appendChild(habitEl);
      });
      
      // Add event listeners to action buttons
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openEditModal(id);
        });
      });
      
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          deleteHabit(id);
        });
      });
      
      document.querySelectorAll('.btn-done').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          toggleHabitCompletion(id);
        });
      });
    }
    
    // Update stats
    function updateStats() {
      document.getElementById('total-habits').textContent = habits.length;
      document.getElementById('daily-habits').textContent = 
        habits.filter(habit => habit.frequency === 'Daily').length;
      document.getElementById('completed-today').textContent = 
        habits.filter(habit => habit.completedToday).length;
    }
    
    // Open modal for adding habit
    function openAddModal() {
      modalTitle.textContent = 'Add New Habit';
      submitText.textContent = 'Add Habit';
      habitForm.reset();
      document.getElementById('habit-id').value = '';
      editingHabitId = null;
      habitModal.classList.add('active');
    }
    
    // Open modal for editing habit
    function openEditModal(id) {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;
      
      modalTitle.textContent = 'Edit Habit';
      submitText.textContent = 'Update Habit';
      document.getElementById('habit-id').value = habit.id;
      document.getElementById('habit-name').value = habit.name;
      document.getElementById('habit-description').value = habit.description || '';
      document.getElementById('habit-frequency').value = habit.frequency;
      editingHabitId = id;
      habitModal.classList.add('active');
    }
    
    // Close modal
    function closeHabitModal() {
      habitModal.classList.remove('active');
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
      e.preventDefault();
      
      const id = document.getElementById('habit-id').value;
      const name = document.getElementById('habit-name').value;
      const description = document.getElementById('habit-description').value;
      const frequency = document.getElementById('habit-frequency').value;
      
      if (editingHabitId) {
        // Update existing habit
        habits = habits.map(habit => 
          habit.id === editingHabitId 
            ? {...habit, name, description, frequency} 
            : habit
        );
        showToast('Habit updated successfully!');
      } else {
        // Add new habit
        const newHabit = {
          id: Date.now().toString(),
          name,
          description,
          frequency,
          createdAt: new Date().toISOString(),
          completedToday: false
        };
        habits.push(newHabit);
        showToast('Habit added successfully!');
      }
      
      saveHabits();
      renderHabits();
      updateStats();
      closeHabitModal();
    }
    
    // Delete habit
    function deleteHabit(id) {
      if (!confirm('Are you sure you want to delete this habit?')) return;
      
      habits = habits.filter(habit => habit.id !== id);
      saveHabits();
      renderHabits();
      updateStats();
      showToast('Habit deleted!');
    }
    
    // Toggle habit completion
    function toggleHabitCompletion(id) {
      habits = habits.map(habit => 
        habit.id === id 
          ? {...habit, completedToday: !habit.completedToday} 
          : habit
      );
      saveHabits();
      renderHabits();
      updateStats();
      
      const habit = habits.find(h => h.id === id);
      showToast(habit.completedToday ? 'Habit marked as done!' : 'Habit marked as not done');
    }
    
    // Save habits to localStorage
    function saveHabits() {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
    
    // Show toast notification
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
    
    // PWA Installation
    let deferredPrompt;
    
    function setupPWA() {
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install button
        installBtn.style.display = 'flex';
      });
      
      // Install button click handler
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        // Optionally, send analytics event with outcome of user choice
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
        
        // Hide the install button
        installBtn.style.display = 'none';
      });
      
      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        // Hide the install button
        installBtn.style.display = 'none';
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
        console.log('PWA was installed');
      });
    }
    
    // Initialize service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registered: ', registration);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }
    
    // Initialize the app
    document.addEventListener('DOMContentLoaded', init);