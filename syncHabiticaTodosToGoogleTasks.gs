/* ========================================== */
/* [Users] Required script data to fill in    */
/* ========================================== */
const USER_ID = ""; //Insert habitica User ID here
const API_TOKEN = "";//Insert habitica API token here and DO NOT share this with anyone
const TASK_LIST_NAME = "Habitica"  //Preferred name for the google tasks list to be created from imported Habitica tasks
const WEB_APP_URL = "";

// PASTE NEW CODE IMMEDIATELY BELOW THIS LINE (to keep our API tokens and tasks private)//
//--------------------------------------------------------------------------------------//
const AUTHOR_ID = "474a02be-aa26-451d-aa60-6f1db8347c68";
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

  taskListId = setupGoogleTasks(TASK_LIST_NAME);
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
  //var parentTask = Tasks.Tasks.insert({ title: 'Parent' }, taskListId); //This was just creating a final task called "Parent" at the top. Commenting out solved the issue. Delete line if not needed for anything.

}

/* ========================================== */
/*         Google Tasks API functions         */
/* ========================================== */

/**
 * Sets up the google task list. Creates a new list if no list found.
 * Meant to be run once at the startup.
 * Enhance with future features.
 * @param {string} taskListTitle title of the google task list that is used for the sync with habitica
 */
function setupGoogleTasks(taskListTitle){
  var taskListId = getTaskListId(taskListTitle);
  if (taskListId == -1){  //No tasklist with this name found
    taskListId = createTaskList(taskListTitle);
  }
  return taskListId;
}

/**
 * Lists task lists titles and IDs. returns the 1st task list found
 */
function getFirstTaskListId() {
{
  var taskLists = Tasks.Tasklists.list();
  if (taskLists.items) {
    for (var i = 0; i < taskLists.items.length; i++) {
      var taskList = taskLists.items[i];
      Logger.log('Task list with title "%s" and ID "%s" was found.',  //for debugging
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
  var taskListId = setupGoogleTasks("Habitica") //for testing
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
 * Returns ID of the task list
 * @param {string} title The title of the new tasklist
 */
function createTaskList(title) {
//var title = 'Habitica' //for testing
var newList = {'title': title}
var taskList = Tasks.Tasklists.insert(newList);
return taskList.id;
}

/**
 * Gets the ID of a task list by name
 * returns ID if task list found
 * returns -1 if task list does not exist
 * @param {string} title The title of the tasklist
 */
function getTaskListId(title) {
  var taskListId = -1;
  var taskLists = Tasks.Tasklists.list();
  if (taskLists.items) {
    for (var i = 0; i < taskLists.items.length; i++) {
      var taskList = taskLists.items[i];
      if (taskList.title == title) {
        taskListId = taskList.id;
      }
      Logger.log('Task list with title "%s" and ID "%s" was found.',  //for debugging
                 taskList.title, taskList.id);
    }
  } else {
    Logger.log('No task lists found.');
  }
  return taskListId;
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