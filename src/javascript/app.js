Ext.define("CArABU.app.TCApp", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'selector_box', layout: 'hbox'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "Team Capacity"
    },

    launch: function() {
        var me = this;

        this.down('#message_box').update(this.getContext().getUser());

        this.start_rls = this.down('#selector_box').add({
            xtype:'rallyreleasecombobox',
            fieldLabel: 'Starting Release: ',
            itemId: 'start_rls',
            name: 'start_rls',
            margin: 10,
            labelWidth: 45,
            allowClear: false,
            storeConfig: {
                limit: Infinity,
                remoteFilter: false,
                autoLoad: true
            },

          });

        this.end_rls = this.down('#selector_box').add({
            xtype:'rallyreleasecombobox',
            fieldLabel: 'Ending Release: ',
            itemId: 'end_rls',
            name: 'end_rls',
            margin: 10,
            labelWidth: 45,
            allowClear: false,
            storeConfig: {
                limit: Infinity,
                remoteFilter: false,
                autoLoad: true
            }
        });

        this.down('#selector_box').add({
            xtype: 'rallybutton',
            text: 'Go',
            margin: '10 10 10 10',
            defaultAlign: 'right',
            listeners: {
                click: this._setReleaseFilters,
                scope: this
            }
        });

//        this.down('#selector_box').add({
//            xtype: 'rallybutton',
//            text: 'Export',
//            margin: '10 10 10 10',
//            defaultAlign: 'right',
//            listeners: {
//                scope: this,
//                click: this._export
//            }
//        });
    },

    _setReleaseFilters: function() {
        this.setLoading("Loading stuff...");
        if (this.down('#display_box')){
            this.down('#display_box').removeAll();
        }
        var startReleaseStart = this.start_rls.getRecord().get('ReleaseStartDate');
        var startReleaseEnd = this.start_rls.getRecord().get('ReleaseDate');
        var endReleaseStart = this.end_rls.getRecord().get('ReleaseStartDate');
        var endReleaseEnd = this.end_rls.getRecord().get('ReleaseDate');

/*

  Call with Visa Wed 2-Aug - use only End Dates from Release Selections

*/

//        var releaseStartISO = Rally.util.DateTime.toIsoString(startReleaseStart,true);
        var releaseStartISO = Rally.util.DateTime.toIsoString(startReleaseEnd,true);
        var releaseEndISO = Rally.util.DateTime.toIsoString(endReleaseEnd,true);

        if (startReleaseEnd >= endReleaseEnd) {
          releaseStartISO = Rally.util.DateTime.toIsoString(endReleaseEnd,true);
          releaseEndISO = Rally.util.DateTime.toIsoString(startReleaseEnd,true);
        }

        var earliestStartISO = Rally.util.DateTime.toIsoString(startReleaseStart,true);
        if (startReleaseStart > endReleaseStart) {
          earliestStartISO = Rally.util.DateTime.toIsoString(endReleaseStart,true);
        }

        this.releaseStartISO = releaseStartISO;
        this.releaseEndISO = releaseEndISO;

//        this._countTBIterations(releaseStartISO,releaseEndISO,earliestStartISO);
        this._fetchValidIterations(releaseStartISO,releaseEndISO,earliestStartISO);

    },

    _countTBIterations: function(releaseStartISO,releaseEndISO,earliestStartISO) {
        var me = this;

        this.setLoading("Fetching timeboxes...");

        var iteration_config = {
            model: 'Iteration',
            fetch: ['Name',"StartDate","EndDate",'Project'],
            filters: [
              {property:"StartDate", operator: '<', value: releaseEndISO},
              {property:"EndDate", operator: '>=', value: releaseStartISO}
//              {property:"EndDate", operator: '>=', value: earliestStartISO},
//              {property:"EndDate", operator: '>=', value: Rally.util.DateTime.toIsoString(new Date())}
            ],
            sorters: [{property:"EndDate", direction:'ASC'}],
            context: {
                project: 'https://us1.rallydev.com/slm/webservice/v2.0/project/20150591812',
                projectScopeUp: false,
                projectScopeDown: false
            }
        };

        me._loadWsapiRecords(iteration_config).then({
              scope: this,
              success: function(iterations) {
//                var num2get = iterations.length + 6;
//                me._fetchValidIterations(num2get,releaseStartISO,releaseEndISO,earliestStartISO);
                me._fetchValidIterations(releaseStartISO,releaseEndISO,earliestStartISO);
              },
              failure: function(error_message){
                  alert(error_message);
              }
              }).always(function() {
              });
    },

