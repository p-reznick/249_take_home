// *****************************************************************************
// Application object handles displaying page and responding to user actions
// *****************************************************************************
application = {
  currentListView: 'all',
  displayListsObject: undefined,
  init: function() {
    this.displayListsObject = toDos.getDisplayLists();
    this.currentListView = this.getSavedView();
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
    $('#hamburger').on('click', this.handleHamburger.bind(this));
  },
  createTemplates: function() {
    this.mainListTemplate = Handlebars.compile($('#main_list_template').html());
    this.navListsTemplate = Handlebars.compile($('#nav_lists_template').html());
  },
  updatePage: function() {
    this.resetModal();
    this.updateDisplayListsObject();
    this.displayNavLists();
    this.displayMainList();
    this.highlightCurrentView();
  },
  updateDisplayListsObject: function() {
    this.displayListsObject = toDos.getDisplayLists();
  },
  displayMainList: function() {
    var view = this.currentListView;
    var completed = false;

    if (view.match(/\d{2}\/\d{2}completed/)) {
      view = view.slice(0, 5);
      completed = true;
    } else if (view.match(/No Due Datecompleted/)) {
      view = view.slice(0, 11);
      completed = true;
    }

    var toDoList = completed ? toDos.getCompletedOnly(this.displayListsObject[view]) :
                               this.displayListsObject[view];
    var toDoListHTML = this.mainListTemplate({ toDos: toDoList });
    var title = this.currentListView;

    title = this.getPrettifiedTitle(title);

    $('#main_list_title').text(title);
    $('#main_list_count').text(toDoList ? toDoList.length : 0);
    $('main ul').remove();
    $('main').append(toDoListHTML);
  },
  displayNavLists: function() {
    $('#all ul').remove();
    $('#completed ul').remove();
    var self = this;

    var listNames = toDos.getListNames();
    var completedListNames = toDos.getCompletedListNames();

    var allListObject = this.getTemplateListObject(listNames, false);
    var completedListObject = this.getTemplateListObject(completedListNames, true);

    $('#all_count').text(toDos.allToDos.length);
    $('#completed_count').text(toDos.getDisplayLists()['completed'].length);

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
  handleAddToDo: function(e) {
    $('#modal input').val('');
    $('#modal select').val('');
    $('#modal textarea').val('');
    this.displayModal();
  },
  handleEditToDo: function(e) {
    var toDoID = $(e.target).closest('li').data('id');
    $modal = $('#modal');
    var original = toDos.getToDo(toDoID);

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
      var newToDo = toDos.makeToDo(title, day, month, year, description);
      toDos.addToDo(newToDo);
      this.currentListView = 'all';
    } else {
      toDos.editToDo(title, day, month, year, description, editID);
    }

    this.updatePage();
    this.exitModal();
  },
  handleCurrentListChange: function(e) {
    var newListView = $(e.target).closest('.list_view_item').attr('id');
    this.currentListView = newListView;

    this.updatePage();
    this.saveView();
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
  handleHamburger: function() {
    $('nav').toggleClass('visible');
    $('main').toggleClass('minimized');
  },
  addToDo: function(title, day, month, year, description) {
    var newToDo = toDos.makeToDo(title, day, month, year, description);

    toDos.addToDo(newToDo);
    toDos.saveToDos();
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
    toDos.deleteToDo(toDoID);
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

      toDos.markComplete(toDoID);
      this.updatePage();
      this.exitModal();
    }
  },
  markIncomplete: function(e) {
    e.preventDefault();
    if (e.target.tagName !== 'A') {
      var toDoID = $(e.target).closest('li').data('id');

      toDos.markIncomplete(toDoID);
      this.updatePage();
    }
  },
  highlightCurrentView: function() {
    $('.highlighted').removeClass('highlighted');
    var view = this.currentListView;
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
  getTemplateListObject: function(listNames, completed) {
    var completed = completed ? 'completed' : '';
    var self = this;

    listNames = listNames.sort(this.sortDueDateStrs);

    var objects = listNames.map(function(name) {
      var list = toDos.getDisplayLists()[name];
      var listLength;

      listLength = completed ? toDos.getNumberCompleted(list) :
                               list.length;

      return { listName: name,
               listLength: listLength,
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
  saveView: function() {
    var view = this.currentListView;
    localStorage.setItem('249view', view);
  },
  getSavedView: function() {
    return localStorage.getItem('249view') || 'all';
  }
};

$(application.init.bind(application));
