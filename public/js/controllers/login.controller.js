(function() {
    'use strict';

    angular
        .module('app')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['UserService', '$location', 'AuthenticationService', 'FlashService', '$rootScope'];

    function LoginController(UserService, $location, AuthenticationService, FlashService, $rootScope) {
        var vm = this;
        vm.login = login;

        //Everytime login page is loaded, mark the page as login and clear if any existing credentials are set
        (function initController() {
            $rootScope.dynamicPageClass = "login";
            AuthenticationService.ClearCredentials();
        })();

        function login() {
            vm.dataLoading = true;
            UserService.AuthenticateUser(vm.user)
                .then(function(response) {
                    if (response.success) {
                        AuthenticationService.SetCredentials(vm.user.username, vm.user.password, response.user_id, response.fullName, response.imageData);
                        $location.path('/home');
                    } else {
                        FlashService.Error(response.message);
                        vm.dataLoading = false;
                    }
                });
        }
    }
})();
