<template>
  <v-container>
    <v-card class="mx-auto" max-width="800">
      <!-- Toolbar -->
      <v-toolbar color="black" dark>
        <v-toolbar-title>TODO List</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar color="black" dark>
          <v-text-field v-model="searchQuery" label="Search" dense hide-details solo-inverted></v-text-field>
        </v-toolbar>

        <v-btn color="success" @click="showAddDialog = true">Add Task</v-btn>
      </v-toolbar>

      <!-- Filter section -->
      <v-toolbar color="grey lighten-1" dark>
        <v-select v-model="selectedStatus" :items="statusOptions" label="Filter by Status" dense hide-details
          class="filter-select" @change="filterTasks" solo-inverted></v-select>
      </v-toolbar>

      <!-- Task List -->
      <v-list v-if="taskList.length > 0">
        <v-list-item v-for="(task, index) in taskList" :key="index" class="todo-task">
          <v-list-item-content>
            <v-list-item-title class="task-name">{{ task.name }}</v-list-item-title>
            <v-list-item-subtitle class="task-info">Status: {{ task.status }}</v-list-item-subtitle>
            <v-list-item-subtitle class="task-info">Created At: {{ getIST(task.createdAt) }}</v-list-item-subtitle>
            <v-list-item-subtitle v-if="task.updatedAt" class="task-info">Updated At: {{ getIST(task.updatedAt)
              }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="editTask(index, task.id)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon @click="deleteTask(index, task.id)">
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
            <v-btn color="success" @click="saveTask">{{ editedTaskIndex !== null ? 'Save' : 'Add' }}</v-btn>
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
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore/lite';
import { db } from '../main';

export default {
  data() {
    return {
      tasks: [],
      newTask: {
        name: '',
        status: ''
      },
      editedTaskIndex: null,
      showAddDialog: false,
      selectedStatus: '',
      snackbar: false,
      snackbarColor: 'success',
      timeout: 6000,// Snackbar timeout in milliseconds

      searchQuery: '',
      filteredTasks: []
    };
  },

  computed: {
    taskList() {
      let filteredTasks = this.tasks;

      // Filter by status
      if (this.selectedStatus) {
        filteredTasks = filteredTasks.filter(task => task.status === this.selectedStatus);
      }

      // Filter by search query
      if (this.searchQuery.trim() !== '') {
        const searchRegex = new RegExp(this.searchQuery.trim(), 'i');
        filteredTasks = filteredTasks.filter(task => searchRegex.test(task.name));
      }

      return filteredTasks;
    },
    statusOptions() {
      return [...new Set(this.tasks.map(task => task.status))];
    }
  },


  methods: {
    async addTask() {
      try {
        await addDoc(collection(db, 'tasks'), {
          name: this.newTask.name,
          status: this.newTask.status,
          createdAt: new Date().toISOString(), // Store complete ISO date string
          updatedAt: new Date().toISOString(), // Store complete ISO date string
        });

        // Reset the newTask object
        this.resetNewTask();

        // Fetch tasks again after adding the new task
        this.getDatas();

        // Show toast message for adding task
        this.showAddToast();

        // Close the add dialog
        this.showAddDialog = false;
      } catch (error) {
        console.error('Error adding task: ', error);
      }
    },


    async deleteTask(index, id) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        this.tasks.splice(index, 1);

        // Show toast message for deleting task
        this.showDeleteToast();
      } catch (error) {
        console.error('Error deleting task: ', error);
      }
    },

    async editTask(index, id) {
      this.editedTaskIndex = index;
      this.newTask.name = this.tasks[index].name;
      this.newTask.status = this.tasks[index].status;
      this.newTask.id = id; // Store the task ID in newTask
      this.showAddDialog = true;
      this.getDatas();
    },

    async saveTask() {
      if (this.editedTaskIndex !== null) {
        // Use the task ID for the update operation
        const taskRef = doc(db, 'tasks', this.newTask.id);
        await updateDoc(taskRef, {
          name: this.newTask.name,
          status: this.newTask.status,
          updatedAt: new Date().toISOString().split('T')[0]
        });

        // Update the task list locally without refreshing
        const updatedTaskIndex = this.tasks.findIndex(task => task.id === this.newTask.id);
        if (updatedTaskIndex !== -1) {
          this.tasks[updatedTaskIndex].name = this.newTask.name;
          this.tasks[updatedTaskIndex].status = this.newTask.status;
          this.tasks[updatedTaskIndex].updatedAt = new Date().toISOString().split('T')[0];
        }

        this.resetNewTask();
        this.editedTaskIndex = null;
        this.showAddDialog = false;

        // Show toast message for editing task
        this.showEditToast();
      } else {
        this.addTask();
      }
    },

    showAddToast() {
      this.snackbarColor = 'success';
      this.snackbarMessage = 'Task added successfully!';
      this.showSnackbar();
    },

    showDeleteToast() {
      this.snackbarColor = 'error';
      this.snackbarMessage = 'Task deleted successfully!';
      this.showSnackbar();
    },

    showEditToast() {
      this.snackbarColor = 'warning';
      this.snackbarMessage = 'Task edited successfully!';
      this.showSnackbar();
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

    async getDatas() {
      try {
        const taskdata = collection(db, 'tasks');
        const tasksSnapshot = await getDocs(taskdata);
        const taskList = tasksSnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });
        console.log("/////", taskList);
        this.tasks = taskList;
      } catch (error) {
        console.error('Error fetching tasks: ', error);
      }
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
  },

  mounted() {
    // Fetch tasks when the component is mounted
    this.getDatas();
  }
};
</script>