//    _fetchValidIterations: function(num2get,releaseStartISO,releaseEndISO,earliestStartISO) {
    _fetchValidIterations: function(releaseStartISO,releaseEndISO,earliestStartISO) {
        var me = this;

        this.setLoading("Fetching timeboxes...");

        var iteration_config = {
            model: 'Iteration',
            fetch: ['Name',"StartDate","EndDate",'Project','PlannedVelocity','PlanEstimate', 'ObjectID'],
            filters: [
              {property:"StartDate", operator: '<=', value: releaseEndISO},
              {property:"EndDate", operator: '>=', value: releaseStartISO}
            ],
            limit: 2000,
            pageSize: 2000,
            sorters: [{property:"EndDate", direction:'ASC'}],
            context: {
//                project: 'https://us1.rallydev.com/slm/webservice/v2.0/project/20150591812',
                projectScopeUp: false,
                projectScopeDown: true
            }
        };
//me.logger.log("iteration_config",iteration_config);

        me._loadWsapiRecords(iteration_config).then({
              scope: this,
              success: function(iterations) {
//me.logger.log("Fetched:",iterations);

              iterations.sort(function(a, b){
                var dateA=new Date(a.raw['EndDate']), dateB=new Date(b.raw['EndDate'])
                return dateA-dateB //sort by date ascending
              })
me.logger.log("Sorted:",iterations);
              for (i=0; i<iterations.length; i++) {
                me.logger.log(i,iterations[i].data.Project.Name,iterations[i].data.Name,iterations[i].data.PlannedVelocity,iterations[i].data.PlanEstimate,iterations[i].data.PlannedVelocity-iterations[i].data.PlanEstimate);
            }
//                me._loadFeatures(iterations,releaseStartISO,releaseEndISO);

                me._aggregateIterationData(iterations);
/*
            Here be dragons
*/
me.logger.log("do I blow up here");
//            me._displayGrid(rows);
me.logger.log("or here");              },
              failure: function(error_message){
                  alert(error_message);
              }
              }).always(function() {
              });
    },
