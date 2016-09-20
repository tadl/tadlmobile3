// Set up all URLs as vars
var ilsCatcherBase = 'https://apiv2.catalog.tadl.org/';
var ilsSearchBasic = ilsCatcherBase + 'search/basic';
var ilsItemDetails = 'https://catalog.tadl.org/main/details.json';
var ilsAccountHolds = ilsCatcherBase + 'account/holds';
var ilsAccountCheckouts = ilsCatcherBase + 'account/checkouts';
var ilsAccountRenew = ilsCatcherBase + 'account/renew_items';
var ilsAccountLogin = ilsCatcherBase + 'account/login';
var ilsAccountLogout = ilsCatcherBase + 'account/logout';
var ilsAccountRefresh = ilsCatcherBase + 'account/login_refresh';
var ilsAccountToken = ilsCatcherBase + 'account/check_token';
var ilsAccountHoldsPlace = ilsCatcherBase + 'account/place_holds';
var ilsPasswordReset = ilsCatcherBase + 'account/password_reset';
var webLocations = 'https://www.tadl.org/sites/default/files/json/parsed-hours.json';
var webEvents = ilsCatcherBase + 'web/events';
var webNews = ilsCatcherBase + 'web/news';
var webNode = 'https://www.tadl.org/export/node/json/';
var featuredItems = 'https://www.tadl.org/mobile/export/items/json/featured?mobi_bypass=1';

var app = angular.module('egmobile', ['ionic', 'ngFitText'])

.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

.run(function($ionicPlatform, $state) {
    $ionicPlatform.registerBackButtonAction(function(e) {
        if ($state.is('main.home')) {
            ionic.Platform.exitApp();
        } else {
            navigator.app.backHistory();
        }
        e.preventDefault();
        return false;
    }, 101);
})

// Set global variables and functions
.run(function($rootScope, $timeout, $ionicSideMenuDelegate, $ionicLoading, $ionicScrollDelegate) {
    $rootScope.logged_in = "";
    $rootScope.user_basic = "";
    $rootScope.show_loading = function(custom) {
        var loadingtext = custom || 'Loading...';
        $ionicLoading.show({
            template: '<i class="icon ion-loading-d big_loading"></i> <span class="loading_text">' + loadingtext + '</span>'
        });
        $rootScope.loading = true;
    }

    $rootScope.hide_loading = function() {
        $ionicLoading.hide();
        $rootScope.loading = false;
    }

    $rootScope.show_account = function() {
        $ionicSideMenuDelegate.toggleRight(true);
    }

    $rootScope.scroll_top = function() {
        $ionicScrollDelegate.scrollTop();
    }

    $rootScope.$on('$viewContentLoaded', function() {
        $ionicScrollDelegate.scrollTop();
    });

    $rootScope.openLink = function(link) {
        try {
            window.open(link, '_system', 'location=no,toolbar=yes');
        } catch (err) {
            popup.alert('Oops', 'Unable to open that link. Please try again.');
        }
    }

})

// Create routes
.config(function($stateProvider, $urlRouterProvider, $httpProvider, fitTextConfigProvider) {
    $stateProvider
    .state('main', {
        url: '/',
        views: {
            'account@': {
                templateUrl: 'templates/account.html',
                controller: 'AccountCtrl',
            },
            'main@':{
                template: '<ui-view/>'
            },
            'menu@':{
                templateUrl: 'templates/menu.html'
            }
        }
    })

    .state('main.search', {
        url: 'search?query&format&sort&availability&loc&qtype',
        templateUrl: 'templates/search.html',
        controller: 'SearchCtrl',
    })

    .state('main.home', {
        url: 'home',
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl',
    })

    .state('main.holds', {
        url: 'holds',
        templateUrl: 'templates/holds.html',
        controller: 'HoldsCtrl',
    })

    .state('main.checkouts', {
        url: 'checkouts',
        templateUrl: 'templates/checkouts.html',
        controller: 'CheckoutCtrl',
    })

    .state('main.card',{
        url: 'card',
        templateUrl: 'templates/card.html',
        controller: 'CardCtrl',
    })

    .state('main.locations',{
        url: 'locations',
        templateUrl: 'templates/locations.html',
        controller: 'LocationCtrl',
    })

    .state('main.events',{
        url: 'events',
        templateUrl: 'templates/events.html',
        controller: 'EventsCtrl',
    })

    .state('main.news',{
        url: 'news',
        templateUrl: 'templates/news.html',
        controller: 'NewsCtrl',
    })

    .state('main.featured',{
        url: 'featured',
        templateUrl: 'templates/featured.html',
        controller: 'FeaturedCtrl',
    })

    $urlRouterProvider.otherwise('/home');

    // Just put that anywhere, Bill...
    fitTextConfigProvider.config = {
        debounce: false,
        delay: 1000
    };

    // This too.
    $httpProvider.defaults.transformRequest = function(data) {
        if (data === undefined) {
            return data;
        }
        return $.param(data);
    }
})

