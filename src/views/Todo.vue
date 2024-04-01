<template>
  <!-- Container for the entire component -->
  <v-container>
    <!-- Card containing the TODO List -->
    <v-card class="mx-auto" max-width="800">
      <!-- Toolbar for the TODO List -->
      <v-toolbar color="black" dark>
        <v-toolbar-title>TODO List</v-toolbar-title> <!-- Title for the toolbar -->
        <v-spacer></v-spacer> <!-- Spacer to push the Add Task button to the right -->
        <!-- Search input field -->
        <v-text-field v-model="searchQuery" label="Search" dense hide-details solo-inverted></v-text-field>
        <!-- Button to add a new task -->
        <v-btn color="success" @click="setShowAddDialog(true)">Add Task</v-btn>
      </v-toolbar>

      <!-- Filter section for filtering tasks -->
      <v-toolbar color="grey lighten-1" dark>
        <v-select v-model="selectedStatus" :items="statusOptions" label="Filter by Status" dense hide-details
          class="filter-select" @change="$forceUpdate()" solo-inverted></v-select>
      </v-toolbar>

      <!-- Task List -->
      <v-list v-if="taskList.length > 0">
        <!-- Iterating over tasks to display them -->
        <v-list-item v-for="(task, index) in taskList" :key="index" class="todo-task" @click="selectTask(index)">
          <!-- Content of each task -->
          <v-list-item-content>
            <!-- Task name -->
            <v-list-item-title class="task-name"><b>{{ task.name }}</b></v-list-item-title>
            <!-- Task status -->
            <v-list-item-subtitle class="task-info">
              <span class="status-label">Status:</span>
              <!-- Chip indicating task status -->
              <v-chip :color="getStatusColor(task.status)" :class="getChipShapeClass(task.status)" text class="status-chip">{{ task.status }}</v-chip>
            </v-list-item-subtitle>
            <!-- Created date of the task -->
            <v-list-item-subtitle class="task-info custom-created-at">
              <v-icon small>mdi-calendar-clock</v-icon>
              <span>Created:</span>
              <span class="created-date">{{ getIST(task.createdAt) }}</span>
            </v-list-item-subtitle>
            <!-- Updated date of the task (if available) -->
            <v-list-item-subtitle v-if="task.updatedAt" class="task-info custom-updated-at">
              <v-icon small>mdi-history</v-icon>
              <span>Updated:</span>
              <span class="updated-date">{{ getIST(task.updatedAt) }}</span>
            </v-list-item-subtitle>
            <!-- Due date of the task (if available) -->
            <v-list-item-subtitle v-if="task.dueDate" class="task-info custom-due-date">
              <v-icon small>mdi-clock-alert</v-icon>
              <span>Due:</span>
              <span class="due-date">{{ task.dueDate }}</span>
            </v-list-item-subtitle>
          </v-list-item-content>
          <!-- Action buttons for each task (Edit and Delete) -->
          <v-list-item-action>
            <v-btn icon class="edit-btn" @click="editTask(index, task.id)">
              <v-icon>mdi-account-edit</v-icon> <!-- Edit icon -->
            </v-btn>
            <v-btn icon class="delete-btn" @click="deleteTask(index, task.id)">
              <v-icon>mdi-trash-can</v-icon> <!-- Delete icon -->
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <!-- Message when no tasks available -->
      <v-alert v-else>
        <transition name="fade">
          <div style="display: flex; align-items: center;">
            <span>No tasks available</span>
            <v-icon style="margin-left: 8px;">mdi-emoticon-sad-outline</v-icon>
          </div>
        </transition>
      </v-alert>

      <!-- Add/Edit Task Dialog -->
      <v-dialog v-model="showAddDialog" max-width="500">
        <v-card>
          <v-card-title>{{ editedTaskIndex !== null ? 'Edit Task' : 'Add New Task' }}</v-card-title>
          <v-card-text>
            <!-- Input fields for task name, status, and due date -->
            <v-text-field v-model="newTask.name" label="Task Name" required></v-text-field>
            <v-select v-model="newTask.status" :items="['Todo', 'In Progress', 'Completed']" label="Status"
              required></v-select>
            <!-- Date picker for selecting due date -->
            <v-menu v-model="menu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition"
              offset-y min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="newTask.dueDate" label="Due Date" prepend-icon="mdi-calendar" readonly
                  v-bind="attrs" v-on="on" required></v-text-field>
              </template>
              <v-date-picker v-model="newTask.dueDate" @input="menu = false" required></v-date-picker>
            </v-menu>
          </v-card-text>
          <!-- Buttons to save or cancel the task -->
          <v-card-actions>
            <v-btn color="success" @click="saveTask">{{ editedTaskIndex !== null ? 'Save' : 'Add' }}</v-btn>
            <v-btn @click="cancelEdit">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>

    <!-- Snackbar for Task Added -->
    <v-snackbar v-model="snackbar" :timeout="timeout" :color="snackbarColor">
      {{ snackbarMessage }}
      <v-btn color="white" text @click="setSnackbar(false)">
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
// Importing necessary functions and objects from Vuex and Firebase
import { mapState, mapMutations } from 'vuex';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query } from 'firebase/firestore/lite';
import { db } from '../main';

