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
    this.dueDateStr = this.getDueDateStr(month, year);
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
    $(document).on('click', '.list_view_item', this.handleCurrentListChange.bind(this));
  },
  createTemplates: function() {
    this.mainListTemplate = Handlebars.compile($('#main_list_template').html());
    this.navListsTemplate = Handlebars.compile($('#nav_lists_template').html());
  },
  updatePage: function() {
    this.sortToDos();
    this.displayNavLists();
    this.highlightCurrentView();
    this.displayMainList();
  },
  displayMainList: function() {
    var view = this.state.currentListView;

    if (view.match(/\d{2}\/\d{2}completed/)) {
      view = view.slice(0, 5);
    }

    var toDoList = this.state.toDos[view];
    var toDoListHTML = this.mainListTemplate({ toDos: toDoList });
    var title = this.state.currentListView;

    if (title === 'all') {
      title = "All Todos";
    } else if (title === 'completed') {
      title = 'Completed';
    } else if (title.match(/\d{2}\/\d{2}completed/)) {
      title = title.slice(0, 5);
    }

    $('#main_list_title').text(title);
    $('#main_list_count').text(this.state.toDos[view].length);
    $('main ul').remove();
    $('main').append(toDoListHTML);
  },
  displayNavLists: function() {
    $('#all ul').remove();
    $('#completed ul').remove();
    var listNames = Object.keys(this.state.toDos).filter(function(listName) {
      return !(['all', 'completed'].includes(listName));
    });
    var self = this;

    var completedListNames = listNames.filter(function(listName) {
      return self.areAllComplete(self.state.toDos[listName]);
    });

    // ADD FUNCTION FOR THIS
    var allListObjects = listNames.map(function(name) {
      return { listName: name,
               listLength: self.state.toDos[name].length,
               completed: self.state.toDos[name].completed };
    });

    var completedListObjects = completedListNames.map(function(name) {
      return { listName: name,
               listLength: self.state.toDos[name].length,
               completed: "completed" };
    });

    $('#all_count').text(listNames.length);
    $('#completed_count').text(completedListNames.length);

    $('#all').append(this.navListsTemplate({ lists: allListObjects }));
    $('#completed').append(this.navListsTemplate({ lists: completedListObjects }));
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
    $('#modal input').val('');
    $('#modal select').val('');
    $('#modal textarea').val('');
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
  handleCurrentListChange: function(e) {
    var newListView = $(e.target).closest('.list_view_item').attr('id');
    this.state.currentListView = newListView;

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
  addToDo: function(title, day, month, year, description) {
    var newToDo = makeToDo(title, day, month, year, description);

    this.state.toDos.all.push(newToDo);
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
    this.clearSecondaryLists();
    this.state.toDos.all.forEach(this.distributeToDo.bind(this));
    this.saveState();
  },
  clearSecondaryLists: function() {
    var allTodos = this.state.toDos['all'];
    this.state.toDos = {
      all: allTodos,
      completed: [],
    }
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
  markComplete: function(e) {
    e.preventDefault();
    var toDoID;

    if ($(e.target).attr('class') === 'checkbox') {
      toDoID = $(e.target).closest('li').data('id');
    } else if ($(e.target).attr('class') === 'mark_complete_link') {
      toDoID = $(e.target).closest('div#modal').data('edit-id');
    }

    this.getToDo(toDoID).completed = 'completed';
    this.updatePage();
    this.exitModal();
  },
  markIncomplete: function(e) {
    e.preventDefault();
    var toDoID = $(e.target).closest('li').data('id');

    this.getToDo(toDoID).completed = '';
    this.updatePage();
  },
  areAllComplete: function(list) {
    return list.every(function(toDo) {
      return toDo.completed === 'completed';
    });
  },
  highlightCurrentView: function() {
    $('.highlighted').removeClass('highlighted');
    var query = "#" + this.state.currentListView.replace("/", "\\/");
    var elem = $(query)[0];

    if (elem.tagName === 'LI') {
      $(elem).addClass('highlighted');
    } else {
      $(elem).find('h1').addClass('highlighted');
    }
  }
};

$(application.init.bind(application));
