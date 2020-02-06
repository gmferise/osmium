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
		getDatabases(id);
		
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
		requests.push({ // int id (>= 0)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 0,
					"endColumnIndex": 1
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "NUMBER",
							"pattern": "0"
						},
					},
					"dataValidation": {
						"condition": { "type": "NUMBER_GREATER_THAN_EQ", "values": [{"userEnteredValue": "0"}] },
						"strict": true
					}
				},
				"fields": "userEnteredFormat.numberFormat,dataValidation"
			}
		});
		requests.push({ // str name (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
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
		requests.push({ // str event (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
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
		requests.push({ // DateTime timestamp (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 3,
					"endColumnIndex": 4
				},
				"cell": {
					"userEnteredFormat": {
						"numberFormat": {
							"type": "DATE",
							"pattern": "dd/mm/yyyy, HH:MM:SS"
						}
					}
				},
				"fields": "userEnteredFormat.numberFormat"
			}
		});
		requests.push({ // str comments (no validation)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
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
		requests.push({ // bool studying (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 5,
					"endColumnIndex": 6
				},
				"cell": {
					"dataValidation": {
						"condition": {
							"type": "BOOLEAN"
						}
					}
				},
				"fields": "dataValidation"
			}
		});
		requests.push({ // bool technology (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 6,
					"endColumnIndex": 7
				},
				"cell": {
					"dataValidation": {
						"condition": {
							"type": "BOOLEAN"
						}
					}
				},
				"fields": "dataValidation"
			}
		});
		requests.push({ // bool printing (strict)
			"repeatCell": {
				"range": {
					"startRowIndex": 1,
					"startColumnIndex": 7,
					"endColumnIndex": 8
				},
				"cell": {
					"dataValidation": {
						"condition": { "type": "BOOLEAN" },
						"strict": true,
						"showCustomUi": true
					}
				},
				"fields": "dataValidation"
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
						{"userEnteredValue": {"stringValue": "comments"}},
						{"userEnteredValue": {"stringValue": "studying"}},
						{"userEnteredValue": {"stringValue": "technology"}},
						{"userEnteredValue": {"stringValue": "printing"}}
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
function getDatabases(newDatabase){
	// Do not place params directly in the array, must be evaluated beforehand
	var params = "mimeType='application/vnd.google-apps.spreadsheet' and '"+GoogleAuth.currentUser.get().getBasicProfile().getEmail()+"' in writers and name contains '[OsDB]' and trashed = false";
	gapi.client.drive.files.list({
		q: params,
	}).then(function(response) {
		var dbs = response.result.files
		for (var i = 0; i < dbs.length; i++){
			knownDatabases[dbs[i].name] = dbs[i].id;
		}
		if (newDatabase != undefined) { catchCreateDatabase(newDatabase); }
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
function selectDatabaseName(name){ 
	var id = knownDatabases[name]
	selectDatabaseId(id);
	return id;
}

// Assigns databaseId a database from knownDatabases given it's id
// Returns selected database name
function selectDatabaseId(id){
	databaseId = id;
	for (var db in knownDatabases) {
		if (knownDatabases[db] == id) {
			return db;
		}
	}
	return id;
}

/// ******************
/// * UPDATE QUERIES *
/// ******************

/// ***** ASYNC FUNCTIONS *****

  //--------//
 /// TODO ///
//--------//

// Input: id, event name, comments, bool[](studying, technology, printing)
function pushEvent(id, type, comments, flags){ 
	// Get name from uid 
	getName(id, function(response){
		name = response.getDataTable().getDistinctValues(1)[0];
		if (name == undefined) { console.log("pushEvent() WARN: No name found for id "+id)}
		// Update values
		gapi.client.sheets.spreadsheets.values.append({
			"spreadsheetId": databaseId,
			"range": "A:H",
			"resource": {
				"values": [
				[id, name, type,
				new Date().toLocaleString("en-GB-u-hc-h24",
				{day:"2-digit", month:"2-digit", year:"numeric",
				hour:"2-digit", minute:"2-digit", second:"2-digit"}),
				comments, flags[0], flags[1], flags[2]]
				]
			},
			"valueInputOption": "USER_ENTERED"
		}).then(function(response){
			console.log(response);
		});	
	}, pageId);
}


/// ******************
/// * SELECT QUERIES *
/// ******************

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
function getName(id, callback){
	if (pageId == 0) { throw new Error("Page must not be first page of sheet"); }
	gvzQuery("SELECT A, B, COUNT(A), COUNT(B) WHERE A = "+id+" GROUP BY A, B LIMIT 1", callback, pageId);
}

// Returns through catch
// Easy use: getEventsAfter(new Date()) does Date() = Now()
function getEventsAfter(dateObject){
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE D > date '"+dateObject.toISOString()+"' ORDER BY D DESC", catchEventsAfter);
}

function catchEventsAfter(response){
	console.log(response.getDataTable());
	var dt = response.getDataTable()
	var uniqueids = [];
	var events = [];
	for (var i=0; i<dt.length; i++) {
		var row = dt.getDistinctValues(i);
		var index = uniqueids.indexOf(row[0]);
		if (index == -1) {
			uniqueids.push(row[0]);
			events.push([row]);
		} else {
			events[index].push(row);
		}
		
	}
	for (i=0; i<uniqueids.length; i++) {
		
	}
}

// Returns through catch
function getStudentHistory(id){
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE A = "+id+" ORDER BY D DESC", catchDailyEntries);
}

function catchStudentHistory(response){
	console.log(response.getDataTable());
}

// Returns through catch
function getStatusById(id){
	// SQL: SELECT TOP 2 * WHERE id = ? ORDER BY date DESC
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE A = "+id+" ORDER BY D DESC LIMIT 2", catchStatus);
}

function catchStatus(response){
	// Gets the latest status of a user given their id from main database
	// Returns 2 events to check for tech status... [most recent, 2nd most recent]
	// so read these right to left for time-wise order
	// possible scenarios... (event(newer), event(older) = status, doTechColor)
	// check-in, check-in = in, false (assume was check-in > forgot to check out > checked in later)
	// check-in, check-out = in, false (excpected check-out > check-in)
	// check-in, sent-tech = in, false (assume was check-in > sent-tech > forgot to check out > checked in later)
	// check-out, check-in = out, false (expected check-in > check-out)
	// check-out, check-out = out, false (assume checked out twice or something idk)
	// check-out, sent-tech = out, true (assume was check-in > sent-tech > check-out)
	// sent-tech, check-in = in, true (expected check-in > sent-tech > check out)
	// sent-tech, check-out = out, true (assume forgot to send to tech before student left)
	// sent-tech, sent-tech = THROW ERROR, sent-tech pushEvent should not write if most recent status ends is sent-tech
	if (response == undefined){ console.log("getStatus Query Failed"); return; }
	console.log(response.getDataTable().getDistinctValues(0)); // Array of [id, name, status, timestamp, comments]
}

// Gets list of 10 statuses that most closely match the given name
// Returns through catch
function getStatusByName(name, count){
	// SELECT TOP ? DISTINCT NAME WHERE NAME LIKE ?
	if (typeof(count) != "number"){ throw new TypeError; }
	gvzQuery("SELECT A, D, COUNT(A), COUNT(D) WHERE B CONTAINS '"+name+"' GROUP BY A, D ORDER BY D DESC LIMIT "+count|0, catchStatusIds, pageId);
}

function catchStatusIds(response){
	if (response == undefined){ console.log("getStatusByName Query Failed"); return; }
	var ids = response.getDataTable().getDistinctValues(0);
	var rows = [];
	for (i in ids){
		getStatusByIdBatch(ids[i]);
	}
}

function getStatusByIdBatch(id){
	// SQL: SELECT TOP 1 * WHERE id = ? ORDER BY date DESC 
	gvzQuery("SELECT A, B, C, D, E, F, G, H WHERE A = "+id+" ORDER BY D DESC LIMIT 1", catchStatusBatch);
}

function catchStatusBatch(response){
	// Recieves individual statuses
	console.log(response.getDataTable().getDistinctValues(0));
}
