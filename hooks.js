var hooks = require('hooks');
var shortid = require('shortid32');
var uscore = require('underscore');

var LIST_AUTH_ROLES = "Authorization Roles > Authorization Roles collection > List roles";
var VIEW_AUTH_ROLE = "Authorization Roles > Authorization Role instance > View role";
var responseStash = {};

hooks.before(LIST_AUTH_ROLES, function (transaction) {
  // remove the optional query params
  var url = transaction.fullPath;
  if(transaction.fullPath.indexOf('?') > -1) {
    transaction.fullPath = url.substr(0, url.indexOf('?'));
  } 
});

hooks.after(LIST_AUTH_ROLES, function (transaction) {
  // saving HTTP response to the stash
  responseStash[LIST_AUTH_ROLES] = transaction.real.body;
});

hooks.before(VIEW_AUTH_ROLE, function (transaction) {
  // reusing data from previous response here
  var authRoleId = uscore.sample(uscore.pluck(JSON.parse(responseStash[LIST_AUTH_ROLES])['results'], 'id'));
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('file_editor', authRoleId);
});

var VIEW_CURRENT_USER = "Current User > Current User instance > View current user";
var g_currentUserId = null;

hooks.after(VIEW_CURRENT_USER, function (transaction) {
  // saving HTTP response to the stash
  responseStash[VIEW_CURRENT_USER] = transaction.real.body;
  // set global id for downstream tests
  g_currentUserId = JSON.parse(responseStash[VIEW_CURRENT_USER])['id'];
});

var LIST_USERS = "Users > Users collection > List users";
var VIEW_USER = "Users > User instance > View user";
var responseStash = {};
var g_userId = null;

hooks.before(LIST_USERS, function (transaction) {;
  // remove the optional query params
  var url = transaction.fullPath;
  if(transaction.fullPath.indexOf('?') > -1) {
    transaction.fullPath = url.substr(0, url.indexOf('?'));
  } 
});

hooks.after(LIST_USERS, function (transaction) {
  // saving HTTP response to the stash
  responseStash[LIST_USERS] = transaction.real.body;
});

hooks.before(VIEW_USER, function (transaction) {
  // reusing data from previous response here
  var userId = uscore.sample(uscore.without(uscore.pluck(JSON.parse(responseStash[LIST_USERS])['results'], 'id'), g_currentUserId));
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', userId);
  // set global id for downstream tests
  g_userId = userId;
});

var CREATE_PROJECT = "Projects > Projects collection > Create project";
var VIEW_PROJECT = "Projects > Project instance > View project";
var UPDATE_PROJECT = "Projects > Project instance > Update project";
var DELETE_PROJECT = "Projects > Project instance > Delete project";
var responseStash = {};
var g_projectId = null;

hooks.before(CREATE_PROJECT, function (transaction) {
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['name'] = requestBody['name'].concat(' - ').concat(shortid.generate());
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.after(CREATE_PROJECT, function (transaction) {
  // saving HTTP response to the stash
  responseStash[CREATE_PROJECT] = transaction.real.body;
});

hooks.before(VIEW_PROJECT, function (transaction) {
  // reusing data from previous response here
  var projectId = JSON.parse(responseStash[CREATE_PROJECT])['id'];
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', projectId);
  // set global id for downstream tests
  g_projectId = projectId;
});

hooks.before(UPDATE_PROJECT, function (transaction) {
  // reusing data from previous response here
  var projectId = JSON.parse(responseStash[CREATE_PROJECT])['id'];
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['name'] = requestBody['name'].concat(' - ').concat(shortid.generate()).concat(' - UPDATE');
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', projectId);
});

// We will need to use the node JSON rest client to standup a project that we can teardown so
// we do not impact downstream tests by deleting the project id... We will need to do this for all
// API groups so they can be run self-contained...
// hooks.before(DELETE_PROJECT, function (transaction) {
//   // reusing data from previous response here
//   var projectId = JSON.parse(responseStash[CREATE_PROJECT])['id'];
//   // replacing id in URL with stashed id from previous response
//   var url = transaction.fullPath;
//   transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', projectId);
// });

var LIST_PROJECT_PERMISSIONS = "Project Permissions > Project Permissions collection > List project permissions";
var GRANT_PROJECT_PERMISSION = "Project Permissions > Project Permission instance > Grant project permission";
var VIEW_PROJECT_PERMISSION = "Project Permissions > Project Permission instance > View project permission";
var REVOKE_PROJECT_PERMISSION = "Project Permissions > Project Permission instance > Revoke project permission";

hooks.before(LIST_PROJECT_PERMISSIONS, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
});

hooks.before(GRANT_PROJECT_PERMISSION, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});

hooks.before(VIEW_PROJECT_PERMISSION, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});

hooks.before(REVOKE_PROJECT_PERMISSION, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});