app.controller('MenuCtrl', function($scope, $rootScope, $timeout, $ionicSideMenuDelegate) {
    $timeout(function() {
        $scope.$watch(function() {
            return $ionicSideMenuDelegate.isOpenRight();
        }, function(openRight) {
            $scope.openRight = openRight;
        });
        $scope.$watch(function() {
            return $ionicSideMenuDelegate.isOpenLeft();
        }, function(openLeft) {
            $scope.openLeft = openLeft;
        });
    }, 0);
});

// Search Controller
app.controller('SearchCtrl', function($scope, $rootScope, $http, $location, $stateParams, $timeout, popup, hold, itemDetail, $ionicModal) {
    $scope.advanced_search = false;
    $scope.results = [];
    $scope.pageChanged = function(newPage) {
        $scope.current_page = newPage;
    };
    $scope.search = function(more) {
        if (more != true) {
            $scope.current_page = 1
            $scope.page = 0;
            $scope.advanced_search = false;
            $rootScope.show_loading('Searching...');
        } else {
            $rootScope.show_loading('Loading more results...');
            // we proceed with more results
        }
        if ($scope.query == undefined || $scope.query == null) { $scope.query = ""; }
        if ($stateParams.query == undefined || $stateParams.query == null) { $stateParams.query = ""; }

        var search_params = {};
        search_params['query'] = $scope.query;
        search_params['format'] = $scope.format;
        search_params['sort'] = $scope.sort;
        search_params['availability'] = $scope.availability;
        search_params['loc'] = $scope.loc;
        search_params['qtype'] = $scope.qtype;
        search_params['page'] = $scope.page;

        $http({
            method: 'GET',
            url: ilsSearchBasic,
            timeout: 15000,
            params: search_params
        }).success(function(data) {
            for (index = 0; index < data.results.length; ++index) {
                if (data.results[index].availability.length) {
                    data.results[index].availability = data.results[index].availability.toString();
                }
            }
            $scope.page = data.page
            $scope.more_results = (data.more_results == "true");
            $scope.new_results = data.results
            if (more == true) {
                $scope.results = $scope.results.concat($scope.new_results);
                $scope.page++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            } else {
                $scope.results = $scope.new_results;
                cordova.plugins.Keyboard.close();
                $scope.page++;
            }
            $rootScope.hide_loading();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };

    $scope.details = function(record_id) {
        itemDetail.get(record_id).then(function(data) {
            $scope.item = data;
            $ionicModal.fromTemplateUrl('templates/item_modal.html', {
                scope: $scope
            }).then(function(modal) {
                $scope.modal = modal;
                modal.show();
                $scope.closeModal = function() {
                    modal.hide();
                }
            });
        });
    };

    $scope.showAlert = function(title,message) {
        popup.alert(title,message);
    };

    $scope.resetSearch = function() {
        $scope.query = "";
        $timeout(function() {
            $('#searchBox').focus();
        }, 1);
    }

    $scope.openLink = function(link) {
        try {
            window.open(link, '_system', 'location=no,toolbar=yes');
        } catch (err) {
            popup.alert('Oops', 'Unable to open that link. Please try again.');
        }
    }

    $scope.toggle_advanced = function() {
        if ($scope.advanced_search == false) {
            $scope.advanced_search = true;
        } else {
            $scope.advanced_search = false;
        }
    }

    $scope.place_hold = function(record_id) {
        hold.place(record_id);
    }
/*
    $scope.query = $stateParams.query;
    $scope.format = $stateParams.format;
    $scope.sort = $stateParams.sort;
    $scope.availability = $stateParams.availability;
    $scope.loc = $stateParams.loc;
    $scope.qtype = $stateParams.qtype;
*/
    if (($scope.format != 'all') || ($scope.sort != 'relevance') || ($scope.loc != '22') || ($scope.availability != 'off') || ($scope.qtype != 'keyword')) {
        $scope.advanced_search = true;
    }

    if (($scope.query != null) || ($scope.current_search != $scope.query)) {
        $scope.search();
    }
});

// Home Controller
app.controller('HomeCtrl', function($rootScope, $scope, $ionicSlideBoxDelegate, $http, popup, hold, login) {
    var username = localStorage.getItem('username');
    var password = localStorage.getItem('password');
    if (password != null) { localStorage.removeItem('password'); }
});

// Account Controller
app.controller('AccountCtrl', function($scope, $rootScope, $http, $location, $ionicPopup, login, popup) {
    $scope.login = function() {
        login.login($scope.username, $scope.password);
        $scope.password = null;
    }

    $scope.logout = function() {
        var token = localStorage.getItem('token');
        localStorage.clear();
        $rootScope.logged_in = false;
        $rootScope.user_basic = {};
        $http({
            method: 'GET',
            url: ilsAccountLogout,
            params: {"token": token},
            timeout: 15000
        }).success(function() {
            $location.path('/home');
        }).error(function() {
        });
        $rootScope.hide_loading();
    }

    $scope.resetPassword = function() {
        $scope.data = {}
        var resetPrompt = $ionicPopup.show({
            template: '<input type="text" ng-model="data.username">',
            title: 'Reset Password',
            subTitle: 'Enter your library card number or username',
            scope: $scope,
            buttons: [
                { text: 'Cancel', type: 'button-assertive' },
                {
                    text: '<b>Send</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (!$scope.data.username) {
                            e.preventDefault();
                        } else {
                            $rootScope.show_loading();
                            $http({
                                method: 'GET',
                                url: ilsPasswordReset,
                                params: {"username": $scope.data.username},
                                timeout: 15000,
                            }).success(function() {
                                $rootScope.hide_loading();
                                popup.alert('Request Submitted', 'Your password reset request has been queued. You should receive an email within the next 5-10 minutes with instructions on completing the password reset process. Thank you!')
                            }).error(function() {
                                $rootScope.hide_loading();
                                popup.alert('Oops', 'An error has occurred, please try again.');
                            });
                        }
                    }
                },
            ]
        });
        resetPrompt.then(function(res) {
            // console.log('Tapped!', res);
        });
    }

    if (localStorage['token'] != null || localStorage['hash'] != null) {
        login.login();
    }
});

