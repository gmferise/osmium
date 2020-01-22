/// ******************************
/// * GOOGLE AUTH API AND CONFIG *
/// ******************************

var GoogleAuth; // Stores auth token and other info

// ***** BUTTON FUNCTIONS *****

// Hangles sign in and out with one press
function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

// ***** INTERNAL FUNCTIONS *****

// Called from HTML to finish loading API
function loadAuth() {
	gapi.load("client:auth2", initClient);
}

// Generates auth client instance, stored in GoogleAuth
function initClient() {
	// do not place docs directly in the array, must be evaluated beforehand
	var docs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest","https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
	gapi.client.init({ // Initialize a client with these properties
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":docs,
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets"
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(updateAuthStatus);
		updateAuthStatus();
	});
}

/// ***********************
/// * DATABASE MANAGEMENT *
/// ***********************

// Dictionary of known databases which is kept up to date using getDatabases()
// Stored as 'Name':'SpreadsheetID'
var knownDatabases = {}; 
var databaseId; // Currently selected database in the form of it's spreadsheet id

// Creates new database in user's Drive using given name
// Returns new database id
function createDatabase(name){
	if (name != '' && name != null){
		name = '[OsDB] '+name;
		return gapi.client.sheets.spreadsheets.create({
			properties: {
			title: name
			}
		}).then(function(response){
			getDatabases();
			return response.rW.result.spreadsheetId;
	  });
	}
}

// Resets a sheet and configures its rows
function configureDatabase(id){
	
}

// Pulls list of [OsDB] sheets from user's Drive to update knownDatabases
// Returns new knownDatabases
function getDatabases(){
	// Do not place params directly in the array, must be evaluated beforehand
	var params = "mimeType='application/vnd.google-apps.spreadsheet' and '"+GoogleAuth.currentUser.get().getBasicProfile().getEmail()+"' in writers and name contains '[OsDB]' and trashed = false";
	gapi.client.drive.files.list({
		q: params,
	}).then(function(response) {
		var dbs = response.result.files
		for (var i = 0; i < dbs.length; i++){
			knownDatabases[dbs[i].name] = dbs[i].id;
		}
    },function(err) { console.error("Failed to search Drive for Databases"); });
	return knownDatabases;
}

// Selects a database from knownDatabases given it's name
// Returns selected database id
function selectDatabase(name){ 
	selectDatabaseId(knownDatabases[name]);
}

// Selects a database from knownDatabases given it's id
// Returns selected database id
function selectDatabaseId(id){
	databaseId = id;
	return id;
}

/// ***********
/// * QUERIES *
/// ***********

// Executes the Google Visualization query then passes the result into the callback function
function gvzQuery(query, callback){
	var request = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+databaseId+'/gviz/tq?headers=1&access_token='+encodeURIComponent(GoogleAuth.currentUser.get().getAuthResponse().access_token));
	request.setQuery(query);
	request.send(callback);
}

// Gets the name of a user given their id from the database
function getName(id){
	// SQL: SELECT UNIQUE name WHERE id = ?
	gvzQuery("SELECT B, COUNT(B) WHERE A = "+id+" GROUP BY B", catchName);
}

function catchName(response){
	console.log(response.getDataTable().getDistinctValues(0));
}

// Gets the possible ids of a user given their partial name from the database
function getId(name){
	// SQL: SELECT UNIQUE id WHERE name LIKE ?
	gvzQuery("SELECT  A, B, COUNT(A), COUNT(B) WHERE B CONTAINS '"+name+"' GROUP BY B, A", catchId);
}

function catchId(response){
	var names = response.getDataTable().getDistinctValues(0);
	var ids = response.getDataTable().getDistinctValues(1);
	var assoc = {};
	for (var i = 0; i < ids.length; i++){
		assoc[ids[i]] = names[i];
	}
	console.log(assoc);
}
