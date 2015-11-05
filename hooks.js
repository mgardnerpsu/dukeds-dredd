var hooks = require('hooks');
var shortid = require('shortid32');
var _ = require('underscore');
var Client = require('node-rest-client').Client;
var Promise = require("node-promise").Promise;
var fs = require("fs");
var md5File = require('md5-file');

// function to create resources on fly - returns promise
function createResource(request_method, request_path, request_payload) {
  var request = new Promise();
  var client = new Client();
  var args = {
    "headers": { "Content-Type": "application/json", "Authorization": process.env.DUKEDS_API_KEY },
    "data": request_payload
  };
  var request_path = hooks.configuration.server.concat(request_path);
  client.registerMethod("apiMethod", request_path, request_method);
  client.methods.apiMethod(args, function(data, response) {
    if (!(_.contains([200, 201], response.statusCode))) {
        console.log('The create resource request failed - '.concat(response.statusCode).concat(': '));
        console.log(request_path);
        console.log(JSON.stringify(data));
        // console.log(response);
    }
    request.resolve(data);
  });
  return request;
}

// function to upload Swift file chunk - returns promise
function uploadSwiftChunk(request_method, request_path, file) {
  var request = new Promise();
  var client = new Client();
  var args = {
    // "headers": { "Content-Type": "application/json", "Authorization": process.env.DUKEDS_API_KEY },
    "data": fs.readFileSync(file, 'utf8')
  };
  console.log('Upload Swift chunk request path: '.concat(request_path));
  client.registerMethod("apiMethod", request_path, request_method);
  client.methods.apiMethod(args, function(data, response) {
    console.log('Upload Swift chunk HTTP status code: '.concat(response.statusCode));
    if (!(_.contains([200, 201], response.statusCode))) {
        console.log('The Swift chunk upload failed - '.concat(response.statusCode).concat(': '));
        console.log(request_path);
        console.log(JSON.stringify(data));
        // console.log(response);
    }
    request.resolve(data);
  });
  return request;
}


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
  var authRoleId = _.sample(_.pluck(JSON.parse(responseStash[LIST_AUTH_ROLES])['results'], 'id'));
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
  var userId = _.sample(_.without(_.pluck(JSON.parse(responseStash[LIST_USERS])['results'], 'id'), g_currentUserId));
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', userId);
  // set global id for downstream tests
  g_userId = userId;
});

var LIST_SYSTEM_PERMISSIONS = "System Permissions > System Permissions collection > List system permissions";
var GRANT_SYSTEM_PERMISSION = "System Permissions > System Permission instance > Grant system permission";
var VIEW_SYSTEM_PERMISSION = "System Permissions > System Permission instance > View system permission";
var REVOKE_SYSTEM_PERMISSION = "System Permissions > System Permission instance > Revoke system permission";

hooks.before(LIST_SYSTEM_PERMISSIONS, function (transaction) {
  transaction.skip = true;
});

hooks.before(GRANT_SYSTEM_PERMISSION, function (transaction) {
  transaction.skip = true;
});

hooks.before(VIEW_SYSTEM_PERMISSION, function (transaction) {
  transaction.skip = true;
});

hooks.before(REVOKE_SYSTEM_PERMISSION, function (transaction) {
  transaction.skip = true;
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
  requestBody['name'] = requestBody['name'].concat(' - ').concat(shortid.generate()).concat(' - update via dredd');
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', projectId);
});


hooks.before(DELETE_PROJECT, function (transaction, done) {
  var payload = { 
    "name": "Delete project for dredd - ".concat(shortid.generate()), 
    "description": "A project to delete for dredd" 
  };
  var request = createResource('POST', '/projects', JSON.stringify(payload));
  // delete sample project resource we created
  request.then(function(data) {
    var url = transaction.fullPath;
    transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', data['id']);
    done();
  });
});

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

var LIST_PROJECT_ROLES = "Project Roles > Project Roles collection > List project roles";
var VIEW_PROJECT_ROLE = "Project Roles > Project Role instance > View project role";
var responseStash = {};

hooks.before(LIST_PROJECT_ROLES, function (transaction) {
  // remove the optional query params
  var url = transaction.fullPath;
  if(transaction.fullPath.indexOf('?') > -1) {
    transaction.fullPath = url.substr(0, url.indexOf('?'));
  } 
});

hooks.after(LIST_PROJECT_ROLES, function (transaction) {
  // saving HTTP response to the stash
  responseStash[LIST_PROJECT_ROLES] = transaction.real.body;
});

hooks.before(VIEW_PROJECT_ROLE, function (transaction) {
  // reusing data from previous response here
  var projectRoleId = _.sample(_.pluck(JSON.parse(responseStash[LIST_PROJECT_ROLES])['results'], 'id'));
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('principal_investigator', projectRoleId);
});

