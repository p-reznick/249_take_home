// *****************************************************************************
// todos object manages todo creation and storage
// *****************************************************************************
var toDos = {
  allToDos: [],
  init: function() {
    this.allToDos = this.getSavedToDos() || [];
  },
  ToDo: {
    title: undefined,
    day: undefined,
    month: undefined,
    year: undefined,
    description: undefined,
    completed: undefined,
    dueDateStr: undefined,
    id: undefined,
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
    },
  },
  makeToDo: function(title, day, month, year, description) {
    var id = this.getCurrentID();
    this.incrementID();
    var newToDo = Object.create(this.ToDo).init(title, day, month, year, description, id);
    return newToDo;
  },
  getCurrentID: function() {
    return parseInt(localStorage.getItem('toDoListID'), 10) || 0;
  },
  incrementID: function() {
    var id = this.getCurrentID();
    localStorage.setItem('toDoListID', id + 1);
  },
  addToDo: function(toDo) {
    this.allToDos.push(toDo);
    this.saveToDos();
  },
  getToDo: function(id) {
    var desiredToDo;

    this.allToDos.forEach(function(toDo) {
      if (toDo.id.toString() === id.toString()) {
        desiredToDo = toDo;
      }
    });

    return desiredToDo;
  },
  editToDo: function(title, day, month, year, description, id) {
    var original = this.getToDo(parseInt(id, 10));
    original.title = title;
    original.day = day;
    original.month = month;
    original.year = year;
    original.description = description;
    original.id = id;
    original.dueDateStr = this.ToDo.getDueDateStr(month, year);
    this.saveToDos();
  },
  deleteToDo: function(id) {
    var index;

    this.allToDos.forEach(function(toDo, idx) {
      if (toDo.id === id) {
        index == idx;
      }
    });

    this.allToDos.splice(index, 1);
    this.saveToDos();
  },
  markComplete(id) {
    var toDo = this.getToDo(id);
    toDo.completed = 'completed';
    this.saveToDos();
  },
  markIncomplete(id) {
    var toDo = this.getToDo(id);
    toDo.completed = '';
    this.saveToDos();
  },
  sortListByID: function(list) {
    return list.sort(function(a, b) {
      if (a.id > b.id) {
        return 1;
      } else if (a.id < b.id) {
        return -1;
      } else {
        return 0;
      }
    });
  },
  sortListByCompletion: function(list) {
    var completed = [];
    var incomplete = [];

    list.forEach(function(toDo) {
      toDo.completed === 'completed' ? completed.push(toDo) : incomplete.push(toDo);
    });

    return incomplete.concat(completed);
  },
  sortListObject(listObj) {
    var self = this;

    Object.keys(listObj).forEach(function(listName) {
      listObj[listName] = self.sortListByID(listObj[listName]);
      listObj[listName] = self.sortListByCompletion(listObj[listName]);
    });

    return listObj;
  },
  saveToDos: function() {
    var listStr = JSON.stringify(this.allToDos);
    localStorage.setItem('249AllTodos', listStr)
  },
  getSavedToDos: function() {
    return JSON.parse(localStorage.getItem('249AllTodos'));
  },
  getDisplayLists: function() {
    var listObj = {
      all: this.allToDos,
      completed: []
    }

    this.allToDos.forEach(function(toDo) {
      if (toDo.completed === 'completed') {
        listObj.completed.push(toDo);
      }

      var dueDateStr = toDo.dueDateStr;

      listObj[dueDateStr] ? listObj[dueDateStr].push(toDo) : listObj[dueDateStr] = [toDo];
    });

    return this.sortListObject(listObj);
  },
  isListCompleted: function(list) {
    return list.every(function(toDo) {
      return toDo.completed === 'completed';
    });
  },
  anyTodoCompleted: function(list) {
    return list.some(function(toDo) {
      return toDo.completed === 'completed';
    });
  },
  getListNames: function() {
    var allNames = Object.keys(this.getDisplayLists());
    return allNames.filter(function(name) {
      return !['all', 'completed'].includes(name);
    });
  },
  getCompletedListNames: function() {
    var lists = this.getDisplayLists();

    var names = this.getListNames();
    var self = this;

    return names.filter(function(name) {
      return self.anyTodoCompleted(lists[name]);
    });
  }
}

$(toDos.init.bind(toDos));
