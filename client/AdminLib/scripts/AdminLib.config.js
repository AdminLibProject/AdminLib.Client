'use strict';

/** Configuration file of application */

// Repository : Metronic
(function() {

   var /** @type {AdminLib.Repository} */ repository;

   repository = new AdminLib.Repository("Metronic");

   repository.addPackage ( 'metronic.login'
                         , { scripts     : [AdminLib.METRONIC_ROOT + '/assets/admin/pages/scripts/login-soft.js']
                           , stylesheets : [AdminLib.METRONIC_ROOT + '/assets/admin/pages/css/login-soft.css']
                           , then : function() {
                              AdminLib.metronic.login = Login;
                           }});

   repository.save();

})();

// Repository : Metronic.librairies
(function() {

   var /** @type {AdminLib.Repository} */ repository;

   repository = new AdminLib.Repository('Metronic.librairies');

   // backstretch
   repository.addPackage ( 'backstretch'
                         , { packages: ['jQuery']
                           , scripts : [AdminLib.METRONIC_ROOT + '/assets/global/plugins/backstretch/jquery.backstretch.min.js']});


   // bootbox
   repository.addPackage ( 'bootbox'
                         , { packages: ['bootstrap']
                           , scripts : [AdminLib.METRONIC_ROOT + '/assets/global/plugins/bootbox/bootbox.min.js']});

   // bootstrap
   repository.addPackage('bootstrap', {}); // Bootstrap is preloaded in the index.html file

   // bootstrap.modal
      // Homepage : https://github.com/jschr/bootstrap-modal
   repository.addPackage ( 'bootstrap.modal'
                         , { packages: ['bootstrap']
                           , scripts : [ AdminLib.METRONIC_ROOT + '/assets/global/plugins/bootstrap-modal/js/bootstrap-modalmanager.js'
                                       , AdminLib.METRONIC_ROOT + '/assets/global/plugins/bootstrap-modal/js/bootstrap-modal.js']
                           , then    : function () {
                              // general settings
                              $.fn.modal.defaults.spinner = $.fn.modalmanager.defaults.spinner =
                                 '<div class="loading-spinner" style="width: 200px; margin-left: -100px;">' +
                                 '<div class="progress progress-striped active">' +
                                 '<div class="progress-bar" style="width: 100%;"></div>' +
                                 '</div>' +
                                 '</div>';

                              $.fn.modalmanager.defaults.resize = true;
                           }});

   // boostrap.toastr
   repository.addPackage ( 'bootstrap.toastr'
                         , { packages   : ['jQuery']
                           , scripts    : [ AdminLib.METRONIC_ROOT + '/assets/global/plugins/bootstrap-toastr/toastr.min.js'
                                          , AdminLib.METRONIC_ROOT + '/assets/admin/pages/scripts/ui-toastr.js']
                           , stylesheets: [AdminLib.METRONIC_ROOT + '/assets/global/plugins/bootstrap-toastr/toastr.min.css']});

   // metronic.datatable
   repository.addPackage ( 'metronic.datatable'
                         , { scripts    : [AdminLib.METRONIC_ROOT + '/assets/global/scripts/datatable.js']
                           , then       : function () {
                                 AdminLib.metronic.Datatable = Datatable;
                              }});

   // pace : http://github.hubspot.com/pace/docs/welcome/
   repository.addPackage ( 'pace'
                         , { scripts    : [AdminLib.METRONIC_ROOT + '/assets/global/plugins/pace/pace.min.js']
                           , stylesheets: [AdminLib.METRONIC_ROOT + '/assets/global/plugins/pace/themes/pace-theme-flash.css']});

   // select2
   repository.addPackage ( 'select2'
                         , { packages      : ['jQuery']
                           , scripts    : [/*AdminLib.METRONIC_ROOT + '/assets/global/plugins/select2/select2.min.js'*/]
                           , stylesheets: [AdminLib.METRONIC_ROOT + '/assets/global/plugins/select2/select2.css']});

   repository.save();

})();

