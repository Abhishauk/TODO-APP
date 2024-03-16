<template>
  <v-container>
    <v-card class="mx-auto" max-width="800">
      <!-- Toolbar -->
      <v-toolbar color="black" dark>
        <v-toolbar-title>TODO List</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="success" @click="showAddDialog = true">Add Task</v-btn>
      </v-toolbar>

      <!-- Filter section -->
      <v-toolbar color="grey lighten-1" dark>
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="Filter by Status"
          dense
          hide-details
          class="filter-select"
          @change="filterTasks"
          solo-inverted
        ></v-select>
      </v-toolbar>

      <!-- Task List -->
      <v-list v-if="filteredTasks.length > 0">
        <v-list-item v-for="(task, index) in filteredTasks" :key="index" class="todo-task">
          <v-list-item-content>
            <v-list-item-title class="task-name">{{ task.name }}</v-list-item-title>
            <v-list-item-subtitle class="task-info">Status: {{ task.status }}</v-list-item-subtitle>
            <v-list-item-subtitle class="task-info">Created At: {{ getIST(task.createdAt) }}</v-list-item-subtitle>
            <v-list-item-subtitle v-if="task.updatedAt" class="task-info">Updated At: {{ getIST(task.updatedAt) }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="editTask(index)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon @click="deleteTask(index)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-alert v-else>No tasks available</v-alert>

      <!-- Add/Edit Task Dialog -->
      <v-dialog v-model="showAddDialog" max-width="500">
        <v-card>
          <v-card-title>{{ editedTaskIndex !== null ? 'Edit Task' : 'Add New Task' }}</v-card-title>
          <v-card-text>
            <v-text-field v-model="newTask.name" label="Task Name"></v-text-field>
            <v-select v-model="newTask.status" :items="['Todo', 'In Progress', 'Completed']" label="Status"></v-select>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="saveTask">{{ editedTaskIndex !== null ? 'Save' : 'Add' }}</v-btn>
            <v-btn @click="cancelEdit">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>

    <!-- Snackbar for Task Added -->
    <v-snackbar v-model="snackbar" :timeout="timeout" :color="snackbarColor">
      Task added to TODO list!
      <v-btn color="white" text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      tasks: [
        { name: 'Task 1', status: 'Todo', createdAt: '2024-03-16', updatedAt: '' },
        { name: 'Task 2', status: 'In Progress', createdAt: '2024-03-15', updatedAt: '2024-03-16' },
        { name: 'Task 3', status: 'Completed', createdAt: '2024-03-14', updatedAt: '' }
      ],
      newTask: {
        name: '',
        status: ''
      },
      editedTaskIndex: null,
      showAddDialog: false,
      selectedStatus: '',
      snackbar: false,
      snackbarColor: 'success',
      timeout: 6000 // Snackbar timeout in milliseconds
    };
  },

  computed: {
    filteredTasks() {
      if (!this.selectedStatus) return this.tasks;
      return this.tasks.filter(task => task.status === this.selectedStatus);
    },
    statusOptions() {
      return [...new Set(this.tasks.map(task => task.status))];
    }
  },

  methods: {
    addTask() {
      this.tasks.push({
        name: this.newTask.name,
        status: this.newTask.status,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: ''
      });
      this.resetNewTask();
      this.showAddDialog = false;
      this.showSnackbar(); // Show snackbar when task is added
    },
    editTask(index) {
      this.editedTaskIndex = index;
      this.newTask.name = this.tasks[index].name;
      this.newTask.status = this.tasks[index].status;
      this.showAddDialog = true;
    },
    saveTask() {
      if (this.editedTaskIndex !== null) {
        this.tasks[this.editedTaskIndex].name = this.newTask.name;
        this.tasks[this.editedTaskIndex].status = this.newTask.status;
        this.tasks[this.editedTaskIndex].updatedAt = new Date().toISOString().split('T')[0];
        this.resetNewTask();
        this.editedTaskIndex = null;
        this.showAddDialog = false;
      } else {
        this.addTask();
      }
    },
    cancelEdit() {
      this.resetNewTask();
      this.editedTaskIndex = null;
      this.showAddDialog = false;
    },
    resetNewTask() {
      this.newTask.name = '';
      this.newTask.status = '';
    },
    deleteTask(index) {
      this.tasks.splice(index, 1);
    },
    filterTasks() {
      // You can add filtering logic here if needed
    },
    getIST(timestamp) {
      const date = new Date(timestamp);
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      return date.toLocaleString('en-IN', options);
    },
    showSnackbar() {
      this.snackbar = true;
    }
  }
};
</script>

<style scoped>
.filter-select {
  width: 150px; /* Set width as desired */
}

.todo-task {
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}

.task-name {
  font-family: 'Arial', sans-serif;
  font-size: 18px;
  color: #333;
}

.task-info {
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  color: #666;
}
</style>
