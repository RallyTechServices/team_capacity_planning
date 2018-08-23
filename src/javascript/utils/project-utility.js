Ext.define('CA.agile.technicalservices.util.ProjectUtility',{

    mixins: {
        observable: 'Ext.util.Observable'
    },

    constructor: function(config){

        this.mixins.observable.constructor.call(this, config);

        this._fetchProjectsInWorkspace().then({
            success: this._buildProjectHash,
            failure: this._alertFailure,
            scope: this
        });
    },
    getProjectsInHierarchy: function(projectID){
        var projects = [projectID];
        var children = this._getProjectChildren(projectID);
        return projects.concat(children);
    },
    getProjectRoot: function(projectID){
        return this.projectHash[projectID];
    },
    getProjectName: function(projectID){
        return this.projectHash[projectID].Name;
    },
    _getProjectChildren: function(projectID){
        var childObjects = this.projectHash[projectID] && this.projectHash[projectID].children || [],
            children = Ext.Array.map(childObjects, function(co){ return co.ObjectID; });

        Ext.Array.each(children, function(c){
            var grandchildren = this._getProjectChildren(c);
            children = children.concat(grandchildren);
        }, this);
        return children;
    },
    _alertFailure: function(msg){
        this.fireEvent('fetcherror', msg);
    },
    _fetchProjectsInWorkspace: function(){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store',{
            model: 'Project',
            fetch: ['ObjectID','Name','Parent','Workspace'],
            limit: Infinity,
           // context: {workspace: workspaceRef, project: null},
            compact: false,
            filters: [{
                property: 'State',
                value: 'Open'
            }],
            sorters: [{
                property: 'ObjectID',
                direction: 'ASC'
            }]
        }).load({
            callback: function(records, operation){
                if (operation.wasSuccessful()){
                    deferred.resolve(records);
                } else {
                    deferred.reject("Error loading project structure: " + operation.error.errors.join(','));
                }
            },
            scope: this
        });
        return deferred.promise;
    },
    _buildProjectHash: function(records){
        var hash = {},
            rootProjects = [];

        Ext.Array.each(records, function(r){
            hash[r.get('ObjectID')] = r.getData();
            hash[r.get('ObjectID')].children = [];
        });

        Ext.Object.each(hash, function(oid, projectData){
            projectData.__projectHierarchy = this._buildProjectHierarchy(oid,hash);
            var parentID = projectData.Parent && projectData.Parent.ObjectID || null;

            if (!parentID || !hash[parentID]){
                rootProjects.push(projectData);
            } else {
                var parentModel = hash[parentID];
                parentModel.children.push(projectData);
            }
        }, this);
        this.projectHash = hash;
        this.rootProjects = rootProjects;

        this.fireEvent('ready');
    },
    _buildProjectHierarchy: function(projectID, projectHash){
        var parent = projectHash[projectID].Parent && projectHash[projectID].Parent.ObjectID || null;

        var projectHierarchy = [projectID];
        if (parent){
            do {
                projectHierarchy.unshift(parent);
                parent = projectHash[parent] &&
                    projectHash[parent].Parent &&
                    projectHash[parent].Parent.ObjectID || null;

            } while (parent);
        }
        return projectHierarchy;

    }
});