// Holds Controller
app.controller('HoldsCtrl', function($scope, $rootScope, $http, $ionicLoading, $q, $ionicModal, itemDetail, popup, login) {
    $scope.holds = function() {
        var token = localStorage.getItem('token')
        $rootScope.show_loading('Loading&nbsp;holds...');
        $http({
            method: 'GET',
            url: ilsAccountHolds,
            params: {"token": token},
            timeout: 15000,
        }).success(function(data) {
            $rootScope.hide_loading();
            if (data.message != "Invalid token") {
                $scope.holds = data.holds
            } else {
                login.login();
                $scope.holds();
            }
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.')
        });
    };

    $scope.change_hold = function(hold_id, task) {
        var token = localStorage.getItem('token')
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: ilsAccountHolds,
            params: {"token": token, "task": task, "hold_id": hold_id},
            timeout: 15000,
        }).success(function(data) {
            $rootScope.hide_loading();
            if (data.message != "Invalid token") {
                $scope.holds = data.holds;
                $rootScope.user_basic['holds'] = data.count;
            } else {
                login.login();
                setTimeout($scope.change_hold(hold_id, task), 2500);
            }
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    }

    $scope.change_pickup = function(hold_id) {
        var token = localStorage.getItem('token');
        $scope.changing_hold = hold_id;
    }

    $scope.locValue = 23;

    $scope.submit_change = function(hold_id, loc_id, hold_state, hold_num) {
        var token = localStorage.getItem('token');
        if (hold_state == 'Active') {
            var holdstate = 'f';
        } else {
            var holdstate = 't';
        }
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: 'https://catalog.tadl.org/main/update_hold_pickup.json',
            params: {"token": token, "hold_id": hold_id, "new_pickup": loc_id, "hold_state": holdstate},
            timeout: 15000,
        }).success(function(data) {
            $rootScope.hide_loading();
            if (data.message != "bad login") {
                $scope.holds[hold_num] = data.message;
                $scope.changing_hold = undefined;
            } else {
                login.login();
                setTimeout($scope.submit_change(hold_id, loc_id, hold_state, hold_num), 2500);
            }
            //location.reload();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });

    }

    $scope.cancel_change = function() {
        $scope.changing_hold = undefined;
    }

    $scope.details = function(record_id) {
        itemDetail.get(record_id).then(function(data) {
            $scope.item = data;
            $ionicModal.fromTemplateUrl('templates/item_modal.html', {
                scope: $scope
            }).then(function(modal) {
                $scope.modal = modal;
                modal.show();
                $scope.closeModal = function() {
                    modal.hide();
                }
            });
        });
    };


    $scope.holds();
});

