import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    tasks: [],
    newTask: {
      name: '',
      status: ''
    },
    editedTaskIndex: null,
    showAddDialog: false,
    selectedStatus: '',
    snackbar: false,
    snackbarColor: '',
    snackbarMessage: '',
    timeout: 6000, 
    searchQuery: '',
    filteredTasks: []
  },
  mutations: {
    setTasks(state, tasks) {
      state.tasks = tasks;
    },
    setNewTask(state, newTask) {
      state.newTask = newTask;
    },
    setEditedTaskIndex(state, index) {
      state.editedTaskIndex = index;
    },
    setShowAddDialog(state, value) {
      state.showAddDialog = value;
    },
    setSelectedStatus(state, status) {
      state.selectedStatus = status;
    },
    setSnackbar(state, snackbar) {
      state.snackbar = snackbar;
    },
    setSnackbarColor(state, color) {
      state.snackbarColor = color;
    },
    setSnackbarMessage(state, message) {
      state.snackbarMessage = message;
    },
    setSearchQuery(state, query) {
      state.searchQuery = query;
    },
    setFilteredTasks(state, tasks) {
      state.filteredTasks = tasks;
    }
  },
  actions: {
    
  }
});