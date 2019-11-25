// Google Auth Config
var GoogleAuth;
var databaseId

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
		"scope":"https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.appdata"
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(updateSigninStatus);
				
		var user = GoogleAuth.currentUser.get();
		setSigninStatus();
		
		$("#sign-in-or-out-button").click(function() {
			toggleAuth();
		});
	});

function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

function setSigninStatus(isSignedIn) { // Sets status message
	var user = GoogleAuth.currentUser.get();
	if (GoogleAuth.isSignedIn.get()) {
		$('#sign-in-or-out-button').html('Sign Out');
		$('#auth-status').html('(Currently Signed In.)');
	}
	else {
		$('#sign-in-or-out-button').html('Sign In');
		$('#auth-status').html('(Curently Signed Out.)');
	}
}

function updateSigninStatus(isSignedIn) {
	setSigninStatus();
}

// Sheets Calls
function createTable(){
	gapi.client.sheets.spreadsheets.create(
	{
		properties: {
			title: 'Osmium Database'
		}
	}
	)
	.then(databaseId = response.result.spreadsheetId;);
}