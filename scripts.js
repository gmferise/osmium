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
		GoogleAuth.isSignedIn.listen(updateAuthButton);
		updateAuthButton();
	});
}

// Updates toggleAuth button status text
function updateAuthButton() {
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

// Dictionary of known databases which is kept up to date using readDatabases()
// Stored as 'Name':'SpreadsheetID'
var knownDatabases = {}; 
var databaseId; // Currently selected database in the form of it's spreadsheet id

// Creates new database in user's Drive using given name
function createDatabase(name){
	if (name != '' && name != null){
		name = '[OsDB] '+name;
		gapi.client.sheets.spreadsheets.create({
			properties: {
			title: name
			}
		}).then(function(response){
			readDatabases();
	  });
	}
}

// Pulls list of [OsDB] sheets from user's Drive to update knownDatabases
function readDatabases(){
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
}

// Selects a database from knownDatabases given it's name
function selectDatabase(name){ 
	selectDatabaseId(knownDatabases[name]);
}

// Selects a database from knownDatabases given it's id
function selectDatabaseId(id){
	databaseId = id;
}

/// ***********
/// * QUERIES *
/// ***********

// Executes the Google Visualization query then passes the result into the callback function
function gvzQuery(query, callback){
	var query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+spreadsheetId+'/gviz/tq?headers=1&access_token='+encodeURIComponent(gapi.auth.getToken().access_token));
	query.setQuery(query);
	query.send(callback);
}

// Gets the name of a user given their id from the database
function getName(id){
	// SQL: SELECT name WHERE id = ?
	gvzQuery("SELECT A WHERE B = "+id, catchName);
}

// 
function catchName(response){
	console.log(response);
}

// Gets the possible ids of a user given their partial name from the database
function getId(name){
	// SQL: SELECT id WHERE name LIKE ?
	gvzQuery("SELECT A, B WHERE A CONTAINS "+name, catchId);
}

function catchId(response){
	console.log(response);
}
