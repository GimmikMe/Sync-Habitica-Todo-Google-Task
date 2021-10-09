/* ========================================== */
/* [Users] Required script data to fill in    */
/* ========================================== */
const USER_ID = ""; //Insert habitica User ID here
const API_TOKEN = "";//Insert habitica API token here and DO NOT share this with anyone
const WEB_APP_URL = "";

// PASTE NEW CODE IMMEDIATELY BELOW THIS LINE (to keep our API tokens and tasks private)//
//--------------------------------------------------------------------------//
const AUTHOR_ID = ("474a02be-aa26-451d-aa60-6f1db8347c68","59ae9025-f19f-4c05-8b08-0e99167fb118"); //should we add 2 IDs? No idea how this works...
const SCRIPT_NAME = "Habitica Google Tasks";

/* ========================================== */
/*               Main Functions               */
/* ========================================== */

function habiticaGoogleTasks() {
  const habTaskURL = "https://habitica.com/api/v3/tasks/";
  const templateParams = {    //X-Client header
    _post: {
      method: "post",
      headers: { "x-client": (AUTHOR_ID + "-" + SCRIPT_NAME), "x-api-user": USER_ID, "x-api-key": API_TOKEN },
    },
    _get: {
      contentType: "application/json",
      method: "get",
      headers: { "x-api-user": USER_ID, "x-api-key": API_TOKEN },
    },
    _delete: {
      method: "delete",
      headers: { "x-api-user": USER_ID, "x-api-key": API_TOKEN },
    },
  };
  console.log(templateParams._post.headers["x-client"]);

  var taskListId = getFirstTaskListId();
  listTasks(taskListId);
  
  const habTodos = fetchExistingTodos(habTaskURL, templateParams);
  console.log(habTodos.data);

  for (i = 0; i < habTodos.data.length; i++){
    var parent = addGoogleTask(taskListId, 
      habTodos.data[i].text, 
      habTodos.data[i].notes + "\n" + habTodos.data[i].id
    );

    console.log("parent:" +
                 parent);


    if (habTodos.data[i].checklist.length != 0){
      var previous = "";
      for (k = 0; k < habTodos.data[i].checklist.length; k++){
        previous = addGoogleTask(taskListId,
          habTodos.data[i].checklist[k].text,
          "",
          parent,
          previous
        );
        console.log('Current sub task id is: ',
                 previous);
      }
    }
  }

  listTasks(taskListId);
  var parentTask = Tasks.Tasks.insert({ title: 'Parent' }, taskListId);
  
}

/* ========================================== */
/*         Google Tasks API functions         */
/* ========================================== */

/**
 * Lists task lists titles and IDs. returns the 1st task list found
 */
function getFirstTaskListId() {
{ 
  var taskLists = Tasks.Tasklists.list();
  if (taskLists.items) {
    for (var i = 0; i < taskLists.items.length; i++) {
      var taskList = taskLists.items[i];
      Logger.log('Task list with title "%s" and ID "%s" was found.',
                 taskList.title, taskList.id);
    }
  } else {
    Logger.log('No task lists found.');
  }
}
return taskLists.items[0].id
}

/**
 * Lists task items (max 100) for a provided tasklist ID.
 * @param  {string} taskListId The tasklist ID.
 */
function listTasks(taskListId) {
  var taskListId = getFirstTaskListId(); //for testing
  var optionalArgs = {maxResults: 100};  //increases the default nr of tasks retrieved from 20 to 100 (max allowed)
  var tasks = Tasks.Tasks.list(taskListId,optionalArgs);
  if (tasks.items) {
    var listSize = tasks.items.length;
    Logger.log('List size: ' + listSize)
    for (var i = 0; i < listSize; i++) {
      var task = tasks.items[i];
      Logger.log('Title: "%s" - ID "%s"',
                 task.title, task.id);
    }
  } else {
    Logger.log('No tasks found.');
  }
}

/**
 * Deletes all tasks from a tasklist, but keeps the tasklist.
 * @param  {string} taskListId The tasklist ID.
 */
function clearAllTasks(taskListId) {
  var taskListId = getFirstTaskListId() //for testing
  var optionalArgs = {maxResults: 100}; //increases the default nr of tasks retrieved from 20 to 100 (max allowed)
  var tasks = Tasks.Tasks.list(taskListId,optionalArgs);
  if (tasks.items) {
    var listSize = tasks.items.length;
    Logger.log('List size: ' + listSize)
    for (var i = 0; i < listSize; i++) {
      var task = tasks.items[i];
      Tasks.Tasks.remove(taskListId, task.id);
    }
  } else {
    Logger.log('No tasks found.');
  }
}

/**
 * Adds a task to a Google tasklist.
 * @param {string} taskListId The tasklist to add to.
 * @param {string} title The title of the task.
 * @param {string} note The note of the task. Default = ""
 * @param {string} parentId The ID of the parent of the task. Default = ""
 * @param {string} previousId The ID of the previous sub task. Default = ""
 */
function addGoogleTask(taskListId, title, note = "", parentId = "", previousId = "") {
  var task = {
    title: title,
    notes: note
  };
  if (parentId != ""){
    if (previousId != ""){
      task = Tasks.Tasks.insert(task, taskListId,{ parent: parentId, previous: previousId});
    } else {
      task = Tasks.Tasks.insert(task, taskListId,{ parent: parentId});
    }
  } else {
    task = Tasks.Tasks.insert(task, taskListId);
  }
  
  Logger.log('Task with ID "%s" was created.', task.id);
  return task.id;
}

/**
 * Sets the completed status of a given task.
 * @param {String} taskListId The ID of the task list.
 * @param {String} taskId The ID of the task.
 * @param {Boolean} completed True if the task should be marked as complete, false otherwise.
 * NOT IN USE YET
 */
function setCompleted(taskListId, taskId, completed) {
  var task = Tasks.newTask();
  if (completed) {
    task.setStatus('completed');
  } else {
    task.setStatus('needsAction');
    task.setCompleted(null);
  }
  Tasks.Tasks.patch(task, taskListId, taskId);
}

/**
 * Creates a new tasklist with a given title
 * @param {string} title The title of the new tasklist
 */
function createTaskList(title) {
var title = 'Habitica' //for testing
var newList = {'title': title}
Tasks.Tasklists.insert(newList)
}

/* ========================================== */
/*         Habitica API Functions             */
/* ========================================== */

/**
 * Fetches existing Todos from Habitica.
 * @param {string} habTaskURL The URL of the Habitica tasks.
 * @param {const} templateParams The template parameters for the Habitica API.
 */
function fetchExistingTodos(habTaskURL, templateParams) {
  const response = UrlFetchApp.fetch(
    habTaskURL + "user?type=todos",
    templateParams._get
  );
  return JSON.parse(response.getContentText());
}

/**
 * Checks or unchecks a task in Habitica.
 * @param {string} habiticaTaskId The URL of the Habitica tasks.
 * @param {string} direction If set to 'up' means checked or + sign in habit.
 */
function api_scoreTask(habiticaTaskId, direction) {
  const params = {
    "method" : "post",
    "headers" : HEADERS,
    "muteHttpExceptions" : true,
  }
  
  var url = "https://habitica.com/api/v3/tasks/";
  if ( (habiticaTaskId != "") && (direction != "") ) {
    url += aliasOrId + "/score/" + direction;
  }

  return UrlFetchApp.fetch(url, params);
}