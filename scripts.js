// NOTE: Any relevant information for frontend is
// located towards the top of each large section header.
// Button functions & global variables are for you!

/// ******************************
/// * GOOGLE AUTH API AND CONFIG *
/// ******************************

var GoogleAuth; // Stores authenticated token

// ***** BUTTON FUNCTIONS *****

function toggleAuth() { // Hangles sign in and out with one press
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

// ***** INTERNAL FUNCTIONS *****

function handleClientLoad() { // Called from HTML when API loads
	gapi.load("client:auth2", initClient);
}

function initClient() { // Generates auth client instance, stored in GoogleAuth
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

function updateAuthButton() { // Updates button
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

// Dictionary of known OS Databases, use to populate dropdown
// Stored as 'Name':'SpreadsheetID'
var knownDatabases = {}; 
var databaseId; // Currently selected OS Database (Spreadsheet ID)

// Creates new database in user's Drive using given name
function createDatabase(name){
	if (name != '' && name != null){
		name = '[OsDB] '+name;
		gapi.client.sheets.spreadsheets.create({
			properties: {
			title: name
			}
		}).then(function(response){
			return getDatabases();
	  });
	}
}

// Pulls list of [OsDB] sheets from user's Drive and assigns it into AssocArr knownDatabases
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
		return knownDatabases;
    },function(err) { console.error("Failed to search Drive for Databases"); });
	
}

// Selects a database given it's name
function selectDatabase(name){ 
	selectDatabaseId(knownDatabases[name]);
}

// Selects a database given it's id
function selectDatabaseId(id){
	databaseId = id;
}

/// ***********
/// * QUERIES *
/// ***********

function gvzQuery(query, callback){
	var query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+spreadsheetId+'/gviz/tq?headers=1&access_token='+encodeURIComponent(gapi.auth.getToken().access_token));
	query.setQuery(query);
	query.send(callback);
}

function getName(id){
	// SELECT name WHERE id = ?
	gvzQuery("SELECT A WHERE B = "+id, getName_response);
}

function getName_response(response){
	console.log(response);
	var tbl = response.getDataTable();
}

function test(){
	getName('9923456');
}
