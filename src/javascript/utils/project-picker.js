Ext.define('CA.agile.technicalservices.utils.ProjectModel',{
    extend: 'Ext.data.TreeModel',

    fields: [
        {name: 'Name',  type: 'string'},
        {name: 'ObjectID',   type: 'int'},
        {name: 'Path', type: 'string'},
        {name: '_ref', type: 'string'},
        {name: 'Parent', type: 'auto'},
        {name: '__include', type: 'boolean', defaultValue: false}
    ]
});


Ext.define('CA.agile.technicalservices.util.dialog.ProjectPicker', {
    extend:'Rally.ui.dialog.Dialog',

    //  cls: 'field-picker-btn secondary rly-small',
    title: 'Select Projects',
    autoShow: true,
    draggable: true,
    width: 800,
    closable: true,
    layout: 'fit',
    items: [],

    beforeRender: function() {
        this.callParent(arguments);
        var me = this;

        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    itemId: 'doneButton',
                    text: 'Done',
                    cls: 'primary rly-small',
                    userAction: 'clicked apply in dialog',
                    handler: function() {
                        me.fireEvent('projectsselected', me, me.selectedCache || {});
                        me.close();
                        me.destroy();
                    },
                    scope: this
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary rly-small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });


        var root =  (JSON.parse(JSON.stringify(this.projectRoot)));

        var store = Ext.create('Ext.data.TreeStore', {
            root: {
                children: root,
                expanded: false
            },
            model: 'CA.agile.technicalservices.utils.ProjectModel'
        });

        this.projectGrid= Ext.create('Ext.tree.Panel',{
            workspace: null,
            cls: 'rally-grid',
            rootVisible: false,
            columns: this._getColumnCfgs(),
            itemId: 'project-grid',
            listeners: {
                cellclick: this.updateToggles,
                scope: this
            },
            store: store,
            autoScroll: true
        });
        this.add(this.projectGrid);
    },

    updateToggles: function(view, cell, cellIndex,record){
        var clickedDataIndex = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex;
        var value = record.get(clickedDataIndex);
        var oid = record.get('ObjectID');

        if (clickedDataIndex === '__include'){
            record.set('__include',!value);
            this.updateRecordChildrenField(record, !value, '__include');
            this.updateCache(clickedDataIndex, oid, !value);
            record.expand(true);
        }
    },
    updateRecordChildrenField: function(record, value, fieldName){
        var children = record.childNodes || [];
        Ext.Array.each(children, function(child){
            child.set(fieldName, value);
            this.updateCache(fieldName, child.get('ObjectID'), value);
            this.updateRecordChildrenField(child, value, '__include');
        }, this);
    },
    updateCache: function(fieldName, oid, booleanFlag){
        if (!this.selectedCache){
            this.selectedCache = {};
        }

        //First remove from all caches
        Ext.Object.each(this.selectedCache, function(f,cache){
            var idx = _.indexOf(cache, oid)
            if (idx >= 0){
                cache.splice(idx, 1);
            }
        });

        if (booleanFlag){
            if (!this.selectedCache[fieldName]){
                this.selectedCache[fieldName] = [];
            }
            this.selectedCache[fieldName].push(oid);
        }

    },
    _getColumnCfgs: function(){

        var columns = [{
            text: 'Include',
            dataIndex: '__include',
            align: 'center',
            renderer: function (v, m, r) {
                var tpl = Ext.create('CA.agile.technicalservices.template.ToggleYesNo');
                return tpl.apply(v);
            }
        },{
            xtype: 'treecolumn',
            text: 'Project',
            menuDisabled: true,
            dataIndex: 'Name',
            flex: 1
        }];

        return columns;
    },
    destroy: function(){
        if (this.projectGrid){
            this.projectGrid.destroy();
        }
        this.callParent(arguments);
    }
});