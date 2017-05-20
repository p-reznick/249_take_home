var ToDo = {
  title: '',
  day: '',
  month: '',
  year: '',
  description: '',
  completed: '',
  dueDateStr: '',
  getDueDateStr: function(month, year) {
    if (month !== null && year !== null) {
      return (month + '/' + year);
    } else {
      return "No Due Date";
    }
  },
  init: function(title, day, month, year, description, id) {
    this.title = title;
    this.day = day;
    this.month = month;
    this.year = year;
    this.description = description;
    this.completed = '';
    dueDateStr = this.getDueDateStr(month, year);
    this.id = id;
    return this;
  }
}

function getCurrentID() {
  return parseInt(localStorage.getItem('toDoListID'), 10) || 0;
}

function incrementID() {
  var id = getCurrentID();
  localStorage.setItem('toDoListID', id + 1);
}

function makeToDo(title, day, month, year, description) {
  var id = getCurrentID();
  incrementID();
  return Object.create(ToDo).init(title, day, month, year, description, id);
}

application = {
  stateKey: "toDoApplicationKey",
  state: {
    currentListView: 'all',
    toDos: {
      all: [],
      completed: []
    }
  },
  saveState: function() {
    var stateStr = JSON.stringify(this.state);
    localStorage.setItem(this.stateKey, stateStr);
  },
  getState: function() {
    return JSON.parse(localStorage.getItem(this.stateKey));
  },
  init: function() {
    localState = this.getState();

    if (localState) {
      this.state = localState;
    }

    this.addEventListeners();
    this.createTemplates();
    this.updatePage();
  },
  addEventListeners: function() {
    $('#add_new_todo').on('click', this.handleAddToDo.bind(this));
    $(document).on('click', '.todo_list_link', this.handleEditToDo.bind(this));
    $('#modal').on('click', this.exitModal.bind(this));
    $('#modal form').on('submit', this.handleModalSubmit.bind(this));
    $(document).on('click', '.trash', this.handleToDoDeletion.bind(this));
    $(document).on('click', '.mark_complete_link', this.markComplete.bind(this));
    $(document).on('click', '.checkbox', this.handleCheckBox.bind(this));
  },
  createTemplates: function() {
    this.mainListTemplate = Handlebars.compile($('#main_list_template').html());

  },
  updatePage: function() {
    // update all lists in nav (need new template)
    // update all list count numbers
    this.displayMainList();
  },
  displayMainList: function() {
    var view = this.state.currentListView;

    var toDoList = this.state.toDos[view];
    var toDoListHTML = this.mainListTemplate({ toDos: toDoList });
    $('main ul').remove();
    $('main').append(toDoListHTML);
  },
  displayModal: function(toDoID) {
    if (toDoID) {
      $('#modal').attr('data-edit-id', toDoID);
    } else {
      $('#modal').attr('data-edit-id', '-1');
    }

    $('#modal').fadeIn();
  },
  exitModal: function(e) {
    if (e) {
      if ($(e.target).attr('id') === 'modal' ||
          (e.type === 'submit')) {
        $('#modal').fadeOut();
      }
    } else {
      $('#modal').fadeOut();
    }
  },
  handleAddToDo: function(e) {
    $('#modal').attr('data-status', 'add');
    this.displayModal();
  },
  handleEditToDo: function(e) {
    var toDoID = $(e.target).closest('li').data('id');
    $modal = $('#modal');
    var original = this.getToDo(toDoID);

    $modal.find('#title').val(original.title);
    $modal.find('#day').val(original.day);
    $modal.find('#month').val(original.month);
    $modal.find('#year').val(original.year);
    $modal.find('#description').val(original.description);

    this.displayModal(toDoID);
  },
  handleModalSubmit: function(e) {
    e.preventDefault();
    $modal = $('#modal');
    var editID = $modal.attr('data-edit-id');

    var title = $modal.find('#title').val();
    var day = $modal.find('#day').val();
    var month = $modal.find('#month').val();
    var year = $modal.find('#year').val();
    var description = $modal.find('#description').val();

    if (editID === '-1') {
      this.addToDo(title, day, month, year, description);
    } else {
      this.editToDo(title, day, month, year, description, editID);
    }

    this.exitModal();
  },
  addToDo: function(title, day, month, year, description) {
    var newToDo = makeToDo(title, day, month, year, description);

    this.state.toDos.all.push(newToDo);
    this.sortToDos();
    this.saveState();
    this.updatePage();
  },
  editToDo: function(title, day, month, year, description, id) {
    editedToDo = {
      title: title,
      day: day,
      month: month,
      year: year,
      description: description,
      dueDateStr: month + '/' + year,
      id: id,
    };
    this.setToDo(editedToDo, id);
  },
  setToDo: function(toDo, id) {
    var index;
    var lists = this.state.toDos.all;

    lists.forEach(function(toDo, idx) {
      if (toDo.id.toString() === id) {
        index = idx;
      }
    });

    lists[index] = toDo;
    this.sortToDos();
  },
  sortToDos: function() {
    this.clearDateLists();

    this.state.toDos.all.forEach(this.distributeToDo.bind(this));
    this.saveState();
    this.updatePage();
  },
  clearDateLists: function() {
    var listNames = Object.keys(this.state.toDos);
    var self = this;

    listNames.forEach(function(listName) {
      if (!['all', 'completed'].includes(listName)) {
        self.state.toDos[listName] = undefined;
      }
    });
  },
  distributeToDo: function(toDo) {
    var lists = this.state.toDos;
    if (toDo.completed) {
      lists.completed.push(toDo);
    }

    lists[toDo.dueDateStr] ? lists[toDo.dueDateStr].push(toDo) : (lists[toDo.dueDateStr] = [toDo]);
  },
  getToDo: function(id) {
    var match;

    this.state.toDos.all.forEach(function(toDo) {
      if (toDo.id.toString() === id.toString()) {
        match = toDo;
      }
    });

    return match;
  },
  handleToDoDeletion: function(e) {
    var toDoID = $(e.target).closest('li').data('id');
    this.deleteToDo(toDoID);
  },
  deleteToDo: function(id) {
    this.state.toDos.all = this.state.toDos.all.filter(function(toDo) {
      return toDo.id.toString() !== id.toString();
    });

    this.saveState();
    this.updatePage();
  },
  handleCheckBox: function(e) {
    var checked = $(e.target).closest('li').attr('class') === 'completed';
    if (checked) {
      this.markIncomplete(e);
    } else {
      this.markComplete(e);
    }
  },
  markComplete: function(e) {
    e.preventDefault();
    var toDoID = $(e.target).closest('li').data('id');

    this.getToDo(toDoID).completed = 'completed';
    this.sortToDos();
  },
  markIncomplete: function(e) {
    e.preventDefault();
    var toDoID = $(e.target).closest('li').data('id');

    this.getToDo(toDoID).completed = '';
    this.sortToDos();
  }
};

$(application.init.bind(application));
