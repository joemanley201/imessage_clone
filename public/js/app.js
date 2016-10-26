(function() {
    'use strict';

    angular
        .module('app', ['ngRoute', 'ngCookies'])
        .config(config)
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];

    function config($routeProvider, $locationProvider) {
        $routeProvider
            .when('/home', {
                controller: 'HomeController',
                templateUrl: 'views/home-frag.html',
                controllerAs: 'vm'
            })

        .when('/login', {
            controller: 'LoginController',
            templateUrl: 'views/login-frag.html',
            controllerAs: 'vm'
        })

        .when('/register', {
                controller: 'RegisterController',
                templateUrl: 'views/register-frag.html',
                controllerAs: 'vm'
            })
            .when('/logout', {
                redirectTo: '/login'
            })

        .otherwise({ redirectTo: '/login' });
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http', '$window', 'AuthenticationService'];

    function run($rootScope, $location, $cookieStore, $http, $window, AuthenticationService) {
        //Initialize socket
        $rootScope.socket = io();

        //Emit disconnect on window unload
        $window.onbeforeunload = function() {
            $rootScope.socket.emit('disconnect', null);
            AuthenticationService.ClearCredentials();
        }

        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
        }

        $rootScope.$on('$locationChangeStart', function(event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }
})();