/*
    _loadFeatures: function(iterations,releaseStartISO,releaseEndISO) {
        this.setLoading("Loading Features...");
        var me = this;
        var today = new Date();
        var feature_config = {
            model: 'PortfolioItem/Feature',
            fetch: ['FormattedID',
                    'ObjectID',
                    'Name',
                    'State',
                    'Release',
                    'ReleaseStartDate',
                    'ReleaseDate',
                    'LeafStoryCount'
            ],
            filters: [
//              {property: 'FormattedID',operator:'=',value:4356},
              {property: 'LeafStoryCount',operator:'>',value:0},
              {property: 'Release.ReleaseDate',operator:'>=',value: releaseStartISO},
              {property: 'Release.ReleaseDate',operator:'<=',value: releaseEndISO}
            ],
            context: {
                projectScopeDown: true
            }
        };

            me._loadWsapiRecords(feature_config).then({
              scope: this,
              success: function(features) {
              me._loadStories(features,iterations);
              },
              failure: function(error_message){
                  alert(error_message);
              }
              }).always(function() {
              });
    },

    _loadStories: function(features,iterations) {
        this.setLoading("Loading Stories...");
        var me = this;
        var promises = [];

        Ext.Array.each(features, function(feature) {
          promises.push(function() {
            return me._loadStoriesForFeature(feature, iterations);
          });
        });
        Deft.Chain.sequence(promises, this).then ({
            success: function(rows) {
me.logger.log("before flatten:",rows);
              rows = Ext.Array.flatten(rows);
me.logger.log("after flatten:",rows);
              me._getAvailability(rows);
          },
          failure: function(error_message){
              alert(error_message);
          }
        });
    },

    _loadStoriesForFeature: function(feature, iterations) {
      var deferred = Ext.create("Deft.Deferred");
      var me = this;

      var parentID = feature.data.FormattedID;


      var filters = Rally.data.wsapi.Filter.and([
        {property: 'Feature.FormattedID', operator: '=', value: parentID},
        {property: 'Project.State', operator: '!=', value: 'Closed'},
        {property: 'DirectChildrenCount', operator: '=', value: 0}
        ]);

          if (feature.data.LeafStoryCount > 0) {
            var story_config = {
              model: 'HierarchicalRequirement',
              fetch: ['FormattedID',
                      'ObjectID',
                      'Name',
                      'PlanEstimate',
                      'Iteration',
                      'Project',
                      'Feature',
                      'Release',
                      'State',
                      'PlannedVelocity',
                      'DirectChildrenCount',
                      'LeafStoryCount',
                      'LeafStoryPlanEstimateTotal',
                      'StartDate'
              ],
              filters: filters,
              sorters: [{property: 'Project.ObjectID'}],
              context: {
                project: null
              }

            };

            me._loadWsapiRecords(story_config).then({
              scope: this,
              success: function(stories) {
                if (stories.length > 0) {
//me.logger.log("Loaded Stories:",stories);
                  deferred.resolve(me._aggregateIterationData(stories,iterations));
                } else {
                  deferred.resolve([]);
                }
              },
              failure: function(error_message){
                  deferred.reject(error_message);
              }
              }).always(function() {

              });
          }

      return deferred.promise;
    },
*/
    _getAvailability: function(rows) {
        this.setLoading("Updating Team Availability...");
        var me = this;
        var promises = [];
me.logger.log("GA1:",rows);

        Ext.Array.each(rows, function(row) {
//me.logger.log("A row:", row);
          promises.push(function() {
            return me._getAvailabilityforTeam(row);
          });
        });
me.logger.log("Promises:", promises);

        Deft.Chain.sequence(promises, this).then ({
            success: function(row) {
//me.logger.log("GA_sprint_count:", iterations.length,iterations);

me.logger.log("GA2:",row);
            me._displayGrid(row);
          },
          failure: function(error_message){
              alert(error_message);
          }
        });
    },

    _getAvailabilityforTeam: function(row) {
        var deferred = Ext.create("Deft.Deferred");
        var me = this;
//me.logger.log("GA_row in:",row);
        var iteration_config = {
            model: 'Iteration',
            fetch: ['Name','PlannedVelocity','PlanEstimate','Project','EndDate','ObjectID'],
            filters: [
              {property: 'Project.ObjectID', operator: '=', value: row['TeamOID']},
              {property:"StartDate", operator: '<=', value: me.releaseEndISO},
//              {property:"EndDate", operator: '>=', value: me.releaseStartISO}

//              {property: 'StartDate', operator: '<', value: me.releaseEndISO},
//              {property: 'EndDate', operator: '>=', value: me.releaseStartISO}
            ],
              context: {
                project: null
              },
            sorters: [{property:"EndDate", direction:'DESC'}]
        };
//me.logger.log("iteration_config",iteration_config);

        me._loadWsapiRecords(iteration_config).then({
              scope: this,
              success: function(iterations) {
me.logger.log("GA_row mid1:",iterations);
                Ext.Array.each(iterations, function(iteration) {
                  var me = this;
                  var keys = Object.keys(row);
                  for (var i = 0; i < keys.length; i++) {
                    if (iteration.data.Name+"A" == keys[i]) {
                      row[keys[i]] = iteration.data.PlannedVelocity - iteration.data.PlanEstimate;
//                      row["TotalA"] = row["TotalA"] + (iteration.data.PlannedVelocity - iteration.data.PlanEstimate);
//                      row["TotalA"] = row["TotalA"] + row[keys[i]];

                    }
                  }
                });

//me.logger.log("iteration_config:", iteration_config);
                deferred.resolve(row);
              },
              failure: function(error_message){
//me.logger.log("GA_row mid2:",iteration);
                  deferred.reject(error_message);
              }
              }).always(function() {
              });
//me.logger.log("GA_row updated:",row);
      return deferred.promise;
    },

    _aggregateIterationData: function(iterations) {
        this.setLoading("Aggregating data...");

        var me = this;

        var iteration_names = [];
        for (var i = 0;  i < iterations.length; i++) {
          iteration_names.push(iterations[i].data.Name);
        }

        var team_name = 'Unassigned',
            team_oid = null,
            iteration_name = '',
            iteration_PV = 0,     // iteration planned velocity
            iteration_PE = 0,     // iteration plan estimate
            iteration_AP = 0;     // available points = planned velocity - plan estimate;

        var feature_hash = {};
        var row = {"Team": "DUMMY"},
            rows = [],
            columns = [];

        if ( iterations.length === 0 ) { return feature_hash; }
me.logger.log("CA0:",iterations,iterations[0].data.StartDate);

        Ext.Array.each(iterations, function(iteration){

//me.logger.log("CA1:",feature_ID, release_name);

//me.logger.log("CA2:", release_state);

          if (iteration.data.Project.Name == null) {
            team_name = 'Unassigned';
          } else {
            team_name = iteration.data.Project.Name;
            team_oid = iteration.data.Project.ObjectID;
            iteration_name = iteration.data.Name;
            iteration_PV = iteration.data.PlannedVelocity;
            if (iteration.data.PlannedVelocity == null) {
              iteration_PV = 0;
            }
            iteration_PE = iteration.data.PlanEstimate;
            iteration_AP = iteration_PV - iteration_PE;
          }
//me.logger.log("CA4:", story.data.FormattedID,iteration_name,iteration_PV,iteration_PE,iteration_AP);


            if (Ext.isEmpty(feature_hash[team_oid])) {
              if (row.Team != "DUMMY") {rows.push(row);}
              feature_hash[team_oid] = {} ;
              feature_hash[team_oid].Team = team_name;
              feature_hash[team_oid].TeamOID = team_oid;

              row = {
                "Team": team_name,
                "TeamOID": team_oid,
              }
              for (i=0; i<iteration_names.length; i++) {
                row[iteration_names[i]+"A"] = 0;
              }

            }
me.logger.log("CA6:", feature_hash,row);

/*
            if (Ext.isEmpty(feature_hash[feature_ID].teams[team_name].sprints[iteration_name])) {
              feature_hash[feature_ID].teams[team_name].sprints[iteration_name] = [
                planned_points,
                iteration_PV,
                iteration_PE,
                iteration_AP
           ];
                row[iteration_name + "P"] = planned_points;
                row[iteration_name + "A"] = iteration_AP;
//                row["TotalA"] = row["TotalA"] + iteration_AP;
            } else {
              feature_hash[feature_ID].teams[team_name].sprints[iteration_name][0] += story.data.PlanEstimate;
              row[iteration_name + "P"] = row[iteration_name + "P"] + story.data.PlanEstimate;
//              row["TotalA"] = iteration_AP;
            }
            row["TotalP"] = row["TotalP"] + story.data.PlanEstimate;
            row["TotalS"] = row["TotalS"] + 1;
          }
        }
me.logger.log("CA7:", feature_hash,row);
        row["Planned"] = row["UnscheduledP"] + row["PriorP"] + row["TotalP"];
//me.logger.log(row["Planned"], row["UnscheduledP"], row["PriorP"], row["TotalP"]);
*/
        });
        rows.push(row);
this.logger.log("Feature Hash:",feature_hash, rows);
//        return rows;
            me._getAvailability(rows);
    },

    _loadWsapiRecords: function(config) {
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
//this.logger.log("Starting load:",config.model);
        Ext.create('Rally.data.wsapi.Store', config).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
//me.logger.log("Loaded Recs:",records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },

    _displayGrid: function(rows) {
        this.setLoading(false);
        var me = this;
        var gridRows = [];
        this.gridRows = rows;
this.logger.log("Display:",rows);
        var store = Ext.create('Rally.data.custom.Store', {
          data: rows,
          pageSize: rows.length,
//          groupField: 'FormattedID',
//          getGroupString: function(record) {
//          	var Parent = record.get('_ref');
//          	var not_planned = record.get('LSP') - (record.get('UnscheduledP')+record.get('PriorP')+record.get('TotalP'));
//me.logger.log("Display2:",Parent);
//          	return (Parent && record.get('FormattedID') + '--' + record.get('FName') + '- Total Leaf Stories: ' + record.get('LSC') + '- Total Leaf Story Points: ' + record.get('LSP')) || 'No Feature';
//            },

        });

        this.featureGrid = this.down('#display_box').add({
            xtype: 'rallygrid',
            itemId: 'feature_grid',
            store: store,
            showRowActionsColumn: false,
//            features: [{
//                ftype: 'summary',
//                ftype: 'groupingsummary',
//                startCollapsed: true
//            }],
            columnLines: true,
            columnCfgs: this._getColumns(rows)

        });

//this.logger.log(this.gridRows, this.gridRows[0])

    },

    _getColumns: function (rows) {
        if (rows === 'undefined' || rows.length === 0) {
            this.setLoading(false);
            return [];
        }

//this.logger.log("Col0:",rows);
      var iteration_column = {};
      var keys = Object.keys(rows[0]);
      var grid_columns = [
//              {dataIndex: "FormattedID", text: "Feature ID", xtype: 'templatecolumn', tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')}, //
//              {dataIndex: "Release", text: "Release"},
//              {dataIndex: "State", text: "State"},
              {dataIndex: "Team", text: "Team", width: 300},
//              {dataIndex: "Planned", text: "Team Pts. Planned", width: 60, summaryType: 'sum'},
//              {dataIndex: "UnscheduledS", text: "Unsch. Stories", width: 60, summaryType: 'sum'},
//              {dataIndex: "UnscheduledP", text: "Unsch. Points", width: 60, summaryType: 'sum'},
//              {dataIndex: "PriorS", text: "Prev. Stories", width: 60, summaryType: 'sum'},
//              {dataIndex: "PriorP", text: "Prev. Points", width: 60, summaryType: 'sum'},
//              {dataIndex: "TotalS", text: "Planned Stories", width: 60, summaryType: 'sum'},
//              {dataIndex: "TotalP", text: "Planned Points", width: 60, summaryType: 'sum'},
//              {dataIndex: "TotalA", text: "Capacity Available", width: 60, summaryType: 'sum'}
//              {dataIndex: "TotalP", text: "Total Planned", width: 60}
          ];

this.logger.log("Col1:",grid_columns,keys);
          for (var i = 0; i < keys.length; i++) {
            if (keys[i] != "Team" &&
                keys[i] != "TeamOID") {
//this.logger.log("Col2:",keys[i]);
              if (keys[i].charAt(keys[i].length-1) === "A") {
                iteration_column = {dataIndex: keys[i], text: keys[i].slice(0,3) + " Available", width: 60, summaryType: 'sum'};
//                export_columns[keys[i]] = keys[i].slice(0,3) + " Available";
             }
            grid_columns.push(iteration_column);
           }
//this.logger.log("Col3:",iteration_column);
          }
//      this.export_columns = export_columns;
      return grid_columns;
this.logger.log("Col4:",grid_columns);

    },

    _export: function(){
        var file_util = Ext.create('Rally.technicalservices.FileUtilities',{});
        var csv = file_util.convertDataArrayToCSVText(this.gridRows, this.export_columns);
        var export_file_name = this.getContext().getProject().Name + "_" + this.start_rls.getRecord().get('Name') + "_" + this.end_rls.getRecord().get('Name') + ".csv"
        file_util.saveCSVToFile(csv, export_file_name);
    },

    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function() {
        return typeof(this.getAppId()) == 'undefined';
    }

});