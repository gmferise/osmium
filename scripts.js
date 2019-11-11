// Google Auth Config
var GoogleAuth;
;
function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}

function initClient() {
	// do not place docs directly in the array because javascript will stroke out
	var docs = ["https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"];
	var scopes = ["https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/spreadsheets"];
	gapi.client.init({
		"apiKey":"AIzaSyDIptkXtN8vcrOr5LPBvk21WuAk8UmVwAs",
		"discoveryDocs":docs,
		"clientId":"1031491199015-pbjmtfn9kj0tvcl24k7vntelua6glb90.apps.googleusercontent.com",
		"scope":scopes
	}).then(function() {
		GoogleAuth = gapi.auth2.getAuthInstance();
		GoogleAuth.isSignedIn.listen(updateSigninStatus);
		
		var user = GoogleAuth.currentUser.get();
		setSigninStatus();
		
		$("#sign-in-or-out-button").click(function() {
			toggleAuth();
		});
		
		$("#revoke-access-button").click(function() {
			revokeAccess();
		});
	});
}

function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

function revokeAccess() {
	GoogleAuth.disconnect();
}

function setSigninStatus(isSignedIn) {
	var user = GoogleAuth.currentUser.get();
	if (GoogleAuth.isSignedIn.get()) {
		$('#sign-in-or-out-button').html('Sign Out');
		$('#revoke-access-button').css('display', 'inline-block');
		$('#auth-status').html('(Currently Signed In.)');
	}
	else {
		$('#sign-in-or-out-button').html('Sign In');
		$('#revoke-access-button').css('display', 'none');
		$('#auth-status').html('(Curently Signed Out.)');
	}
}

function updateSigninStatus(isSignedIn) {
	setSigninStatus();
}