// Repository : AdminLib.librairies
(function() {

   var /** @type {AdminLib.Repository} */ repository;

   repository = new AdminLib.Repository('AdminLib.librairies');

   // codeMirror
   repository.addPackage ( 'codeMirror'
                         , { scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/codemirror.js']
                           , stylesheets : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/codemirror.css']});

   // codeMirror.css
   repository.addPackage ( 'codeMirror.css'
                         , { packages    : ['codeMirror']
                           , scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/mode/css.js'] });

   // codeMirror.htmlmixed
   repository.addPackage ( 'codeMirror.htmlmixed'
                         , { packages    : ['codeMirror']
                           , scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/mode/htmlmixed.js'] });

   // codeMirror.javascript
   repository.addPackage ( 'codeMirror.javascript'
                         , { packages    : ['codeMirror']
                           , scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/mode/javascript.js'] });

   // codeMirror.sass
   repository.addPackage ( 'codeMirror.sass'
                         , { packages    : ['codeMirror']
                           , scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/mode/sass.js'] });

   // codeMirror.sql
   repository.addPackage ( 'codeMirror.sql'
                         , { packages    : ['codeMirror']
                         ,   scripts     : [AdminLib.LIBRAIRY_ROOT + '/codeMirror/mode/sql.js'] });

   // datatable
   //    http://datatables.net/download/index
   //    Contains pluggins :
   //       - no jquery
   //       - Styling : Datatable
   //       - Buttons :
   //          -  Column visibility
   //          -  HTML5 Export
   //             - JSZip
   //             -  PDF Make
   //             -  Print view
   //       -  ColReorder
   //       -  FixedColumns
   //       -  FixedHeader
   //       -  KeyTable
   //       -  Responsive
   //       -  Scroller
   // Download Javascript : https://cdn.datatables.net/s/bs-3.3.5/jszip-2.5.0,pdfmake-0.1.18,dt-1.10.10,b-1.1.0,b-colvis-1.1.0,b-html5-1.1.0,b-print-1.1.0,cr-1.3.0,fc-3.2.0,fh-3.1.0,kt-2.1.0,r-2.0.0,sc-1.4.0/datatables.min.js
   // Download Stylesheet : https://cdn.datatables.net/s/bs-3.3.5/jszip-2.5.0,pdfmake-0.1.18,dt-1.10.10,b-1.1.0,b-colvis-1.1.0,b-html5-1.1.0,b-print-1.1.0,cr-1.3.0,fc-3.2.0,fh-3.1.0,kt-2.1.0,r-2.0.0,sc-1.4.0/datatables.min.css
   repository.addPackage ( 'datatable'
                         , { packages   : ['bootbox', 'bootstrap.toastr', 'metronic.datatable']
                           , scripts    : [] // Loading in the index.html file
                           , stylesheets: [] }); // Stylesheet is loaded inside the index.html file : it must be loaded before components.css

   // datatable.colReorderWithResize
   repository.addPackage ( 'datatable.colReorderWithResize'
                         , { packages   : ['datatable']
                           , scripts    : [AdminLib.LIBRAIRY_ROOT + '/datatable.ColReorderWithResize/js/ColReorderWithResize.js']
                           , stylesheets: [AdminLib.LIBRAIRY_ROOT + '/datatable.ColReorderWithResize/css/ColReorder.css']});

   // librairy.store
   repository.addPackage ( 'librairy.store'
                         , {scripts: [AdminLib.LIBRAIRY_ROOT + '/store/store.min.js']});

   // jQuery
   repository.addPackage ( 'jQuery'
                         , {});

   // ES6-Polyfills
   repository.addPackage ( 'polyfill.es6'
                         , { packages : ['polyfill.es6.collection']});

   repository.addPackage ( 'polyfill.es6.collection'
                         , { script : [AdminLib.LIBRAIRY_ROOT + '/es6-collections.js']});

   // jQuery.resizableColumns
   repository.addPackage ( 'jQuery.resizableColumns'
                         , { packages   : ['jQuery']
                           , scripts    : [AdminLib.LIBRAIRY_ROOT + '/jquery.resizableColumns/jquery.resizableColumns.min.js']
                           , stylesheets: [AdminLib.LIBRAIRY_ROOT + '/jquery.resizableColumns/jquery.resizableColumns.css']});

   //jQuery validation
   repository.addPackage ( 'jQuery validation'
                         , { packages  : ['jQuery']
                           , scripts: [AdminLib.METRONIC_ROOT + '/assets/global/plugins/jquery-validation/js/jquery.validate.min.js']});

   //jQuery sortable
   repository.addPackage ( 'jQuery.sortable'
                         , { packages  : ['jQuery']
                           , scripts: [AdminLib.LIBRAIRY_ROOT + '/jquery-sortable.js']});

   // Moment
   repository.addPackage ( 'moment'
                         , { scripts : [AdminLib.LIBRAIRY_ROOT + '/moment.js']});

   // RequireJS
   repository.addPackage ( 'require'
                         , { scripts : [AdminLib.LIBRAIRY_ROOT + '/require.js']});

   repository.save();
})();

// Repository : AdminLib
(function() {

   var /** @type {AdminLib.Repository} */ repository;

   repository = new AdminLib.Repository ( 'AdminLib'
                                       , { templateFolder   : AdminLib.LIB_ROOT + '/template'
                                         , stylesheetFolder : AdminLib.LIB_ROOT + '/stylesheet'
                                         , scriptFolder     : AdminLib.SCRIPT_ROOT });

   // AdminLib
   repository.addPackage ( 'AdminLib'
                         , { packages : ['pace', 'AdminLib.core', 'AdminLib.module', 'AdminLib.librairies', 'AdminLib.widgets', 'AdminLib.debug'] });

   // AdminLib.core
   repository.addPackage ( 'AdminLib.core'
                         , { packages : [ 'AdminLib.StandardPage', 'AdminLib.Field']
                           , scripts  : [ 'AdminLib.Module.js'] });

   // AdminLib.Field
   repository.addPackage ( 'AdminLib.Field'
                         , { scripts  : [ 'AdminLib.Field.js'] });

   // AdminLib.librairies
   repository.addPackage ( 'AdminLib.librairies'
                         , { packages : [ 'polyfill.es6', 'bootstrap.modal', 'datatable', 'widget.Tabs', 'moment'] });

   // AdminLib.module
   repository.addPackage ( 'AdminLib.module'
                         , { packages : [ 'AdminLib.module.MasterDetail'
                                        , 'AdminLib.module.Section']
                           , scripts  : [ 'AdminLib.debug.js' ] });

   // AdminLib.debug
   repository.addPackage ( 'AdminLib.debug'
                         , { packages : ['bootstrap.modal']
                           , scripts  : [ 'AdminLib.debug.js' ] });

   // AdminLib.module.MasterDetail
   repository.addPackage ( 'AdminLib.module.MasterDetail'
                         , { packages  : [ 'AdminLib.widget.Datatable', 'AdminLib.module.Section']
                           , scripts   : [ 'AdminLib.Model.Handler.js' ]
                           , templates : [ 'MasterDetailSearchScreen']});

   // AdminLib.module.Section
   repository.addPackage ( 'AdminLib.module.Section'
                         , { packages   : [ 'AdminLib.core']
                           , scripts    : [ 'AdminLib.module.Section.js' ]});

   // AdminLib.StandardPage
   repository.addPackage ( 'AdminLib.StandardPage'
                         , { scripts   : ['AdminLib.StandardPage.js']
                           , templates : ['standardPage']});

   // AdminLib.widget
   repository.addPackage ( 'AdminLib.widgets'
                         , { packages : [ 'AdminLib.widget.Datatable'
                                        , 'AdminLib.widget.Dropdown'
                                        , 'AdminLib.widget.ListBox'
                                        , 'AdminLib.widget.Modal'
                                        , 'AdminLib.widget.Modal.Datatable'
                                        , 'AdminLib.widget.Portlet'
                                        , 'AdminLib.widget.Portlet.CodeEditor'
                                        , 'AdminLib.widget.Portlet.Datatable'
                                        , 'AdminLib.widget.Portlet.Editable'
                                        , 'AdminLib.widget.Form']});

   // AdminLib.widget.Datatable
   repository.addPackage ( 'AdminLib.widget.Datatable'
                         , { packages  : [ 'AdminLib.Field', 'datatable', /*'datatable.colReorder',*/ 'bootstrap.toastr', 'bootstrap.modal', 'jQuery.resizableColumns']
                           , scripts   : [ 'AdminLib.widget.Datatable.js']
                           , templates : [ 'datatable.modal.validation']
                           , then      :
                                          function() {
                                             AdminLib.widget.Datatable.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.CreationHandler.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.ExtraFieldsRow.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.Field.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.Row.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.RowAction.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.RowButton.mergeOnFirstLaunch();
                                             AdminLib.widget.Datatable.TableAction.mergeOnFirstLaunch();

                                             delete(AdminLib.widget.Datatable.mergeOnFirstLaunch                );
                                             delete(AdminLib.widget.Datatable.CreationHandler.mergeOnFirstLaunch);
                                             delete(AdminLib.widget.Datatable.ExtraFieldsRow.mergeOnFirstLaunch );
                                             delete(AdminLib.widget.Datatable.Field.mergeOnFirstLaunch          );
                                             delete(AdminLib.widget.Datatable.Row.mergeOnFirstLaunch            );
                                             delete(AdminLib.widget.Datatable.RowAction.mergeOnFirstLaunch      );
                                             delete(AdminLib.widget.Datatable.RowButton.mergeOnFirstLaunch      );
                                             delete(AdminLib.widget.Datatable.TableAction.mergeOnFirstLaunch    );
                                          }});

   // AdminLib.widget.Form
   repository.addPackage ( 'AdminLib.widget.Form'
                         , { packages : [ 'jQuery.sortable']
                           , scripts  : [ 'AdminLib.widget.Form.js'] });

   // AdminLib.widget.ListBox
   repository.addPackage ( 'AdminLib.widget.Dropdown'
                         , { scripts   : [ 'AdminLib.widget.Dropdown.js'] });

   // AdminLib.widget.ListBox
   repository.addPackage ( 'AdminLib.widget.ListBox'
                         , { scripts   : [ 'AdminLib.widget.ListBox.js'] });

   // AdminLib.widget.Modal
   repository.addPackage ( 'AdminLib.widget.Modal'
                         , { packages  : [ 'bootstrap.modal']
                           , scripts   : [ 'AdminLib.widget.Modal.js']
                           , templates : [ 'widget.modal']});

   // AdminLib.widget.Modal.Datatable
   repository.addPackage ( 'AdminLib.widget.Modal.Datatable'
                         , { packages  : [ 'AdminLib.widget.Modal', 'AdminLib.widget.Datatable']
                           , scripts   : [ 'AdminLib.widget.Modal.Datatable.js'] });

   // AdminLib.widget.Portlet
   repository.addPackage ( 'AdminLib.widget.Portlet'
                         , { scripts   : [ 'AdminLib.widget.Portlet.js']
                           , templates : [ 'portlet']});

   // AdminLib.widget.Portlet.CodeEditor
   repository.addPackage ( 'AdminLib.widget.Portlet.CodeEditor'
                         , { packages  : [ 'AdminLib.widget.Portlet.Editable']
                           , scripts   : [ 'AdminLib.widget.Portlet.CodeEditor.js']});

   // AdminLib.widget.Portlet.CodeEditor
   repository.addPackage ( 'AdminLib.widget.Portlet.Datatable'
                         , { packages  : [ 'AdminLib.widget.Portlet'
                                         , 'AdminLib.widget.Datatable']
                           , scripts   : [ 'AdminLib.widget.Portlet.Datatable.js']});

   // AdminLib.widget.Portlet.Editable
   repository.addPackage ( 'AdminLib.widget.Portlet.Editable'
                         , { packages  : [ 'AdminLib.widget.Portlet']
                           , scripts   : [ 'AdminLib.widget.Portlet.Editable.js']});


   // AdminLib.widget.Modal.Datatable
   repository.addPackage ( 'AdminLib.widget.SelectDatatable'
                         , { packages  : [ 'AdminLib.widget.Modal.Datatable']
                           , scripts   : [ 'AdminLib.widget.SelectDatatable.js'] });

   // widget.Tabs
   repository.addPackage ( 'widget.Tabs'
                         , { scripts   : [ 'AdminLib.widget.Tabs.js'] });

   repository.save();

})();