var LIST_AFFILIATES = "Affiliates > Affiliates collection > List affiliates";
var ASSOCIATE_AFFILIATE = "Affiliates > Affiliate instance > Associate affiliate";
var VIEW_AFFILIATE = "Affiliates > Affiliate instance > View affiliate";
var DELETE_AFFILIATE = "Affiliates > Affiliate instance > Delete affiliate";

hooks.before(LIST_AFFILIATES, function (transaction, done) {
  // create sample affiliate resource in case none exist for listing
  var payload = { 
    "project_role": { "id": "principal_investigator" }
  };
  var request = createResource('PUT', '/projects/'.concat(g_projectId).concat('/affiliates/').concat(g_userId), JSON.stringify(payload));
  request.then(function(data) {
    var url = transaction.fullPath;
    transaction.fullPath = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
    done();
  });
});

hooks.before(ASSOCIATE_AFFILIATE, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});

hooks.before(VIEW_AFFILIATE, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});

hooks.before(DELETE_AFFILIATE, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  url = url.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
  transaction.fullPath = url.replace('c1179f73-0558-4f96-afc7-9d251e65b7bb', g_userId);
});

var LIST_STORAGE_PROVIDERS = "Storage Providers > Storage Providers collection > List storage providers";
var VIEW_STORAGE_PROVIDER = "Storage Providers > Storage Provider instance > View storage provider";
var responseStash = {};

hooks.before(LIST_STORAGE_PROVIDERS, function (transaction) {
  // remove the optional query params
  var url = transaction.fullPath;
  if(transaction.fullPath.indexOf('?') > -1) {
    transaction.fullPath = url.substr(0, url.indexOf('?'));
  } 
});

hooks.after(LIST_STORAGE_PROVIDERS, function (transaction) {
  // saving HTTP response to the stash
  responseStash[LIST_STORAGE_PROVIDERS] = transaction.real.body;
});

hooks.before(VIEW_STORAGE_PROVIDER, function (transaction) {
  // reusing data from previous response here
  var storageProviderId = _.sample(_.pluck(JSON.parse(responseStash[LIST_STORAGE_PROVIDERS])['results'], 'id'));
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('g5579f73-0558-4f96-afc7-9d251e65bv33', storageProviderId);
});

var CREATE_FOLDER = "Folders > Folders collection > Create folder";
var VIEW_FOLDER = "Folders > Folder instance > View folder";
var DELETE_FOLDER = "Folders > Folder instance > Delete folder";
var MOVE_FOLDER = "Folders > Folder instance > Move folder";
var RENAME_FOLDER = "Folders > Folder instance > Rename folder";
var responseStash = {};
var g_folderId = null;

hooks.before(CREATE_FOLDER, function (transaction) {
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['parent']['kind'] = 'dds-project';
  requestBody['parent']['id'] = g_projectId;
  requestBody['name'] = requestBody['name'].concat(' - ').concat(shortid.generate());
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
});

hooks.after(CREATE_FOLDER, function (transaction) {
  // saving HTTP response to the stash
  responseStash[CREATE_FOLDER] = transaction.real.body;
});

hooks.before(VIEW_FOLDER, function (transaction) {
  // reusing data from previous response here
  var folderId = JSON.parse(responseStash[CREATE_FOLDER])['id'];
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('d5ae02a4-b9e6-473d-87c4-66f4c881ae7a', folderId);
  // set global id for downstream tests
  g_folderId = folderId;
});

hooks.before(DELETE_FOLDER, function (transaction, done) {
  var payload = { 
    "parent": { "kind": "dds-folder", "id": g_folderId },
    "name": "Delete folder for dredd - ".concat(shortid.generate())
  };
  var request = createResource('POST', '/folders', JSON.stringify(payload));
  // delete sample folder resource we created
  request.then(function(data) {
    var url = transaction.fullPath;
    transaction.fullPath = url.replace('d5ae02a4-b9e6-473d-87c4-66f4c881ae7a', data['id']);
    done();
  });
});

hooks.before(MOVE_FOLDER, function (transaction, done) {
  var payload = { 
    "parent": { "kind": "dds-project", "id": g_projectId },
    "name": "Move folder for dredd - ".concat(shortid.generate())
  };
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['parent']['kind'] = 'dds-folder';
  requestBody['parent']['id'] = g_folderId;
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
  var request = createResource('POST', '/folders', JSON.stringify(payload));
  // move sample folder resource we created
  request.then(function(data) {
    var url = transaction.fullPath;
    transaction.fullPath = url.replace('d5ae02a4-b9e6-473d-87c4-66f4c881ae7a', data['id']);
    // console.log('transaction full path '.concat(transaction.fullPath));
    // console.log('transaction request body '.concat(transaction.request.body));
    done();
  });
});

