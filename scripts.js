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
	// do not place docs directly in the array because javascript will stroke out
	var docs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest","https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
	gapi.client.init({ // Initialize a client with these properties
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":docs,
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets"
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

/// **********************
/// * BROWSER MANAGEMENT *
/// **********************

// ***** UTILITY FUNCTIONS *****
function loadDocument(){
	readKnownDatabases();
	var value = window.location.hash;
	if (value != null){
		importDatabase('https://docs.google.com/spreadsheets/u/1/d/'+value+'/edit');
	}
}

loadDocument();

function setCookie(id, value){
	var exp = new Date();
	exp.setFullYear(exp.getFullYear()+1);
	document.cookie = id+'='+value+'; path=/; expires='+exp.toUTCString();
}

function getCookie(id){
	id = id+'=';
	var cookieArray = decodeURIComponent(document.cookie).split(';');
	for (var i = 0; i < cookieArray.length; i++){
		var c = cookieArray[i];
		while (c.charAt(0) == ' '){
			c = c.substring(1);
		}
		if (c.indexOf(id) == 0){
			return c.substring(id.length, c.length);
		}
	}
	return '';
}

/// ***********************
/// * DATABASE MANAGEMENT *
/// ***********************

// Dictionary of known OS Databases, use to populate dropdown
// Stored as 'Name':'SpreadsheetID'
var knownDatabases = {}; 
var databaseId; // Currently selected OS Database (Spreadsheet ID)

// ***** BUTTON FUNCTIONS *****

// Creates new database in user's Drive using given name
function createDatabase(name){
	if (name != '' && name != null){
		name = '[OsDB] '+name;
		gapi.client.sheets.spreadsheets.create({
			properties: {
			title: name
			}
		}).then(function(response){
			var id = response.result.spreadsheetId
			selectDatabaseId(id);
			knownDatabases[name] = id;  
			writeKnownDatabases();
	  });
	}
}

// Given Spreadsheet url, loads it into knownDBs and cookies
function importDatabase(url){
	var id = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)").exec(url)[1];
	if (id != '' && id != null){
		var name = '';
		gapi.client.sheets.spreadsheets.get({
			spreadsheetId:id
		}).then(function(response){
			name = JSON.parse(response.body)['properties']['title'];
			selectDatabaseId(id);
			knownDatabases[name] = id;
			writeKnownDatabases();
		});
	}
}

// Selects a databaseId from name
function selectDatabase(name){ 
	selectDatabaseId(knownDatabases[name]);
}

// ***** INTERNAL FUNCTIONS *****

function readKnownDatabases(){ // Reads knownDatabases from cookies
	knownDatabases = JSON.parse(getCookie('databases'));
	console.log(knownDatabases);
}

function selectDatabaseId(id){
	window.location.hash = id;
	databaseId = id;
}

function writeKnownDatabases(){ // Writes knownDatabases to cookies
	// Super jank, if you don't assign then stringify
	// Gives you just "[]"
	setCookie('databases',JSON.stringify(Object.assign({},knownDatabases)));
}
