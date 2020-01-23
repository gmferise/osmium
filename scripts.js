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

// Updates toggleAuth button status text
function updateAuthStatus() {
	var btn = document.getElementById('auth-button');
	
	if (GoogleAuth.isSignedIn.get()) {
		btn.innerHTML = "Sign Out";
		if (!(btn.classList.contains('signed-in'))) {
			btn.classList.add('signed-in');
		}
	}
	else {
		btn.innerHTML = "Sign In";
		if (btn.classList.contains('signed-in')) {
			btn.classList.remove('signed-in');
		}
	}
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
	if (name == '' || name == null){ return null; }
	name = '[OsDB] '+name;
	var id = gapi.client.sheets.spreadsheets.create({
		properties: {
		title: name
		}
	}).then(function(response){
		getDatabases();
		return response.rW.result.spreadsheetId;
	});
	var requests = [];
	requests.push({
		repeatCell: {
			range: {
				sheetId: "Sheet1",
				startColumnIndex: 0,
				endColumnIndex: 1
			},
			cell: {
				userEnteredFormat: {
					numberFormat: {
						type: "NUMBER",
						pattern: "0"
					}
				}
			},
			fields: "userEnteredFormat.numberFormat"
		}
	});
	var batch = {requests: requests};
	gapi.client.sheets.spreadsheets.batchUpdate({
		spreadsheetId: id,
		resource: batch
	}).then(function(response){
		console.log(response);
	});
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
function gvzQuery(query, callback, page){
	if (page == null) { page = "Sheet1"; }
	var request = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+databaseId+'/gviz/tq?headers=1&access_token='+encodeURIComponent(GoogleAuth.currentUser.get().getAuthResponse().access_token));
	request.setQuery(query);
	request.send(callback);
}

// Gets the name of a user given their id
function getName(id){
	
}

function catchName(response){
	if (response == null){ console.log("getName Query Failed"); return; }
	console.log(response.getDataTable().getDistinctValues(0));
}

// Gets the possible ids of a user given their partial name
function getId(name){
	// SQL: SELECT UNIQUE id WHERE name LIKE ?
	gvzQuery("SELECT  A, B, COUNT(A), COUNT(B) WHERE B CONTAINS '"+name+"' GROUP BY A, B", catchId);
}

function catchId(response){
	if (response == null){ console.log("getId Query Failed"); return; }
	var names = response.getDataTable().getDistinctValues(0);
	var ids = response.getDataTable().getDistinctValues(1);
	var assoc = {};
	for (var i = 0; i < ids.length; i++){
		assoc[ids[i]] = names[i];
	}
	console.log(assoc);
}

// Gets the latest status of a user given their id
function getStatusById(id){
	// SQL: SELECT event WHERE id = ? ORDER BY date DESC LIMIT 1
	gvzQuery("SELECT A, B, C, D WHERE A = "+id+" ORDER BY D DESC LIMIT 1", catchStatus);
}

function getStatusByName(name){
	gvzQuery("SELECT A, COUNT(A) WHERE B CONTAINS '"+name+"' GROUP BY A ORDER BY D DESC LIMIT 10", catchStatus1);
}

function catchStatus1(response){
	if (response == null){ console.log("getStatus Query Failed"); return; }
	var ids = response.getDataTable().getDistinctValues(0);
	var rows = [];
	for (id in ids){
		getStatusById(id);
	}
}

function catchStatus2(response){
}