hooks.before(RENAME_FOLDER, function (transaction) {
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['name'] = requestBody['name'].concat(' - ').concat(shortid.generate()).concat(' - rename via dredd');
  // stringify the new body to request
  transaction.request.body = JSON.stringify(requestBody);
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('d5ae02a4-b9e6-473d-87c4-66f4c881ae7a', g_folderId);
});

var INIT_CHUNKED_UPLOAD = "Uploads > Uploads collection > Initiate chunked upload";
var VIEW_CHUNKED_UPLOAD = "Uploads > Upload instance > View upload";
var GET_CHUNK_URL = "Uploads > Upload instance > Get pre-signed chunk URL";
var COMPLETE_CHUNKED_UPLOAD = "Uploads > Upload instance > Complete chunked file upload";
var responseStash = {};
var g_uploadId = null;
// sample file properties for testing upload workflow
var sampleFile = './upload-sample.html';
var fstats = fs.statSync(sampleFile);
var fsize = fstats['size'];
var md5Hash = md5File(sampleFile);

hooks.before(INIT_CHUNKED_UPLOAD, function (transaction) {
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['name'] = 'upload-sample'.concat('-').concat(shortid.generate()).concat('.html');
  requestBody['content_type'] = 'text/html';
  requestBody['size'] = fsize;
  requestBody['hash']['value'] = md5Hash;
  requestBody['hash']['algorithm'] = 'md5';
  // stringify the new boy to request
  transaction.request.body = JSON.stringify(requestBody);
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('666be35a-98e0-4c2e-9a17-7bc009f9bb23', g_projectId);
});

hooks.after(INIT_CHUNKED_UPLOAD, function (transaction) {
  // saving HTTP response to the stash
  responseStash[INIT_CHUNKED_UPLOAD] = transaction.real.body;
});

hooks.before(VIEW_CHUNKED_UPLOAD, function (transaction) {
  // reusing data from previous response here
  var uploadId = JSON.parse(responseStash[INIT_CHUNKED_UPLOAD])['id'];
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('666be35a-98e0-4c2e-9a17-7bc009f9bb23', uploadId);
  // set global id for downstream tests
  g_uploadId = uploadId;
});

hooks.before(GET_CHUNK_URL, function (transaction) {
  // parse request body from blueprint
  var requestBody = JSON.parse(transaction.request.body);
  // modify request body here
  requestBody['number'] = 1;
  requestBody['size'] = fsize;
  requestBody['hash']['value'] = md5Hash;
  requestBody['hash']['algorithm'] = 'md5';
  // stringify the new boy to request
  transaction.request.body = JSON.stringify(requestBody);
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('666be35a-98e0-4c2e-9a17-7bc009f9bb23', g_uploadId);
});

hooks.after(GET_CHUNK_URL, function (transaction, done) {
  // saving HTTP response to the stash
  responseStash[GET_CHUNK_URL] = transaction.real.body;
  payload = JSON.parse(responseStash[GET_CHUNK_URL]);
  request = uploadSwiftChunk('PUT', payload['host'].concat(payload['url']), sampleFile);
  request.then(function(data) {
    done();
  });
});

hooks.before(COMPLETE_CHUNKED_UPLOAD, function (transaction) {
  // replacing id in URL with stashed id from previous response
  var url = transaction.fullPath;
  transaction.fullPath = url.replace('666be35a-98e0-4c2e-9a17-7bc009f9bb23', g_uploadId);
});

var SEARCH_PROJECT_CHILDREN = "Search Project/Folder Children > Search Project Children > Search Project Children";
var SEARCH_FOLDER_CHILDREN = "Search Project/Folder Children > Search Folder Children > Search Folder Children";

hooks.before(SEARCH_PROJECT_CHILDREN, function (transaction) {
  // replacing id in URL with stashed id from previous response
  // if (transaction.fullPath.indexOf('?') > -1) {
  //   transaction.fullPath = transaction.fullPath.substr(0, url.indexOf('?'));
  // } 
  transaction.fullPath = transaction.fullPath.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_projectId);
});

hooks.before(SEARCH_FOLDER_CHILDREN, function (transaction) {
  // replacing id in URL with stashed id from previous response
  // if (transaction.fullPath.indexOf('?') > -1) {
  //   transaction.fullPath = transaction.fullPath.substr(0, url.indexOf('?'));
  // } 
  transaction.fullPath = transaction.fullPath.replace('ca29f7df-33ca-46dd-a015-92c46fdb6fd1', g_folderId);
});