// Checkout Controller
app.controller('CheckoutCtrl', function($scope, $rootScope, $http, $ionicPopup, $ionicLoading, $q, itemDetail, $ionicModal, login, popup) {
    $scope.checkouts = function() {
        var token = localStorage.getItem('token')
        $rootScope.show_loading('Loading&nbsp;checkouts...');
        $http({
            method: 'GET',
            url: ilsAccountCheckouts,
            params: {"token": token},
            timeout: 15000,
        }).success(function(data) {
            $rootScope.hide_loading();
            if (data.message != "Invalid token") {
                var rightnow = moment().format("YYYY-MM-DD");
                var renewids = [];
                var dueids = [];
                var renewitems = [];
                jQuery.each(data.checkouts, function() {
                    var due = moment(this.iso_due_date).format("YYYY-MM-DD");
                    if (due < rightnow) {
                        this.overdue = true;
                        dueids.push(Number(this.checkout_id));
                    } else { this.overdue = false; }
                    if ((this.overdue == true) && (this.renew_attempts > 0)) {
                        this.renew_urgent = true;
                        renewids.push(Number(this.checkout_id));
                        renewitems.push(Number(this.record_id));
                    } else { this.renew_urgent = false; }
                });
                var renewall = sessionStorage.getItem('renewall');
                if ((renewids.length) && (renewall != 'nope')) {
                    var message = '';
                    if (renewids.length == dueids.length) {
                        message = 'You have ' + dueids.length + ' overdue item' + ((dueids.length>1)?'s':'') + ' with available renewals, would you like to attempt to renew ' + ((renewids.length>1)?'them':'it') + '?';
                    } else {
                        message = 'You have ' + dueids.length + ' overdue item' + ((dueids.length>1)?'s,':',') + renewids.length + ' with available renewals, would you like to attempt to renew ' + ((renewids.length>1)?'them':'it') + '?';
                    }
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Overdue Items',
                        template: message,
                        okText: 'Yes',
                        cancelText: 'Not now'
                    });
                    confirmPopup.then(function(res) {
                        if (res) {
                            $scope.renew(renewids.toString(),renewitems.toString());
                        } else {
                            sessionStorage.setItem('renewall', 'nope');
                        }
                    });
                }
                $scope.checkouts = data.checkouts;
            } else {
                login.login();
                $scope.checkouts();
            }
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };

    $scope.details = function(record_id) {
        itemDetail.get(record_id).then(function(data) {
            $scope.item = data;
            $ionicModal.fromTemplateUrl('templates/item_modal.html', {
                scope: $scope
            }).then(function(modal) {
                $scope.modal = modal;
                modal.show();
                $scope.closeModal = function() {
                    modal.hide();
                }
            });
        });
    };

    $scope.renew = function(checkout_id,record_id) {
        $rootScope.show_loading('Renewing...');
        var token = localStorage.getItem('token');
        $http({
            method: 'GET',
            url: 'https://catalog.tadl.org/main/renew_checkouts.json',
            params: {"token": token, "checkout_ids": checkout_id, "record_ids": record_id},
            timeout: 15000,
        }).success(function(data) {
            $rootScope.hide_loading();
            if (data.message != "Invalid token") {
                var rightnow = new Date();
                var renewids = [];
                jQuery.each(data.checkouts, function() {
                    var due = new Date(this.iso_due_date);
                    if (due < rightnow) { this.overdue = true; }
                    else { this.overdue = false; }
                    if ((this.overdue == true) && (this.renew_attempts > 0)) {
                        this.renew_urgent = true;
                        renewids.push(Number(this.checkout_id));
                    } else { this.renew_urgent = false; }
                });
                var renewresponse = "";
                if (data.message != null) { renewresponse += data.message + '<br/>'; }
                if (data.errors.length >= 1) {
                    var errcount = 0;
                    jQuery.each(data.errors, function() {
                        errcount++;
                        renewresponse += '<strong>' + this.title + '</strong> ' + this.message;
                        renewresponse += (errcount == data.errors.length)?'.':', ';
                    });
                }
                popup.alert('Renewal Response',renewresponse);
                $scope.checkouts = data.checkouts;
            } else {
                login.login();
                popup.alert('Temporary error', 'The system encountered a temporary error, but it should be resolved now. Please try that again.');
            }
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };
    $scope.checkouts();
});

// Card Controller
app.controller('CardCtrl', function($scope, $rootScope, $ionicLoading, $timeout, $location, login) {
    $scope.show_card = function() {
        if (localStorage.getItem('card')) {
            var card = localStorage.getItem('card');
            $("#barcode").JsBarcode(card, { format:'CODE128', displayValue:true, fontSize:16, width: 2 });
        } else {
            if ($rootScope.logged_in == true) {
                $timeout(function() { $scope.show_card() }, 1500);
            } else {
                $location.path('/home');
                $rootScope.show_account();
            }
        }
    }
    $scope.show_card();
});

// Location Controller
app.controller('LocationCtrl', function($scope, $rootScope, $http, $ionicLoading, popup) {
    $scope.get_locations = function() {
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: webLocations,
            timeout: 15000,
        }).success(function(data) {
            $scope.locations = data.locations;
            $rootScope.hide_loading();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };
    $scope.get_locations();
});


// Events Controller
app.controller('EventsCtrl', function($scope, $rootScope, $http, $ionicLoading, popup, node_details) {
    $scope.get_events = function() {
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: webEvents,
            timeout: 15000,
        }).success(function(data) {
            $scope.events = data.events;
            $rootScope.hide_loading();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };
    $scope.node_details = function(record_id) {
        node_details.show(record_id);
    };

    $scope.get_events();
});

// Featured Items Controller
app.controller('FeaturedCtrl',function($scope, $rootScope, $http, $ionicLoading, $ionicScrollDelegate, $ionicModal, itemDetail, popup, hold) {

    $scope.get_featured = function(list_id) {
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: 'https://tadl-toolbox.apps.tadl.org/show_list.json?code=' + list_id,
            timeout: 15000,
        }).success(function(data) {
            $scope.featured = data.items;
            $scope.featured_title = data.list_name;
            $rootScope.hide_loading();
            $ionicScrollDelegate.scrollTop();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };

    $scope.clear_featured = function() {
        $scope.featured = undefined;
        $scope.featured_title = undefined;
    }

    $scope.details = function(record_id) {
        itemDetail.get(record_id).then(function(data) {
            $scope.item = data;
            $ionicModal.fromTemplateUrl('templates/item_modal.html', {
                scope: $scope
            }).then(function(modal) {
                $scope.modal = modal;
                modal.show();
                $scope.closeModal = function() {
                    modal.hide();
                }
            });
        });
    };

    $scope.place_hold = function(record_id) {
        hold.place(record_id);
    };

    // $scope.get_featured();
});

// News Controller
app.controller("NewsCtrl",function($scope, $rootScope, $http, $ionicLoading, popup, node_details) {
    $scope.get_news = function() {
        $rootScope.show_loading();
        $http({
            method: 'GET',
            url: webNews,
            timeout: 15000,
        }).success(function(data) {
            jQuery.each(data.news, function() {
                this.teasertitle = jQuery('<div>' + this.teasertitle + '</div>').text();
            });
            $scope.news = data.news;
            $rootScope.hide_loading();
        }).error(function() {
            $rootScope.hide_loading();
            popup.alert('Oops', 'An error has occurred, please try again.');
        });
    };
    $scope.get_news();
});

// Login Factory
app.factory('login', function($http, $rootScope, popup) {
    return {
        login: function(username, password) {
            if (username != null) {
                $rootScope.show_loading('Logging&nbsp;in...');
            }
            var username = username;
            var password = password;
            if (username != null) { localStorage.setItem('username', username); }
            if (password != null) {
                var hash = CryptoJS.MD5(password).toString(CryptoJS.enc.MD5);
                localStorage.setItem('hash', hash);
            }
            var localuser = localStorage.getItem('username');
            var localhash = localStorage.getItem('hash');
            if (localhash != null) {
                login_url = ilsAccountRefresh;
                login_params = {"username": localuser, "pass_md5": localhash};
            } else if (localStorage['token'] != null) {
                var token = localStorage.getItem('token');
                login_url = ilsAccountToken;
                login_params = {"token": token};
            } else {
                login_url = ilsAccountLogin;
                login_params = {"username": username, "password": password};
            }
            $http({
                method: 'POST',
                url: login_url,
                data: login_params,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                timeout: 15000,
            }).success(function(data) {
                $rootScope.hide_loading();
                if (data.message == 'login failed' || data.message == 'failed' ) {
                    localStorage.removeItem('token');
                    $rootScope.logged_in = false;
                    $rootScope.user_basic = {};
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('card', data.card);
                    var holdpickup = sessionStorage.getItem('holds');
                    if ((data.holds_ready >= 1) && (holdpickup != 'yep')) {
                        popup.alert('Holds available', 'You have holds available for pickup.');
                        sessionStorage.setItem('holds', 'yep');
                    }
                    $rootScope.user_basic = data;
                    $rootScope.logged_in = true;
                }
            }).error(function() {
                $rootScope.hide_loading();
                popup.alert('Oops', 'An error has occurred, please try again.');
            });
        }
    }
});

// Node Modal factory
app.factory('node_details', function($http, $ionicModal, $rootScope, popup) {
    return {
        show: function(nid, $scope) {
            $scope = $scope || $rootScope.$new();
            $ionicModal.fromTemplateUrl('templates/node_modal.html', function(modal) {
                $scope.modal = modal;
            },
            {
                scope: $scope,
                animation: 'slide-in-up'
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modal.hide();
            };
            $rootScope.show_loading('Loading&nbsp;details...');
            $http({
                method: 'GET',
                url: webNode + nid,
                timeout: 15000,
            }).success(function(data) {
                $rootScope.hide_loading();
                var nodebody = jQuery('<div>' + data.nodes[0].node.body + '</div>').text();
                var nodetitle = jQuery('<span>' + data.nodes[0].node.nodetitle + '</span>').text();
                $scope.node = data.nodes[0].node;
                $scope.node.body = nodebody;
                $scope.node.nodetitle = nodetitle;
                $scope.openModal();
            }).error(function() {
                $rootScope.hide_loading();
                popup.alert('Oops', 'An error has occurred, please try again.');
            });
        }
    }
});

// New Modal factory
app.service('ModalService', function($ionicModal,$rootScope) {
    var init = function(tpl, $scope) {
        var promise;
        $scope = $scope || $rootScope.$new();

        promise = $ionicModal.fromTemplateUrl(tpl, {
            scope: $scope,
            animation: 'slide-up-in'
        }).then(function(modal) {
            $scope.modal = modal;
            return modal;
        });

        $scope.openModal = function() {
            $scope.modal.show();
        }
        $scope.closeModal = function() {
            $scope.modal.hide();
        }
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        return promise;
    }

    return {
        init: init
    }
});

// New Details factory
app.factory('itemDetail', function($http,$rootScope) {
    var item = [];

    return {
        get: function(record_id) {
            $rootScope.show_loading('Loading details...');
            return $http({
                        method: 'GET',
                        url: ilsItemDetails,
                        params: {"id": record_id},
                        timeout: 15000,
            }).then(function(response) {
                item = response;
                $rootScope.hide_loading();
                return item.data;
            });
            return null;
        }
    }
});

// Item Modal factory
app.factory('item_details', function($http, $ionicModal, $rootScope, popup) {
    return {
        show: function(record_id) {
            $scope = $rootScope.$new();
            $ionicModal.fromTemplateUrl('templates/item_modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
                console.log($scope.modal);
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modal.hide();
            };
            $scope.$on('$destroy', function() {
                $scope.modal.remove();
            });

            $rootScope.show_loading('Loading&nbsp;details...');

            $http({
                method: 'GET',
                url: ilsItemDetails,
                params: {"record": record_id},
                timeout: 15000,
            }).success(function(data) {
                $rootScope.hide_loading();
                $scope.openModal();
                $scope.details = data.item_details
                if (data.item_details['title'].indexOf("/")) {
                    var pretitle = data.item_details['title'].split("/");
                    $scope.title = pretitle[0];
                } else {
                    $scope.title = data.item_details['title'];
                }
                $scope.copies = data.copies;
                $scope.copies_on_shelf = data.copies_on_shelf;
                var locations = new Array();
                for (var i = 0; i< data.copies_on_shelf.length; i++) {
                    locations.push(data.copies_on_shelf[i]['location']);
                }
                $scope.locations = jQuery.unique(locations);
            }).error(function() {
                $rootScope.hide_loading();
                popup.alert('Oops', 'An error has occurred, please try again.');
            });
        }
    }
});

// Popup Alert factory
app.factory('popup', function($rootScope, $ionicPopup, $timeout) {
    return {
        alert: function(title, message, $scope) {
            $scope = $scope || $rootScope.$new();
            var alertPopup = $ionicPopup.alert({
                title: title,
                template: message
            });
            alertPopup.then(function(res) {
            });
            $timeout(function() {
                alertPopup.close();
            }, 20000);
        }
    }
});

// Hold factory
app.factory('hold', function($http, $rootScope, $ionicPopup, login, popup) {
    var self = {}
    self.place = function(record_ids, force) {
        var record_ids = record_ids
        if ($rootScope.logged_in == false) {
            popup.alert('Authorization required', 'Please log in to place holds.')
        } else {
            $rootScope.show_loading('Placing&nbsp;hold...');
            var token = localStorage.getItem('token');
            $http({
                method: 'GET',
                url: ilsAccountHoldsPlace,
                params: {"record_ids": record_ids, "token": token, "force": force},
                timeout: 15000,
            }).success(function(data) {
                $rootScope.hide_loading();
                if (data.message != "Invalid token") {
                    if (data.confirmation_messages[0].message == 'Placing this hold could result in longer wait times.') {
                        var warnPopup = $ionicPopup.confirm({
                            title: 'Hold Response',
                            template: data.confirmation_messages[0].message,
                            okText: 'OK',
                            cancelText: 'Cancel'
                        });
                        warnPopup.then(function(res) {
                            if (res) { self.place(record_ids, 'true'); }
                        });
                    }
                    if (data.confirmation_messages[0].message != 'Placing this hold could result in longer wait times.') {
                        popup.alert('Hold Response', data.confirmation_messages[0].message);
                    }
                    if (data.confirmation_messages[0].message == 'Hold was successfully placed' || data.confirmation_messages[0].message == 'Hold was not successfully placed Problem: User already has an open hold on the selected item' ) {
                        var hold_button = document.getElementById('hold_' + record_ids);
                        hold_button.innerHTML = "On Hold";
                        hold_button.disabled = true;
                        login.login();
                    }
                } else {
                    login.login();
                    popup.alert('Temporary error', 'The system encountered a temporary error, but it should be resolved now. Please try that again.');
                }
            }).error(function() {
                $rootScope.hide_loading();
                popup.alert('Oops', 'An error has occurred, please try again.');
            });
        }
    }

    return self;
});

// err-src directive
app.directive('errSrc', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('error', function() {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
            element.bind('load', function() {
                var image = new Image();
                image.src = attrs.src;
                var w = image.width;
                if (w == 1) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
        }
    }
});
