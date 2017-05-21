// *****************************************************************************
// Template for toDo object according to OLOO approach and auxiliary functions
// *****************************************************************************
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
  var newToDo = Object.create(ToDo).init(title, day, month, year, description, id);
  return newToDo;
}

// *****************************************************************************
// Application object
// *****************************************************************************
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
    $(document).on('click', '.checkbox', this.handleMarkAction.bind(this));
    $(document).on('click', '.main_list_item', this.handleMarkAction.bind(this));
    $(document).on('click', '.list_view_item', this.handleCurrentListChange.bind(this));
  },
  createTemplates: function() {
    this.mainListTemplate = Handlebars.compile($('#main_list_template').html());
    this.navListsTemplate = Handlebars.compile($('#nav_lists_template').html());
  },
  updatePage: function() {
    this.resetModal();
    this.sortToDos();
    this.displayNavLists();
    this.displayMainList();
    this.highlightCurrentView();
  },
  displayMainList: function() {
    var view = this.state.currentListView;

    if (view.match(/\d{2}\/\d{2}completed/)) {
      view = view.slice(0, 5);
    } else if (view.match(/No Due Datecompleted/)) {
      view = view.slice(0, 11);
    }

    var toDoList = this.state.toDos[view];
    var toDoListHTML = this.mainListTemplate({ toDos: toDoList });
    var title = this.state.currentListView;
    console.log(title);
    title = this.getPrettifiedTitle(title);
    console.log(title);
    $('#main_list_title').text(title);
    $('#main_list_count').text(this.getListCount(view));
    $('main ul').remove();
    $('main').append(toDoListHTML);
  },
  displayNavLists: function() {
    $('#all ul').remove();
    $('#completed ul').remove();
    var self = this;

    var listNames = this.getListNames();
    var completedListNames = this.getCompletedListNames();

    var allListObject = this.getTemplateListObject(listNames, false);
    var completedListObject = this.getTemplateListObject(completedListNames, true);

    $('#all_count').text(listNames.length);
    $('#completed_count').text(completedListNames.length);

    $('#all').append(this.navListsTemplate(allListObject));
    $('#completed').append(this.navListsTemplate(completedListObject));
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
  getListNames: function() {
    return Object.keys(this.state.toDos).filter(function(listName) {
      return !(['all', 'completed'].includes(listName));
    });
  },
  getCompletedListNames: function() {
    var self = this;

    return this.getListNames().filter(function(listName) {
      return self.areAllComplete(self.state.toDos[listName]);
    });
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

    this.state.currentListView = 'all';
    this.updatePage();
    this.exitModal();
  },
  handleCurrentListChange: function(e) {
    var newListView = $(e.target).closest('.list_view_item').attr('id');
    this.state.currentListView = newListView;

    this.updatePage();
  },
  handleMarkAction: function(e) {
    if (!$(e.target).hasClass('todo_list_link')) {
      var checked = $(e.target).closest('li').hasClass('completed');

      if (checked) {
        this.markIncomplete(e);
      } else {
        this.markComplete(e);
      }
    }
  },
  addToDo: function(title, day, month, year, description) {
    var newToDo = makeToDo(title, day, month, year, description);

    this.state.toDos.all.push(newToDo);
    this.saveState();
    this.updatePage();
  },
  editToDo: function(title, day, month, year, description, id) {
    var completed = this.getToDo(id);
    completed.title = title;
    completed.day = day;
    completed.month = month;
    completed.year = year;
    completed.description = description;
    completed.id = id;
    completed.dueDateStr = ToDo.getDueDateStr(month, year);
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
    this.state.toDos.all = this.sortToDoList(this.state.toDos.all);
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

    if (lists[toDo.dueDateStr]) {
      toDo.completed === 'completed' ? lists[toDo.dueDateStr].push(toDo) : lists[toDo.dueDateStr].unshift(toDo);
    } else {
      (lists[toDo.dueDateStr] = [toDo]);
    }
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

    if ($('#modal').attr('data-edit-id') === '-1') {
      alert('Cannot mark as complete as item has not been created yet!');
    } else {
      if ($(e.target).attr('class') === 'checkbox') {
        toDoID = $(e.target).closest('li').data('id');
      } else if ($(e.target).attr('class') === 'mark_complete_link') {
        toDoID = $(e.target).closest('div#modal').data('edit-id');
      } else if ($(e.target).closest('div').hasClass('main_list_item')) {
        toDoID = $(e.target).closest('li').attr('data-id');
      }

      this.getToDo(toDoID).completed = 'completed';
      this.updatePage();
      this.exitModal();
    }
  },
  markIncomplete: function(e) {
    e.preventDefault();
    if (e.target.tagName !== 'A') {
      var toDoID = $(e.target).closest('li').data('id');

      this.getToDo(toDoID).completed = '';
      this.updatePage();
    }
  },
  areAllComplete: function(list) {
    return list.every(function(toDo) {
      return toDo.completed === 'completed';
    });
  },
  getListCount: function(view) {
    var list = this.state.toDos[view];

    if(list) {
      return list.length;
    } else {
      return 0;
    }
  },
  highlightCurrentView: function() {
    $('.highlighted').removeClass('highlighted');
    var view = this.state.currentListView;
    var query;

    if (view === 'No Due Date') {
      query = "[id='No Due Date']";
    } else if (view ===  'No Due Datecompleted') {
      query = "[id='No Due Datecompleted']";
    } else {
      query = "#" + view.replace("/", "\\/");
    }

    var elem = $(query)[0];

    if (elem !== undefined) {
      if (elem.tagName === 'LI') {
        $(elem).addClass('highlighted');
      } else {
        $(elem).find('h1').addClass('highlighted');
      }
    }
  },
  sortToDoList: function(list) {
    var newList = [];
    list.forEach(function(toDo) {
      toDo.completed === 'completed' ? newList.push(toDo) : newList.unshift(toDo);
    });
    return newList;
  },
  getTemplateListObject: function(listNames, completed) {
    var completed = completed ? 'completed' : '';
    var self = this;

    listNames = listNames.sort(this.sortDueDateStrs);

    var objects = listNames.map(function(name) {
      return { listName: name,
               listLength: self.state.toDos[name].length,
               completed: completed };
    });

    return { lists: objects };
  },
  getPrettifiedTitle: function(title) {
    var newTitle;

    if (title === 'all') {
      newTitle = "All Todos";
    } else if (title === 'completed') {
      newTitle = 'Completed';
    } else if (title.match(/\d{2}\/\d{2}completed/)) {
      newTitle = title.slice(0, 5);
    } else if (title.match(/No Due Datecompleted/)) {
      newTitle = title.slice(0, 11);
    }

    return newTitle || title;
  },
  sortDueDateStrs: function(a, b) {
    var aYear = a.slice(3, 5);
    var aMonth = a.slice(0, 2);
    var bYear = b.slice(3, 5);
    var bMonth = b.slice(0, 2);

    if (aYear > bYear) {
      return 1;
    } else if (aYear < bYear) {
      return -1
    } else if (aMonth > bMonth) {
      return 1;
    } else if (aMonth < bMonth) {
      return -1;
    } else {
      return 0;
    }
  },
  resetModal: function() {
    $('#modal').attr('data-edit-id', '');
  },
  resetState: function() {
    // UTILITY METHOD NOT FOR USE IN APPLICATION CODE
    this.state = {
      currentListView: 'all',
      toDos: {
        all: [],
        completed: []
      }
    };
    this.saveState();
    this.updatePage();
  }
};

$(application.init.bind(application));
