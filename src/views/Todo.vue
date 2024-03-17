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

        <v-btn color="success" @click="setShowAddDialog(true)">Add Task</v-btn>
      </v-toolbar>

      <!-- Filter section -->
      <v-toolbar color="grey lighten-1" dark>
        <v-select v-model="selectedStatus" :items="statusOptions" label="Filter by Status" dense hide-details
          class="filter-select" @change="$forceUpdate()" solo-inverted></v-select>

      </v-toolbar>

      <!-- Task List -->
      <v-list v-if="taskList.length > 0">
        <v-list-item v-for="(task, index) in taskList" :key="index" class="todo-task" @click="selectTask(index)">
          <v-list-item-content>
            <v-list-item-title class="task-name"><b>{{ task.name }}</b></v-list-item-title>

            <v-list-item-subtitle class="task-info">
              <span class="status-label">Status:</span>
              <v-chip :color="getStatusColor(task.status)" text class="status-chip">{{ task.status }}</v-chip>
            </v-list-item-subtitle>


            <v-list-item-subtitle class="task-info custom-created-at">
              <v-icon small>mdi-calendar-clock</v-icon>
              <span>Created:</span>
              <span class="created-date">{{ getIST(task.createdAt) }}</span>
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="task.updatedAt" class="task-info custom-updated-at">
              <v-icon small>mdi-history</v-icon>
              <span>Updated:</span>
              <span class="updated-date">{{ getIST(task.updatedAt) }}</span>
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="task.dueDate" class="task-info custom-due-date">
              <v-icon small>mdi-clock-alert</v-icon>
              <span>Due:</span>
              <span class="due-date">{{ task.dueDate }}</span>
            </v-list-item-subtitle>



          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="editTask(index, task.id)">
              <v-icon color="primary">mdi-account-edit</v-icon> <!-- Use mdi-account-edit icon -->
            </v-btn>
            <v-btn icon @click="deleteTask(index, task.id)">
              <v-icon color="error">mdi-trash-can</v-icon> <!-- Use mdi-trash-can icon -->
            </v-btn>
          </v-list-item-action>

        </v-list-item>
      </v-list>
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
            <v-text-field v-model="newTask.name" label="Task Name" required></v-text-field>
            <v-select v-model="newTask.status" :items="['Todo', 'In Progress', 'Completed']" label="Status"
              required></v-select>
            <v-menu v-model="menu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition"
              offset-y min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="newTask.dueDate" label="Due Date" prepend-icon="mdi-calendar" readonly
                  v-bind="attrs" v-on="on" required></v-text-field>
              </template>
              <v-date-picker v-model="newTask.dueDate" @input="menu = false" required></v-date-picker>
            </v-menu>
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
      {{ snackbarMessage }}
      <v-btn color="white" text @click="setSnackbar(false)">
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc ,orderBy,query} from 'firebase/firestore/lite';
import { db } from '../main';

export default {
  data() {
    return {
      menu: false,
      selectedTaskIndex: null // to keep track of selected task
    };
  },
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
      get() {
        return this.$store.state.selectedStatus;
      },
      set(value) {
        this.setSelectedStatus(value);
      }
    },
    searchQuery: {
      get() {
        return this.$store.state.searchQuery;
      },
      set(value) {
        this.setSearchQuery(value);
      }
    },
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
    async addTask() {
      try {
        await addDoc(collection(db, 'tasks'), {
          name: this.newTask.name,
          status: this.newTask.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: this.newTask.dueDate,
        });

        this.resetNewTask();
        this.getDatas();
        this.showAddToast();
        this.setShowAddDialog(false);
      } catch (error) {
        console.error('Error adding task: ', error);
      }
    },
    async deleteTask(index, id) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        this.tasks.splice(index, 1);
        this.showDeleteToast();
      } catch (error) {
        console.error('Error deleting task: ', error);
      }
    },
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

    showAddToast() {
      this.setSnackbarColor('success');
      this.setSnackbarMessage('Task added successfully!');
      this.setSnackbar(true);
    },
    showDeleteToast() {
      this.setSnackbarColor('error');
      this.setSnackbarMessage('Task deleted successfully!');
      this.setSnackbar(true);
    },
    showEditToast() {
      this.setSnackbarColor('warning');
      this.setSnackbarMessage('Task edited successfully!');
      this.setSnackbar(true);
    },
    cancelEdit() {
      this.resetNewTask();
      this.setEditedTaskIndex(null);
      this.setShowAddDialog(false);
    },
    resetNewTask() {
      this.setNewTask({ name: '', status: '', dueDate: '' });
    },
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

    selectTask(index) {
      this.selectedTaskIndex = index;
    },
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
    getChipShapeClass(status) {
      return status === 'Completed' ? 'rounded-pill' : ''; 
    }
  },
  mounted() {
    this.getDatas();
  }
};
</script>

<style scoped>
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
