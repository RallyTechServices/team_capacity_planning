Ext.define('CA.agile.technicalservices.template.ToggleYesNo', {
    extend: 'Ext.XTemplate',

    statics: {
        DISABLED_CLS: 'toggle-button-disabled'
    },

    constructor: function(config) {
        this.callParent([
            '<tpl>',
            '<div class="toggle-button-template toggle-button-{[this.getState(values)]} {[this.getDisabledCls()]}">',
            '<div class="toggle-button-handle"></div>',
            '<div class="toggle-button-text">{[this.getText(values)]}</div>',
            '</div>',
            '</tpl>',
            {
                getState: function(values) {
                    return values ? 'on' : 'off';
                },
                getText: function(values){
                    return values ? '' : '';
                },
                getDisabledCls: function() {
                    return config && config.disabled ? this.self.DISABLED_CLS : '';
                }
            }
        ]);
    }
});