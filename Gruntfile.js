'use strict';

/*

Vocabulary :

   - local : local folders are folders of the development test environment or at least the
             environment from wich the command is launched.

   - source : Source folders are folders of the development repository (the SVN repositories), meaning
              the repositories in wich you will make your modifications, commit-them, etc...

   - destination : Destination folders are folders to wich the files (scripts, templates, etc...) will be deployed.

   - deployment : The deployment is done by copying the local files to a destination environment.

Commands :

   grunt [--debug]
   ---------------

      This will deploy all script, stylesheets, templates, etc...
      from the dev repository to the dev environment.
      Mainly, it will empty the "local" folders.



   grunt doc [--debug]
   -------------------

      This will generate the documentation in the doc folder.



   grunt <action> --env=<ENV> [--debug]
   ------------------------------------

      This will make an action for the given environment.

         <ENV> : Name of the enviroment

            Accepted values for <ENV> are :
               - "local" : The local environment
               - "prod"
               - "test"

            Note : You can add other environments just by adding a new value in the "environments" variable.
                   The key of the "environments" variable correspond to the <ENV> value.


            Note that the <ENV> value is case-sensitive.

         <action> : Action to execute

            Accepted values are :
               - deploy
               - copy:<option>

            Action : deploy
               This action will deploy all files from the local folders to the environment folder.
               Destination folders will be cleaned-up first.
               That action will NOT copy the metronic files. You will have to execute copy:metronic to do so.

               Exemple :
                  grunt deploy --env=test

            Action : copy

               Accepted options are :
                  - metronic : Copy the metronic files
                  - media    : Copy the files of the "media" folder

               Exemple :
                  grunt copy:metronic --env=prod
 */