export default {
  // Data properties
  data() {
    return {
      menu: false,
      selectedTaskIndex: null // to keep track of selected task
    };
  },
  // Computed properties
  computed: {
    ...mapState([
      'tasks',
      'newTask',
      'editedTaskIndex',
      'showAddDialog',
      'snackbar',
      'snackbarColor',    
      'snackbarMessage',
      'timeout',
      'filteredTasks'
    ]),
    selectedStatus: {
      // Getter for selectedStatus
      get() {
        return this.$store.state.selectedStatus;
      },
      // Setter for selectedStatus
      set(value) {
        this.setSelectedStatus(value);
      }
    },
    searchQuery: {
      // Getter for searchQuery
      get() {
        return this.$store.state.searchQuery;
      },
      // Setter for searchQuery
      set(value) {
        this.setSearchQuery(value);
      }
    },
    // Computed property to filter tasks based on status and search query
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
    // Computed property to get unique status options from tasks
    statusOptions() {
      return [...new Set(this.tasks.map(task => task.status))];
    }
  },
  // Methods
  methods: {
    ...mapMutations([
      'setTasks',
      'setNewTask',
      'setEditedTaskIndex',
      'setShowAddDialog',
      'setSelectedStatus',
      'setSnackbar',
      'setSnackbarColor',
      'setSnackbarMessage',
      'setTimeout',
      'setSearchQuery',
      'setFilteredTasks'
    ]),
    // Method to add a new task
    async addTask() {
      try {
        await addDoc(collection(db, 'tasks'), {
          name: this.newTask.name,
          status: this.newTask.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: this.newTask.dueDate,
        });

        // Reset new task, update task list, show success message, and close dialog
        this.resetNewTask();
        this.getDatas();
        this.showAddToast();
        this.setShowAddDialog(false);
      } catch (error) {
        console.error('Error adding task: ', error);
      }
    },
    // Method to delete a task
    async deleteTask(index, id) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        this.tasks.splice(index, 1);
        this.showDeleteToast();
      } catch (error) {
        console.error('Error deleting task: ', error);
      }
    },
    // Method to edit a task
    async editTask(index, id) {
      this.setEditedTaskIndex(index);
      this.setNewTask({
        name: this.tasks[index].name,
        status: this.tasks[index].status,
        id: id,
        dueDate: this.tasks[index].dueDate,
      });
      this.setShowAddDialog(true);
      this.getDatas();
    },
    // Method to save a task (either add or update)
    async saveTask() {
      if (this.editedTaskIndex !== null) {
        const taskRef = doc(db, 'tasks', this.newTask.id);
        const existingTask = this.tasks.find(task => task.id === this.newTask.id);

        // Check if there are any changes to the task
        if (
          existingTask.name !== this.newTask.name ||
          existingTask.status !== this.newTask.status ||
          existingTask.dueDate !== this.newTask.dueDate
        ) {
          // Update the task fields
          await updateDoc(taskRef, {
            name: this.newTask.name,
            status: this.newTask.status,
            updatedAt: new Date().toISOString(), // Update with current date and time
            dueDate: this.newTask.dueDate,
          });

          // Update the task in the local state
          const updatedTaskIndex = this.tasks.findIndex(task => task.id === this.newTask.id);
          if (updatedTaskIndex !== -1) {
            this.tasks[updatedTaskIndex].name = this.newTask.name;
            this.tasks[updatedTaskIndex].status = this.newTask.status;
            this.tasks[updatedTaskIndex].updatedAt = new Date().toISOString();
            this.tasks[updatedTaskIndex].dueDate = this.newTask.dueDate;
          }

          // Show the edit toast
          this.showEditToast();
        }

        this.resetNewTask();
        this.setEditedTaskIndex(null);
        this.setShowAddDialog(false);
      } else {
        this.addTask();
      }
    },
    // Method to show a toast message for adding a task
    showAddToast() {
      this.setSnackbarColor('success');
      this.setSnackbarMessage('Task added successfully!');
      this.setSnackbar(true);
    },
    // Method to show a toast message for deleting a task
    showDeleteToast() {
      this.setSnackbarColor('error');
      this.setSnackbarMessage('Task deleted successfully!');
      this.setSnackbar(true);
    },
    // Method to show a toast message for editing a task
    showEditToast() {
      this.setSnackbarColor('warning');
      this.setSnackbarMessage('Task edited successfully!');
      this.setSnackbar(true);
    },
    // Method to cancel editing a task
    cancelEdit() {
      this.resetNewTask();
      this.setEditedTaskIndex(null);
      this.setShowAddDialog(false);
    },
    // Method to reset newTask object
    resetNewTask() {
      this.setNewTask({ name: '', status: '', dueDate: '' });
    },
    // Method to fetch tasks from Firestore
    async getDatas() {
      try {
        const taskdata = collection(db, 'tasks');
        const q = query(taskdata, orderBy('createdAt', 'desc'));
        const tasksSnapshot = await getDocs(q);
        const taskList = tasksSnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });
        this.setTasks(taskList);
      } catch (error) {
        console.error('Error fetching tasks: ', error);
      }
    },
    // Method to convert timestamp to IST (Indian Standard Time)
    getIST(timestamp) {
      const date = new Date(timestamp);
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };
      return date.toLocaleString('en-IN', options);
    },
    // Method to select a task
    selectTask(index) {
      this.selectedTaskIndex = index;
    },
    // Method to get chip color based on task status
    getStatusColor(status) {
      switch (status) {
        case 'Todo':
          return 'red';
        case 'In Progress':
          return 'orange';
        case 'Completed':
          return 'green';
        default:
          return '';
      }
    },
    // Method to get chip shape class based on task status
    getChipShapeClass(status) {
      return status === 'Completed' ? 'rounded-pill' : '';
    }
  },
  // Mounted hook to fetch tasks when component is mounted
  mounted() {
    this.getDatas();
  }
};
</script>

<style scoped>
  /* Edit button style */
  .edit-btn {
    color: #1976d2; /* Blue color */
  }

  /* Delete button style */
  .delete-btn {
    color: #f44336; /* Red color */
  }

  /* Hover effect for buttons */
  .edit-btn:hover,
  .delete-btn:hover {
    opacity: 0.8;
  }

  .todo-task {
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
    padding: 10px;
    transition: background-color 0.3s ease;
  }

  .todo-task:hover {
    background-color: #f0f0f0;
  }

  .status-label {
    font-size: smaller;
    margin-right: 8px;
  }

  .status-chip {
    font-size: smaller;
  }

  .created-at,
  .updated-at,
  .due-date {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
  }
</style>
