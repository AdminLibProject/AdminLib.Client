'use strict';

/**
 * @typedef {Object} BreadcrumbParameter
 * @property {string} [icon]  Class corresponding to the icon of the bread crumb.
 * @property {string} label
 * @property {string} url
 * @property {function(Event)} handler Function to execute when the breadcrumb is clicked
 */

AdminLib.StandardPage                             = (function() {

   /**
    * @typedef {Object} MenuEntry
    *
    * @property {string}          id       ID of the menu entry. Should be unique among all entries of the menu (not only the current group)
    * @property {string}          icon
    * @property {string}          label
    * @property {string}          page
    * @property {MenuEntry[]}     entries
    * @property {function(Event)} handler
    * @property {string}          target
    *
    */

   /** @typedef {Object} PageParameters
    *
    * @property {Array.<BreadcrumbParameter>} breadcrumbs
    * @property {ContentHandler}              contentHandler
    * @property {HTMLElement}                 main
    * @property {SideBarHandler}              sideBarHandler
    * @property {string}                      subtitle
    * @property {TabBarHandler}               tabBarHandler
    * @property {TopBarHandler}               topBarHandler
    * @property {string}                      title
    */
   function StandardPage() {
      this.components     = {};
      this.builded        = false;
      this.sidebarHandler = new SideBarHandler();
      this.tabBarHandler  = new TabBarHandler(this);
      this.contentHandler = new ContentHandler();
      this.topBarHandler  = new TopBarHandler();

      this.addToMain      = this.addToMain.bind(this);
   }

   /**
    *
    * @param {string} menuID
    */
   StandardPage.prototype.activateMenu           = function activateMenu(menuID) {
      this.sidebarHandler.activate(menuID);
   };

   /**
    *
    * @param {string} code
    */
   StandardPage.prototype.activateTab            = function(code) {
      this.tabBarHandler.activate(code);
   };

   /**
    *
    * @param {TabInformations} tab
    * @returns {AdminLib.StandardPage.Tab}
    */
   StandardPage.prototype.addTab                 = function(tab) {
      return this.tabBarHandler.addTab(tab);
   };

   /**
    *
    * @param {HTMLElement|AdminLib.Portlet|AdminLib.widget.TabBar|AdminLib.widget.Datatable} main
    * @param {boolean} [prepend=false] If true, then the dom will be added as the first element of the main
    * @public
    */
   StandardPage.prototype.addToMain              = function addToMain(main, prepend) {
      this.contentHandler.addToMain(main, prepend);
   };

   /**
    *
    * @param parameters
    * @param rebuild
    * @public
    */
   StandardPage.prototype.display                = function display(parameters, rebuild) {

      var /** @type {HTMLBodyElement} */ body
        , /** @type {string}          */ htmlString;

      body = document.querySelector('body');
      body.classList.add('page-header-fixed');
      body.classList.add('page-quick-sidebar-over-content');

      htmlString = Mustache.render(AdminLib.getTemplate('standardPage'));

      body.innerHTML = htmlString;

      this.contentHandler.init(body);
      this.sidebarHandler.init(body);
      this.topBarHandler.init(body);

      this.mainDOM = body.querySelector('main');

      Layout.init();
   };

   StandardPage.prototype.dispose                = function dispose() {
      this.contentHandler.dispose();
      this.sidebarHandler.dispose();
      this.tabBarHandler.dispose();
      this.topBarHandler.dispose();
   };

   /**
    *
    * @returns {HTMLElement}
    * @public
    */
   StandardPage.prototype.getMainDOM             = function getMainDOM() {
      return this.mainDOM;
   };

   StandardPage.prototype.getTab                 = function getTab(code) {
      return this.tabBarHandler.getTab(code);
   };

   /**
    * Empty the main element page.
    */
   StandardPage.prototype.emptyMain              = function emptyMain() {
      return this.contentHandler.emptyMain();
   };

   /**
    * Display the loading page.
    */
   StandardPage.prototype.loading                = function loading() {

   };

   StandardPage.prototype.refreshTopBar          = function refreshTopMenu() {
      if (!this.topBarHandler.initialized)
         return;

      return this.topBarHandler.refresh();
   };

   StandardPage.prototype.removeAllTabs          = function disableTabMode() {
      this.tabBarHandler.disable();
   };

   /**
    *
    * @param {string} [title]
    * @param {string} [subtitle]
    */
   StandardPage.prototype.setTitle               = function setTitle(title, subtitle) {
      this.contentHandler.setTitle(title, subtitle);
   };

   /**
    *
    * @param {string} subtitle
    */
   StandardPage.prototype.setSubtitle            = function(subtitle) {
      this.contentHandler.setSubtitle(subtitle);
   };

   /**
    *
    * @param {BreadCrumbParameter[]} breadCrumbs
    */
   StandardPage.prototype.updateBreadCrumb       = function updateBreadCrumb(breadCrumbs) {
      this.contentHandler.updateBreadCrumb(breadCrumbs);
   };

   var ContentHandler = (function() {

      /**
       *
       * @param {ContentHandler} contentHandler
       * @returns {HTMLElement}
       */
      function buildTitleDOM(contentHandler) {
         return AdminLib.dom.build(templateTitle, contentHandler);
      };

      /**
       *
       * @constructor
       * @property {HTMLElement}      contentDOM
       * @property {HTMLElement}      mainWrapper
       * @property {string|undefined} subtitle      Subtitle of the page
       * @property {string|undefined} title         Title of the page
       * @property {HTMLListElement}  breadCrumbDOM
       */
      function ContentHandler() {
         this.title    = undefined;
         this.subtitle = undefined;
         this.initialized = false;
      }

      /**
       * Add the given element to the main wrapper
       * @param {HTMLElement} dom
       * @param {boolean}     [prepend=false]
       */
      ContentHandler.prototype.addToMain         = function(dom, prepend) {

         prepend = AdminLib.coalesce(prepend, false);

         dom = AdminLib.getDOM(dom);

         if (dom instanceof Promise) {
            dom.then(function(dom) {
               this.addToMain(dom, prepend);
            }.bind(this));

            return;
         }

         if (prepend)
            this.mainDOM.insertBefore(dom, this.mainDOM.firstChild);
         else // append
            this.mainDOM.appendChild(dom);
      };

      ContentHandler.prototype.dispose           = function() {
         this.breadCrumbDOM = undefined;
         this.contentDOM    = undefined;
         this.mainDOM       = undefined;
         this.subtitle      = undefined;
         this.title         = undefined;
         this.initialized   = false;
      };

      /**
       * Empty the main DOM
       */
      ContentHandler.prototype.emptyMain         = function() {

         if (!this.initialized)
            return;

         AdminLib.dom.empty(this.mainDOM);
      };

      /**
       *
       * @param {HTMLElement} dom
       */
      ContentHandler.prototype.init              = function(dom) {
         this.contentDOM    = dom.querySelector('.page-content-wrapper');
         this.mainDOM       = this.contentDOM.querySelector('main');
         //noinspection JSValidateTypes
         this.breadCrumbDOM = this.contentDOM.querySelector('.page-bar ul.page-breadcrumb');
         this.initialized   = true;
      };

      /**
       * Return the title DOM
       * @returns {HTMLElement}
       */
      ContentHandler.prototype.getPageTitleDOM   = function() {
         return this.querySelector('.page-title');
      };

      /**
       * Apply the queryselector function on the content DOM.
       * @param {string} path
       * @returns {HTMLElement}
       */
      ContentHandler.prototype.querySelector     = function(path) {
         return this.contentDOM.querySelector(path);
      };

      /**
       *
       * @param {HTMLElement} dom
       */
      ContentHandler.prototype.removeFromMain    = function(dom) {
         this.mainDOM.removeChild(dom);
      };

      /**
       * Define the subtitle of the page
       * @param {string} subtitle
       */
      ContentHandler.prototype.setSubtitle       = function(subtitle) {
         this.setTitle(undefined, subtitle);
      };

      /**
       * Define the title and subtitle of the page
       * @param {string} [title]
       * @param {string} [subtitle]
       */
      ContentHandler.prototype.setTitle          = function(title, subtitle) {
         var /** @type {HTMLElement} */ dom
           , /** @type {HTMLElement} */ pageTitleDOM;

         this.title    = title    === undefined ? this.title    : title;
         this.subtitle = subtitle === undefined ? this.subtitle : subtitle;

         dom          = buildTitleDOM(this);
         pageTitleDOM = this.getPageTitleDOM();
         pageTitleDOM.parentElement.replaceChild(dom, pageTitleDOM);
      };

      /**
       *
       * @param {BreadcrumbParameter[]} breadCrumbs
       */
      ContentHandler.prototype.updateBreadCrumb  = function updateBreadCrumb(breadCrumbs) {

         var /** @type {HTMLElement}     */ angleDOM
           , /** @type {number}          */ b
           , /** @type {HTMLListElement} */ dom;

         //noinspection JSValidateTypes
         dom = AdminLib.dom.build(templateBreadcrumbs, breadCrumbs);
         // Replacing the old bread crumb
         this.breadCrumbDOM.parentElement.replaceChild(dom, this.breadCrumbDOM);

         //noinspection JSValidateTypes
         this.breadCrumbDOM = dom;

         for(b in breadCrumbs) {
            dom = AdminLib.dom.build(templateBreadCrumb, breadCrumbs[b]);

            if (breadCrumbs[b].handler !== undefined)
               dom.querySelector('a').addEventListener('click', function(event) {
                  event.preventDefault();
                  this.handler(event);
               }.bind(breadCrumbs[b]));

            this.breadCrumbDOM.appendChild(dom);

            // If we are not the the last breadcrumb, we add the angle icon
            if (parseInt(b) !== breadCrumbs.length - 1) {
               angleDOM = AdminLib.dom.build(templateBreadCrumbAngle);
               dom.appendChild(angleDOM);
            }

         }

      };

      var templateBreadCrumbAngle =
         '<i class="fa fa-angle-right"></i>';

      var templateBreadCrumb =
            '<li>'
         +		'{{#icon}}<i class="{{icon}}"></i>{{/icon}}'
         +	   '{{#url}}<a href="{{url}}">{{label}}</a>{{/url}}'
         +     '{{^url}}{{label}}{{/url}}'
         +	'</li>';

      var templateBreadcrumbs =
            '<ul class="page-breadcrumb">'
         +     '<li>'
         +        '<i class="fa fa-home"></i>'
         +        '<a href="index.html">Home</a>'
         +        '<i class="fa fa-angle-right"></i>'
         +     '</li>'
         +  '</ul>';

      var templateTitle =
            '<h3 class="page-title firstLetterUppercase">'
         +     '{{{title}}} '
         +     '<small class="firstLetterUppercase">'
         +        ' {{subtitle}}'
         +     '</small>'
         +  '</h3>';

      return ContentHandler;
   })();

   var SideBarHandler = (function() {

      /**
       * Handle the side bar frame
       * @constructor
       *
       * @property {HTMLElement}  menuDOM
       */
      function SideBarHandler() {
         this.menuDOM = undefined;
      }


      /**
       * Empty the side bar handler object.
       * The function don't alter the dom.
       * @private
       */
      SideBarHandler.prototype.dispose           = function() {
         this.menuDOM = undefined;
      };

      /**
       * Initialize the menu
       * @param {HTMLElement} dom
       * @private
       */
      SideBarHandler.prototype.init              = function(dom) {
         var /** @type {number}      */ m
           , /** @type {HTMLElement} */ entryDOM
           , /** @type {Object}      */ menuEntry;

         this.menuDOM  = dom.querySelector('.page-sidebar-menu');

         this.menu = AdminLib.menu.get();
         this.menu.display();
      };

      /**
       *
       * @returns {HTMLElement}
       * @public
       */
      SideBarHandler.prototype.getDOM             = function () {
         return this.menuDOM;
      };

      // This is the Metronic menu. It's not used but it's here for demonstration
      var metronicMenu = [

           { class   : 'start'
           , icon    : 'icon-home'
           , title   : 'Dashboard'
           , entries : [ { page : 'index.html'                         , icon : 'icon-bar-chart', title:'Default Dashboard'}
                       , { page : 'index_2.html'                       , icon : 'icon-bulb'     , title:'New Dashboard #1' }
                       , { page : 'index_3.html'                       , icon : 'icon-graph'    , title:'New Dashboard #2' }]}
         , { icon    : 'icon-basket'
           , title   : 'eCommerce'
           , entries : [ { page : 'ecommerce_index.html'               , icon : 'icon-home'     , title : 'Dashboard'    }
                       , { page : 'ecommerce_orders.html'              , icon : 'icon-basket'   , title : 'Orders'       }
                       , { page : 'ecommerce_orders_view.html'         , icon : 'icon-tag'      , title : 'Order View'   }
                       , { page : 'ecommerce_products.html'            , icon : 'icon-handbag'  , title : 'Products'     }
                       , { page : 'ecommerce_products_edit.html'       , icon : 'icon-pencil'   , title : 'Product Edit' }]}
         , { icon    : 'icon-rocket'
           , title   : 'Page Layouts'
           , entries : [ { page : 'layout_horizontal_sidebar_menu.html', title : 'Horizontal & Sidebar Menu'                                                               }
                       , { page : 'index_horizontal_menu.html'         , title : 'Dashboard & Mega Menu'                                                                   }
                       , { page : 'layout_horizontal_menu1.html'       , title : 'Horizontal Mega Menu 1'                                                                  }
                       , { page : 'layout_horizontal_menu2.html'       , title : 'Horizontal Mega Menu 2'                                                                  }
                       , { page : 'layout_fontawesome_icons.html'      , title : '<span class="badge badge-roundless badge-danger">new</span>Layout with Fontawesome Icons'}
                       , { page : 'layout_glyphicons.html'             , title : 'Layout with Glyphicon'                                                                   }
                       , { page : 'layout_full_height_portlet.html'    , title : '<span class="badge badge-roundless badge-success">new</span>Full Height Portlet'         }
                       , { page : 'layout_full_height_content.html'    , title : '<span class="badge badge-roundless badge-warning">new</span>Full Height Content'         }
                       , { page : 'layout_search_on_header1.html'      , title : 'Search Box On Header 1'                                                                  }
                       , { page : 'layout_search_on_header2.html'      , title : 'Search Box On Header 2'                                                                  }
                       , { page : 'layout_sidebar_search_option1.html', title : 'Sidebar Search Option 1'                                                                  }
                       , { page : 'layout_sidebar_search_option2.html', title : 'Sidebar Search Option 2'                                                                  }
                       , { page : 'layout_sidebar_reversed.html'      , title : '<span class="badge badge-roundless badge-warning">new</span>Right Sidebar Page'           }
                       , { page : 'layout_sidebar_fixed.html'         , title : 'Sidebar Fixed Page'                                                                       }
                       , { page : 'layout_sidebar_closed.html'        , title : 'Sidebar Closed Page'                                                                      }
                       , { page : 'layout_ajax.html'                  , title : 'Content Loading via Ajax'                                                                 }
                       , { page : 'layout_disabled_menu.html'         , title : 'Disabled Menu Links'                                                                      }
                       , { page : 'layout_blank_page.html'            , title : 'Blank Page'                                                                               }
                       , { page : 'layout_boxed_page.html'            , title : 'Boxed Page'                                                                               }
                       , { page : 'layout_language_bar.html'          , title : 'Language Switch Bar'                                                                      }]}
         , { icon    : 'icon-diamond'
           , title   : 'UI Features'
           , entries : [ { page : 'ui_general.html'              , title : 'General Components'                                                                       }
                       , { page : 'ui_buttons.html'              , title : 'Buttons'                                                                                  }
                       , { page : 'ui_confirmations.html'        , title : 'Popover Confirmations'                                                                    }
                       , { page : 'ui_icons.html'                , title : '<span class="badge badge-roundless badge-danger">new</span>Font Icons'                    }
                       , { page : 'ui_colors.html'               , title : 'Flat UI Colors'                                                                           }
                       , { page : 'ui_typography.html'           , title : 'Typography'                                                                               }
                       , { page : 'ui_tabs_accordions_navs.html' , title : 'Tabs, Accordions & Navs'                                                                  }
                       , { page : 'ui_tree.html'                 , title : '<span class="badge badge-roundless badge-danger">new</span>Tree View'                     }
                       , { page : 'ui_page_progress_style_1.html', title : '<span class="badge badge-roundless badge-warning">new</span>Page Progress Bar'            }
                       , { page : 'ui_blockui.html'              , title : 'Block UI'                                                                                 }
                       , { page : 'ui_bootstrap_growl.html'      , title : '<span class="badge badge-roundless badge-warning">new</span>Bootstrap Growl Notifications'}
                       , { page : 'ui_notific8.html'             , title : 'Notific8 Notifications'                                                                   }
                       , { page : 'ui_toastr.html'               , title : 'Toastr Notifications'                                                                     }
                       , { page : 'ui_alert_dialog_api.html'     , title : '<span class="badge badge-roundless badge-danger">new</span>Alerts & Dialogs API'          }
                       , { page : 'ui_session_timeout.html'      , title : 'Session Timeout'                                                                          }
                       , { page : 'ui_idle_timeout.html'         , title : 'User Idle Timeout'                                                                        }
                       , { page : 'ui_modals.html'               , title : 'Modals'                                                                                   }
                       , { page : 'ui_extended_modals.html'      , title : 'Extended Modals'                                                                          }
                       , { page : 'ui_tiles.html'                , title : 'Tiles'                                                                                    }
                       , { page : 'ui_datepaginator.html'        , title : '<span class="badge badge-roundless badge-success">new</span>Date Paginator'               }
                       , { page : 'ui_nestable.html'             , title : 'Nestable List'                                                                            }]}
         , { icon    : 'icon-puzzle'
           , title   : 'UI Components'
           , entries : [ { page : 'components_pickers.html'         , title : 'Date & Time Pickers'       }
                       , { page : 'components_context_menu.html'    , title : 'Context Menu'              }
                       , { page : 'components_dropdowns.html'       , title : 'Custom Dropdowns'          }
                       , { page : 'components_form_tools.html'      , title : 'Form Widgets & Tools'      }
                       , { page : 'components_form_tools2.html'     , title : 'Form Widgets & Tools 2'    }
                       , { page : 'components_editors.html'         , title : 'Markdown & WYSIWYG Editors'}
                       , { page : 'components_ion_sliders.html'     , title : 'Ion Range Sliders'         }
                       , { page : 'components_noui_sliders.html'    , title : 'NoUI Range Sliders'        }
                       , { page : 'components_jqueryui_sliders.html', title : 'jQuery UI Sliders'         }
                       , { page : 'components_knob_dials.html'      , title : 'Knob Circle Dials'         }]}
         , { title : 'Features'}
         , { icon    : 'icon-settings'
           , title   : 'Form Stuff'
           , entries : [ { page : 'form_controls.html'  , title : 'Form Controls'                                                              }
                       , { page : 'form_icheck.html'    , title : 'iCheck Controls'                                                            }
                       , { page : 'form_layouts.html'   , title : 'Form Layouts'                                                               }
                       , { page : 'form_editable.html'  , title : '<span class="badge badge-roundless badge-warning">new</span>Form X-editable'}
                       , { page : 'form_wizard.html'    , title : 'Form Wizard'                                                                }
                       , { page : 'form_validation.html', title : 'Form Validation'                                                            }
                       , { page : 'form_image_crop.html', title : '<span class="badge badge-roundless badge-danger">new</span>Image Croppingg' }
                       , { page : 'form_fileupload.html', title : 'Multiple File Upload'                                                       }
                       , { page : 'form_dropzone.html'  , title : 'Dropzone File Upload'                                                       }]}
         , { icon    : 'icon-briefcase'
           , title   : 'Data Tables'
           , entries : [ { page : 'table_basic.html'     , title : 'Basic Datatables'     }
                       , { page : 'table_tree.html'      , title : 'Tree Datatables'      }
                       , { page : 'table_responsive.html', title : 'Responsive Datatables'}
                       , { page : 'table_managed.html'   , title : 'Managed Datatables'   }
                       , { page : 'table_editable.html'  , title : 'Editable Datatables'  }
                       , { page : 'table_advanced.html'  , title : 'Advanced Datatables'  }
                       , { page : 'table_ajax.html'      , title : 'Ajax Datatables'      }]}
         , { icon    : 'icon-wallet'
           , title   : 'Portlets'
           , entries : [ { page : 'portlet_general.html'  , title : 'General Portlets'                                                          }
                       , { page : 'portlet_general2.html' , title : '<span class="badge badge-roundless badge-danger">new</span>New Portlets #1'}
                       , { page : 'portlet_general3.html' , title : '<span class="badge badge-roundless badge-danger">new</span>New Portlets #2'}
                       , { page : 'portlet_ajax.html'     , title : 'Ajax Portlets'                                                             }
                       , { page : 'portlet_draggable.html', title : 'Draggable Portlets'                                                        }]}
         , { icon    : 'icon-bar-chart'
           , title   : 'Charts'
           , entries : [ { page : 'charts_amcharts.html'  , title : 'amChart'  }
                       , { page : 'charts_flotcharts.html', title : 'Flotchart'}]}
         , { icon    : 'icon-docs'
           , title   : 'Pages'
           , entries : [ { page : 'page_timeline.html'    , icon : 'icon-paper-plane'   , title : '<span class="badge badge-warning">2</span>New Timeline'                      }
                       , { page : 'extra_profile.html'    , icon : 'icon-user-following', title : '<span class="badge badge-success badge-roundless">new</span>New User Profile'}
                       , { page : 'page_todo.html'        , icon : 'icon-check'         , title : 'Todo'                                                                        }
                       , { page : 'inbox.html'            , icon : 'icon-envelope'      , title : '<span class="badge badge-danger">4</span>Inbox'                              }
                       , { page : 'extra_faq.html'        , icon : 'icon-question'      , title : 'FAQ'                                                                         }
                       , { page : 'page_calendar.html'    , icon : 'icon-calendar'      , title : '<span class="badge badge-danger">14</span>Calendar'                          }
                       , { page : 'page_coming_soon.html' , icon : 'icon-flag'          , title : 'Coming Soon'                                                                 }
                       , { page : 'page_blog.html'        , icon : 'icon-speech'        , title : 'Blog'                                                                        }
                       , { page : 'page_blog_item.html'   , icon : 'icon-link'          , title : 'Blog Post'                                                                   }
                       , { page : 'page_news.html'        , icon : 'icon-eye'           , title : '<span class="badge badge-success">9</span>News'                              }
                       , { page : 'page_news_item.html'   , icon : 'icon-bell'          , title : 'News View'                                                                   }
                       , { page : 'page_timeline_old.html', icon : 'icon-paper-plane'   , title : '<span class="badge badge-warning">2</span>Old Timeline'                      }
                       , { page : 'extra_profile_old.html', icon : 'icon-user'          , title : 'Old User Profile'                                                            }]}
         , { icon    : 'icon-present'
           , title   : 'Extra'
           , entries : [ { page : 'page_about.html'         , title : 'About Us'         }
                       , { page : 'page_contact.html'       , title : 'Contact Us'       }
                       , { page : 'extra_search.html'       , title : 'Search Results'   }
                       , { page : 'extra_invoice.html'      , title : 'Invoice'          }
                       , { page : 'page_portfolio.html'     , title : 'Portfolio'        }
                       , { page : 'extra_pricing_table.html', title : 'Pricing Tables'   }
                       , { page : 'extra_404_option1.html'  , title : '404 Page Option 1'}
                       , { page : 'extra_404_option2.html'  , title : '404 Page Option 2'}
                       , { page : 'extra_404_option3.html'  , title : '404 Page Option 3'}
                       , { page : 'extra_500_option1.html'  , title : '500 Page Option 1'}
                       , { page : 'extra_500_option2.html'  , title : '500 Page Option 2'}]}
         , { icon    : 'icon-folder'
           , title   : 'Multi Level Menu'
           , entries : [ { icon  : 'icon-settings'
                         , title : 'Item 1'
                         , entries : [ { icon : 'icon-user'
                                       , title : 'Sample Link 1'
                                       , entries : [ { page : '#', icon : 'icon-power'      , title : 'Sample Link 1'}
                                                   , { page : '#', icon : 'icon-paper-plane', title : 'Sample Link 2'}
                                                   , { page : '#', icon : 'icon-star'       , title : 'Sample Link 3'}]}
                                     , { page : '#', icon : 'icon-camera' , title : 'Sample Link 1'}
                                     , { page : '#', icon : 'icon-link'   , title : 'Sample Link 2'}
                                     , { page : '#', icon : 'icon-pointer', title : 'Sample Link 3'}]}
                       , { icon : 'icon-globe'
                         , title : 'Item 2'
                         , entries : [ { page : '#', icon : 'icon-tag'   , title : 'Sample Link 1'}
                                     , { page : '#', icon : 'icon-pencil', title : 'Sample Link 2'}
                                     , { page : '#', icon : 'icon-graph' , title : 'Sample Link 3'}]}]}
         , { icon    : 'icon-present'
           , title   : 'Extra'
           , entries : [ { page : 'login.html'      , title : 'Login Form 1' }
                       , { page : 'login_2.html'    , title : 'Login Form 2' }
                       , { page : 'login_3.html'    , title : 'Login Form 3' }
                       , { page : 'login_soft.html' , title : 'Login Form 4' }
                       , { page : 'extra_lock.html' , title : 'Lock Screen 1'}
                       , { page : 'extra_lock2.html', title : 'Lock Screen 2'}]}
         , { title : 'More'}
         , { icon    : 'icon-logout'
           , title   : 'Quick Sidebar'
           , entries : [ { page : 'quick_sidebar_push_content.html'            , title : 'Push Content'              }
                       , { page : 'quick_sidebar_over_content.html'            , title : 'Over Content'              }
                       , { page : 'quick_sidebar_over_content_transparent.html', title : 'Over Content & Transparent'}
                       , { page : 'quick_sidebar_on_boxed_layout.html'         , title : 'Boxed Layout'              }]}
         , { icon    : 'icon-envelope-open'
           , title   : 'Email Templates'
           , entries : [ { page : 'email_template1/index.html', target:'_blank', title : 'New Email Template 1'}
                       , { page : 'email_template2/index.html', target:'_blank', title : 'New Email Template 2'}
                       , { page : 'email_template3/index.html', target:'_blank', title : 'New Email Template 3'}
                       , { page : 'email_template4/index.html', target:'_blank', title : 'New Email Template 4'}
                       , { page : 'email_newsletter.html'     , target:'_blank', title : 'Old Email Template 1'}
                       , { page : 'email_system.html'         , target:'_blank', title : 'Old Email Template 2'}]}
         ];

      return SideBarHandler;
   })();

   var TabBarHandler  = (function() {

      /**
       * @typedef {Object} TabParameters
       * @property {string}   code
       * @property {string}   label
       * @property {string}   link
       * @property {function} handler
       * @property {function} enabled
       */

      /**
       *
       * @constructor
       * @property {boolean}      enabled
       * @property {HTMLElement}  mainDOM
       * @property {StandardPage} parent
       *
       */
      function TabBarHandler(parent) {
         this.enabled = false;
         this.tabs    = [];
         this.parent  = parent;
      }

      /**
       *
       * @param {string} code
       * @param {Event}  event
       */
      TabBarHandler.prototype.activate           = function(code, event) {

         var /** @type {Object} */ tab ;

         // Retreiving the tab
         tab = this.getTab(code);
         return tab.activate(event);
      };

      /**
       *
       * @param {Object} tab
       * @return {AdminLib.StandardPage.Tab|TabParameters}
       */
      TabBarHandler.prototype.addTab             = function(tab) {
         var /** @type {HTMLElement} */ dom;

         if (!this.enabled)
            this.enable();

         if (!(tab instanceof Tab))
            tab = new Tab(tab);

         this.tabs.push(tab);

         dom = tab.getDOM();

         this.dom.querySelector('ul').appendChild(dom);

         return tab;
      };

      /**
       * Disable the tab mode
       */
      TabBarHandler.prototype.disable            = function() {

         if (!this.enabled)
            return;

         this.enabled = false;

         // The main DOM is move to it's original place
         this.dom.parentElement.replaceChild(this.getMainDOM(), this.dom);

         // Emptying the object.
         this.dispose();
      };

      TabBarHandler.prototype.dispose            = function() {
         this.dom     = undefined;
         this.tabs    = [];
      };

      /**
       * Enable the tab bar.
       * The function will append into the DOM the tab bar and move the main DOM as a tab bar content.
       * The only modification on the main DOM that is made is the classes :
       *    "col-md-12" is removed
       *    "tab-content" is added
       *
       */
      TabBarHandler.prototype.enable             = function() {
         if (this.enabled)
            return;

         this.enabled = true;

         this.dom = AdminLib.dom.build(template);

         // Replacing the page-content-wrapper element by the tab bar dom.
         this.getMainDOM().parentElement.replaceChild(this.dom, this.getMainDOM());

         // Moving the page-content into the DOM
         this.dom.querySelector('.tab-pane').appendChild(this.getMainDOM());
      };

      /**
       *
       * @param {string} code
       * @returns {AdminLib.StandardPage.Tab}
       * @public
       */
      TabBarHandler.prototype.getTab             = function getTab(code) {
         var /** @type {number} */ t;

         for(t in this.tabs) {
            if (this.tabs[t].code === code)
               return this.tabs[t];
         }
      };

      /**
       * Return the DOM of the tab corresponding to the code
       * @param {string} code
       * @returns {HTMLElement}
       */
      TabBarHandler.prototype.getTabDOM          = function getTab(code) {
         return this.dom.querySelector('ul > #' + code);
      };

      /**
       *
       * @returns {HTMLELement}
       */
      TabBarHandler.prototype.getMainDOM         = function() {
         return this.parent.getMainDOM();
      };

      /**
       * Remove the given tab
       * @param {string} code
       * @public
       */
      TabBarHandler.prototype.removeTab          = function(code) {

         var /** @type {number} */ t;

         // Removing the tab from DOM
         this.dom.querySelector('ul').removeChild(this.getTabDOM(code));

         // Removing from the list of tabs
         for(t in this.tabs) {
            if (this.tabs[t].code !== code)
               continue;

            delete(this.tabs[t]);
         }

         // If there is no more tabs, the we disable the tabbar
         if (this.tabs.length === 0)
            this.disable();
      };

      /**
       * @name AdminLib.StandardPage.Tab
       * @param {TabParameters} parameters
       * @constructor
       * @property {boolean}  enabled
       * @property {string}   code
       * @property {string}   link
       * @property {string}   icon
       * @property {string}   label
       * @property {function} handler
       */
      function Tab(parameters) {
         this.enabled = AdminLib.coalesce(parameters.enabled, true);
         this.code    = parameters.code;
         this.link    = AdminLib.coalesce(parameters.link, '#');
         this.icon    = parameters.icon;
         this.label   = parameters.label;
         this.handler = parameters.handler;
      }

      /**
       *
       * @param {Event} event
       */
      Tab.prototype.activate                     = function activate(event) {

         var /** @type {HTMLElement} */ dom
           , /** @type {Promise}     */ promise;

         if (!this.enabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
         }


         promise = this.handler(event);

         if (event) {
            // If the activation has been prevented, then we do nothing
            if (event.defaultPrevented) {

               // This is normaly not useful. But, somehow, there is another listener on the tab that is triggerd
               // if we do not stop proppagation
               event.stopImmediatePropagation();
               return promise;
            }
         }

         // Removing the "active" class from the previously active tab
         dom = this.dom.parentElement.querySelector('ul > .active');

         if (dom)
            dom.classList.remove('active');

         // Adding the "active" class to the active tab
         this.dom.classList.add('active');

         return promise;
      };

      /**
       * @private
       */
      Tab.prototype.buildDOM                     = function buildDOM() {
         this.dom = AdminLib.dom.build(templateTab, this);
         this.dom.addEventListener('click', this.activate.bind(this));
      };

      Tab.prototype.disable                      = function disable() {
         this.toggleEnable(false);
      };

      Tab.prototype.enable                       = function enable() {
         this.toggleEnable(true);
      };

      /**
       *
       * @returns {HTMLElement}
       */
      Tab.prototype.getDOM                       = function getDOM() {
         if (this.dom === undefined)
            this.buildDOM();

         return this.dom;
      };

      /**
       *
       * @param {boolean} [enabled]
       * @public
       */
      Tab.prototype.toggleEnable                 = function toggleEnable(enabled) {

         enabled = !!AdminLib.coalesce(enabled, !this.enabled);

         if (this.enabled === enabled)
            return;

         this.enabled = enabled;

         if (!this.dom)
            return;

         this.dom.classList.toggle('disabled', !this.enabled);

      };

      var template =
            '<div class="row">'
         +     '<div class="col-md-12">'
         +        '<div id="tabWrapper" class="tabbable-custom tabbable-full-width">'
         +           '<ul class="nav nav-tabs">'
         +           '</ul>'
         +           '<div class="tab-content">'
         +              '<div class="tab-pane active">'
         +              '</div>'
         +           '</div>'
         +        '</div>'
         +     '</div>'
         +  '</div>';

      var templateTab =
            '<li class="{{^enabled}}disabled{{/enabled}}" id="{{code}}">'
         +     '<a href="{{link}}" data-toggle="tab">{{#icon}}<i class="{{icon}}"></i>{{/icon}}{{label}}</a>'
			+  '</li>';

      return TabBarHandler;

   })();

   var TopBarHandler  = (function() {

      /**
       *
       * @constructor
       * @property {HTMLElement} headerDOM
       * @property {HTMLElement} topMenuDOM
       * @property {boolean}     initialized
       */
      function TopBarHandler() {
         this.initialized = false;
         this.user_refresh_listener = function() {this.refresh();}.bind(this);
      };

      TopBarHandler.prototype.buildTopMenu = function() {
         this.topMenuDOM = AdminLib.dom.build(templateTopMenu, this);

         this.topMenuDOM.querySelector('a#logout').addEventListener('click', function(event) {
            event.preventDefault();
            AdminApp.session.disconnect();
         });
      };

      TopBarHandler.prototype.dispose            = function() {
         this.headerDOM   = undefined;
         this.topMenuDOM  = undefined;
         this.initialized = false;
         this.avatar      = undefined;
         this.first_name  = undefined;

         AdminLib.removeEventListener(this.user_refresh_listener);
      };

      TopBarHandler.prototype.init               = function(dom) {

         var /** @type {Object} */ profile;

         this.headerDOM = dom.querySelector('header');

         AdminLib.addEventListener(AdminLib.EVENT_TYPES.user_refresh, this.user_refresh_listener);

         this.initialized = true;

         this.refresh();
      };

      TopBarHandler.prototype.refresh            = function() {

         var /** @type {AdminLib.User} */ currentUser;

         currentUser = AdminApp.session.getCurrentUser();

         if (currentUser === undefined)
            return;

         this.avatar     = currentUser.profile.avatar;
         this.first_name = currentUser.profile.first_name;

         // If the top menu DOM already exist, we remove it
         if (this.topMenuDOM !== undefined)
            this.topMenuDOM.parentElement.removeChild(this.topMenuDOM);

         // Building the top menu dom
         this.buildTopMenu();

         // Adding to the header
         this.querySelector('.top-menu').appendChild(this.topMenuDOM);
      };

      /**
       *
       * @param {string} path
       * @returns {HTMLElement}
       */
      TopBarHandler.prototype.querySelector      = function(path) {
         return this.headerDOM.querySelector(path);
      };

      var templateTopMenu =
         '<ul class="nav navbar-nav pull-right">'
      +     '<!-- BEGIN USER LOGIN DROPDOWN -->'
      +     '<li class="dropdown dropdown-user">'
      +        '<a href="#" class="dropdown-toggle" data-toggle="dropdown" data-hover="dropdown" data-close-others="true">'
      +           '<img alt="" class="img-circle" src="/media/avatars/{{avatar}}"/>'
      +           '<span class="username username-hide-on-mobile">{{first_name}}</span>'
      +           '<i class="fa fa-angle-down"></i>'
      +        '</a>'
      +        '<ul class="dropdown-menu dropdown-menu-default">'
      +           '<li>'
      +              '<a href="extra_profile.html" disabled>'
      +                 '<i class="icon-user"></i> My Profile </a>'
      +           '</li>'
      +           '<li class="divider"></li>'
      +           '<li>'
      +              '<a href="extra_lock.html" disabled>'
      +                 '<i class="icon-lock"></i>'
      +                 ' Lock Screen '
      +              '</a>'
      +           '</li>'
      +           '<li>'
      +              '<a id="logout">'
      +                 '<i class="icon-key"></i>'
      +                    ' Log Out '
      +              '</a>'
      +           '</li>'
      +        '</ul>'
      +     '</li>'
      +  '</ul>'

      return TopBarHandler;
   })();

   return new StandardPage();
})();