module.exports = function(grunt) {

   var /** @type {string}  */ doc
     , /** @type {boolean} */ debug
     , /** @type {object}  */ dest
     , /** @type {string}  */ environment
     , /** @type {object}  */ environments
     , /** @type {object}  */ local
     , /** @type {object}  */ source;

   debug                    = grunt.option('debug');
   environment              = grunt.option('env');

   // "local" environment is added later : we need the local root path first
   environments             = { dev   : undefined // Development environment
                              , test  : undefined // Test environment
							  , prod  : undefined // Production environment};
							  

   // Documentation
   doc                      = 'doc/';

   // Source
   source                   = { root  : 'client/' };

   source.app               = { root : source.root + 'AdminApp/' };
   source.app.scripts       = source.app.root + 'scripts/'   ;
   source.app.stylesheets   = source.app.root + 'stylesheet/';
   source.app.templates     = source.app.root + 'template/' ;

   source.lib               = {root : source.root + 'AdminLib/'};
   source.lib.scripts       = source.lib.root     + 'scripts/'   ;
   source.lib.stylesheets   = source.lib.root     + 'stylesheet/';
   source.lib.templates     = source.lib.root     + 'template/' ;
   source.lib.librairies    = source.lib.scripts  + 'librairies/';
   source.lib.documentation = source.lib.root     + 'doc/';

   // Local
   local                    = { root : 'server/AdminApp/'};

   local.static             = local.root    + 'static/';
   local.media              = local.root    + 'media/';
   local.metronic           = local.static  + 'metronic/';
   local.scripts            = local.static  + 'script/';
   local.stylesheets        = local.static  + 'stylesheet/';
   local.librairies         = local.scripts + 'librairies/';
   local.templates          = local.static  + 'template/';

   environments.local       = local.static;

   // Destination
   dest                     = { root : environments[environment] };

   if (dest.root) {
      dest.static   = dest.root   + 'static/';
      dest.media    = dest.root   + 'media/';
      dest.metronic = dest.static + 'metronic/';
      dest.script   = dest.static + 'script/';
   }

   if (debug) {
      console.dir('folders : ');

      console.log('Source :');
      console.dir(source);
      console.log('');
      console.log('');

      console.log('Local :');
      console.dir(local);
      console.log('');
      console.log('');

      console.log('Destination :');
      console.dir(dest);
      console.log('');
      console.log('');

   }


   // Project configuration.
   grunt.initConfig({ pkg: grunt.file.readJSON('package.json')
                    , concat :
                         { options :
                            { sourceMap : false }


                         , datatable :
                            // Building the AdminLib.widget.Datatable.js script
                            { src  : [ source.lib.scripts + 'AdminLib.widget.Datatable/Datatable.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/Cell.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/ExtraFieldsRow.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/Field.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/Link.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/Row.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/RowAction.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/RowButton.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/CreationHandler.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/EditModal.js'
                                     , source.lib.scripts + 'AdminLib.widget.Datatable/TableAction.js' ]
                            , dest : local.scripts + 'AdminLib.widget.Datatable.js' }
                         , AdminLib :
                            // Concatanating all lib scripts
                            { src  : [ source.lib.scripts + 'AdminLib.js'
                                     , source.lib.scripts + 'AdminLib.Connection.js'
                                     , source.lib.scripts + 'AdminLib.Error.js'
                                     , source.lib.scripts + 'AdminLib.Link.js'
                                     , source.lib.scripts + 'AdminLib.Namespace.js'
                                     , source.lib.scripts + 'AdminLib.Menu.js'
                                     , source.lib.scripts + 'AdminLib.Model.js'
                                     , source.lib.scripts + 'AdminLib.Page.js'
                                     , source.lib.scripts + 'AdminLib.User.js'
                                     , source.lib.scripts + 'AdminLib.Action.js'
                                     , source.lib.scripts + 'AdminLib.element.Button.js' ]
                            , dest : local.scripts + 'AdminLib.js' }

                         , AdminAppConfig :
                            // Building the app config script
                            { src  : [ source.app.scripts + 'config/menu.js'
                                     , source.app.scripts + 'config/model.js'
                                     , source.app.scripts + 'config/package.js'
                                     , source.app.scripts + 'config/page.js']
                            , dest : local.scripts + 'AdminApp.config.js' } }

                    , copy :
                         { index :
                            { src : source.root + 'index.html'
                            , dest : local.root + 'index.html'}

                         , AdminApp_script :
                            { expand : true
                            , cwd    : source.app.scripts
                            , src    : [ '**/*.*'
                                       , '!config/*.js']
                            , dest   : local.scripts }

                         , AdminLib_script :
                            { expand : true
                            , cwd    : source.lib.scripts
                            , src    : [ '**/*.*'
                                       , '!AdminLib.js'
                                       , '!AdminLib.Namespace.js'
                                       , '!AdminLib.Menu.js'
                                       , '!AdminLib.widget.Datatable'
                                       , '!AdminLib.widget.Datatable/**/*.*']
                            , dest   : local.scripts }

                         , AdminLib_template :
                            { expand : true
                            , cwd    : source.lib.templates
                            , src    : [ '**/*.mustache']
                            , dest   : local.templates }

                         , AdminApp_template :
                            { expand : true
                            , cwd    : source.app.templates
                            , src    : [ '**/*.mustache']
                            , dest   : local.templates }

                         , deploy :
                            { expand : true
                            , cwd    : local.static
                            , src    : [ 'script/**/*.*'
                                       , 'template/*.*'
                                       , 'stylesheet/**/*.*']
                            , dest   : dest.static }

                         , deploy_index :
                            { src  : local.root + 'index.html'
                            , dest : dest.root  + 'index.html' }

                         , metronic :
                            { expand : true
                            , cwd    : local.metronic
                            , src    : '**/*.*'
                            , dest   : dest.metronic }

                         , media :
                            { expand : true
                            , cwd    : local.media
                            , src    : '**/*.*'
                            , dest   : dest.media }
                        }
                    , clean : {
                           local : [ local.stylesheets
                                   , local.scripts
                                   , local.templates]
                         , jsdoc : doc }

                    , sass : {
                           build : { expand : true
                                   , cwd    : source.lib.stylesheets
                                   , src    : [ '*.scss']
                                   , dest   : local.stylesheets
                                   , ext    : '.css'} }

                    , statistiks : {
                           scripts : { src : [ local.scripts + '*.js'
                                             , local.scripts + '**/*.js'
                                             , '!' + local.librairies
                                             , '!' + local.librairies + '*.js'
                                             , '!' + local.librairies + '**/*.js'
                           ]}}

                    , jsdoc : {
                         dist : {
                              src     : [ source.lib.scripts + '*.js'
                                        , source.lib.scripts + '**/*.js'
                                        , source.lib.documentation + '*.jsdoc'
                                        , '!' + source.lib.librairies
                                        , '!' + source.lib.librairies + '*.js'
                                        , '!' + source.lib.librairies + '**/*.js']
                            , jsdoc   : 'jsdoc/'
                            , options : {
                                   destination : doc
                                 , configure   : 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json' }}
      }

   });

   // Load the plugin that provides the "uglify" task.
   grunt.loadNpmTasks('grunt-contrib-copy'  );
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-clean' );
   grunt.loadNpmTasks('grunt-contrib-sass'  );
   grunt.loadNpmTasks('grunt-jsdoc'         );
   grunt.loadNpmTasks('grunt-statistiks'    );

   // Default task(s).
   grunt.registerTask('copyAll', ['copy:index', 'copy:AdminApp_script', 'copy:AdminLib_script', 'copy:AdminLib_template', 'copy:AdminApp_template']);
   grunt.registerTask('default', ['clean:local', 'concat', 'copyAll', 'sass', 'statistiks']);

   grunt.registerTask('deploy', ['copy:deploy', 'copy:media', 'copy:deploy_index']);

   grunt.registerTask('doc', ['clean:jsdoc', 'jsdoc']);

   var now;

   now = new Date();

   console.log('Task executed at : ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds());
};