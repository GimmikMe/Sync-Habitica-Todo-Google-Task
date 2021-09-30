const HABITICA_CREATORID = "474a02be-aa26-451d-aa60-6f1db8347c68"
const PROJEKT_NAME = "Habitica Google Tasks"
const HABITICA_TOKEN = "";	//Insert habitica API token here
const HABITICA_ID = "";		//Insert habitica User ID here


function myFunction() {
  const habTaskURL = "https://habitica.com/api/v3/tasks/";
  const templateParams = {
    _post: {
      method: "post",
      headers: { "x-client": (HABITICA_CREATORID + "-" + PROJEKT_NAME), "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
    },
    _get: {
      contentType: "application/json",
      method: "get",
      headers: { "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
    },
    _delete: {
      method: "delete",
      headers: { "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
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

function getFirstTaskListId() {
  /**
 * Lists tasks titles and IDs. returns the 1st task list found
 */
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
 * Lists task items for a provided tasklist ID.
 * @param  {string} taskListId The tasklist ID.
 */
function listTasks(taskListId) {
  var tasks = Tasks.Tasks.list(taskListId);
  if (tasks.items) {
    for (var i = 0; i < tasks.items.length; i++) {
      var task = tasks.items[i];
      Logger.log('Task with title "%s" and ID "%s" was found.',
                 task.title, task.id);
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
