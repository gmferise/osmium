/// ******************************
/// * GOOGLE AUTH API AND CONFIG *
/// ******************************

var GoogleAuth; // Stores auth token and other info

/// ***** BUTTON FUNCTIONS *****

// Hangles sign in and out with one press
function toggleAuth() {
	if (GoogleAuth.isSignedIn.get()) {
		GoogleAuth.signOut();
	}
	else {
		GoogleAuth.signIn();
	}
}

/// ***** INTERNAL FUNCTIONS *****

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
var databaseId; // Currently selected database in the form of it's spreadsheet id1
var pageId; // Second page of spreadsheet

/// ***** ASYNC FUNCTIONS *****

// Creates new database in user's Drive using given name
// Returns new database id through catch
function createDatabase(name){
	if (name == '' || name == null){ throw new Error("Please provide a valid name"); }
	name = '[OsDB] '+name;
	gapi.client.sheets.spreadsheets.create({
		properties: {
		title: name
		}
	}).then(function(response){
		console.log("Created new database. Configuring...");
		var id = response.result.spreadsheetId;
		getDatabases();
		catchNewDatabase(id);	
		
		var requests = [];
		
		// Rename first page
		requests.push({
			"updateSheetProperties": {
				"properties": {
					"sheetId": 0,
					"title": "DATABASE",
				},
            "fields": "title",
			}
		});
		
		// Format database columns
		requests.push({
			"repeatCell": {
				"range": {
					"startRowIndex": 0,
					"startColumnIndex": 0,
					"endColumnIndex": 1
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "NUMBER",
							"pattern": "0"
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({
			"repeatCell": {
				"range": {
					"startRowIndex": 0,
					"startColumnIndex": 1,
					"endColumnIndex": 2
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({
			"repeatCell": {
				"range": {
					"startRowIndex": 0,
					"startColumnIndex": 2,
					"endColumnIndex": 3
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({
			"repeatCell": {
				"range": {
					"startRowIndex": 0,
					"startColumnIndex": 3,
					"endColumnIndex": 4
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "DATE",
							"pattern": "HH:MM:SS dd.mm.yyyy"
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({
			"repeatCell": {
				"range": {
					"startRowIndex": 0,
					"startColumnIndex": 4,
					"endColumnIndex": 5
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "TEXT",
							"pattern": ""
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		
		// Give database columns headers		
		requests.push({
			"updateCells": {
				"rows": [{
					"values": [
						{"userEnteredValue": {"stringValue": "id"}},
						{"userEnteredValue": {"stringValue": "name"}},
						{"userEnteredValue": {"stringValue": "event"}},
						{"userEnteredValue": {"stringValue": "timestamp"}},
						{"userEnteredValue": {"stringValue": "comments"}}
					]
				}],
				"fields": "userEnteredValue",
				"start": {
					"rowIndex": 0,
					"columnIndex": 0
				},
				
			}
		});
		
		// Make second page
		requests.push({
			"addSheet": {
				"properties": {
					"title":"ID_REFERENCE"
				}
			}
		});
		
		// Do requests
		var batch = {requests: requests};
		gapi.client.sheets.spreadsheets.batchUpdate({
			spreadsheetId: id,
			resource: batch
		}).then(function(response){
			// Request to get new sheet gid
			var id = response.result.spreadsheetId;
			
			gapi.client.sheets.spreadsheets.get({
				spreadsheetId: id
			}).then(function(response){
				var id = response.result.spreadsheetId;
				var pageId = response.result.sheets[1].properties.sheetId;
				
				// Third round of requests
				var requests = [];
				
				// Format database columns
				requests.push({
					"repeatCell": {
						"range": {
							"sheetId": pageId,
							"startRowIndex": 0,
							"startColumnIndex": 0,
							"endColumnIndex": 1
						},
						"cell": {
							"userEnteredFormat": {
								"numberFormat": {
									"type": "NUMBER",
									"pattern": "0"
								}
							}
						},
						"fields": "userEnteredFormat.numberFormat"
					}
				});
				requests.push({
					"repeatCell": {
						"range": {
							"sheetId": pageId,
							"startRowIndex": 0,
							"startColumnIndex": 1,
							"endColumnIndex": 2
						},
						"cell": {
							"userEnteredFormat": {
								"numberFormat": {
									"type": "TEXT",
									"pattern": ""
								}
							}
						},
						"fields": "userEnteredFormat.numberFormat"
					}
				});
			
				// Give database columns headers		
				requests.push({
				"updateCells": {
					"rows": [{
						"values": [
							{"userEnteredValue": {"stringValue": "id"}},
							{"userEnteredValue": {"stringValue": "name"}},
						]
					}],
					"fields": "userEnteredValue",
					"start": {
						"sheetId": pageId,
						"rowIndex": 0,
						"columnIndex": 0
					},
					
				}
			});
				
				// Do requests
				var batch = {requests: requests};
				gapi.client.sheets.spreadsheets.batchUpdate({
					spreadsheetId: id,
					resource: batch
				}).then(function(response){
					if (response.status != 200){
						throw new Error("Failed to configure the spreadsheet");
					}
					else {
						console.log("Configured the spreadsheet.");
					}
				});
			});
		});
	});
}

// Pulls list of [OsDB] sheets from user's Drive to update knownDatabases
// Returns new knownDatabases through catch
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
		catchGetDatabases(knownDatabases);
    },function(err) { console.error("Failed to search Drive for Databases"); });
}

// Gets second page id of currently selected database
// Returns through catch
function getPageId(){
	return gapi.client.sheets.spreadsheets.get({
			spreadsheetId: id
	}).then(function(response){
		pageId = response.result.sheets[1].properties.sheetId;
		catchPageId(pageId);
	});
}

function catchPageId(response){
	console.log(response); // New reference id
}

/// ***** STANDARD FUNCTIONS *****

// Assigns databaseId a database from knownDatabases given it's name
// Returns selected database id
function selectDatabase(name){ 
	return selectDatabaseId(knownDatabases[name]);
}

// Assigns databaseId a database from knownDatabases given it's id
// Returns selected database id
function selectDatabaseId(id){
	databaseId = id;
	return id;
}

/// ***********
/// * QUERIES *
/// ***********

/// ***** INTERNAL FUNCTIONS *****

// Executes the Google Visualization query then passes the result into the callback function
function gvzQuery(query, callback, page){
	if (page == null) { page = "0"; }
	var request = new google.visualization.Query('https://docs.google.com/spreadsheets/d/'+databaseId+'/gviz/tq?headers=1&access_token='+encodeURIComponent(GoogleAuth.currentUser.get().getAuthResponse().access_token));
	request.setQuery(query);
	request.send(callback);
}

/// ***** ASYNC FUNCTIONS *****

// Queries the reference page for the name of a user given their id
// Returns through catch
function getName(id){
	if (pageId == 0) { throw new Error("Page must not be first page of sheet"); }
	gvzQuery("SELECT A, B, COUNT(A), COUNT(B) WHERE A = "+id+" GROUP BY A, B LIMIT 1", catchName, pageId);
}

function catchName(response){
	if (response == null){ console.log("getName Query Failed"); return; }
	console.log(response.getDataTable().getDistinctValues(0)); // [id, name, count(id), count(name)]
}

// Queries the reference page for the possible ids of a user given their partial name
// Returns through catch
function getId(name, page){
	if (pageId == 0) { throw new Error("Page must not be first page of sheet"); }
	// SQL: SELECT UNIQUE id WHERE name LIKE ?
	gvzQuery("SELECT  A, B, COUNT(A), COUNT(B) WHERE B CONTAINS '"+name+"' GROUP BY A, B", catchId, pageId);
}

function catchId(response){
	if (response == null){ console.log("getId Query Failed"); return; }
	var names = response.getDataTable().getDistinctValues(0);
	var ids = response.getDataTable().getDistinctValues(1);
	var assoc = {};
	for (var i = 0; i < ids.length; i++){
		assoc[ids[i]] = names[i];
	}
	console.log(assoc); // Associative array of {id:name}
}

// Gets the latest status of a user given their id from main database
// Returns through catch
function getStatusById(id){
	// SQL: SELECT event WHERE id = ? ORDER BY date DESC LIMIT 1
	gvzQuery("SELECT A, B, C, D, E WHERE A = "+id+" ORDER BY D DESC LIMIT 1", catchStatus);
}

function catchStatus(response){
	if (response == null){ console.log("getStatus Query Failed"); return; }
	console.log(response.J.wg); // Array of [id, name, status, timestamp, comments]
}

// Gets list of 10 statuses that most closely match the given name
// Returns through catch
function getStatusByName(name){
	gvzQuery("SELECT A, D, COUNT(A), COUNT(D) WHERE B CONTAINS '"+name+"' GROUP BY A, D ORDER BY D DESC LIMIT 10", catchStatusIds);
}

function catchStatusIds(response){
	if (response == null){ console.log("getStatusByName Query Failed"); return; }
	var ids = response.getDataTable().getDistinctValues(0);
	var rows = [];
	for (i in ids){
		rows.push(getStatusById(ids[i]));
	}
	console.log(rows); // Array of 10 statuses [id, name, status, timestamp, comments]
}
