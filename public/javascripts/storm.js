var Storm = angular.module('Storm', ['ipCookie']);

Storm.controller('StormController', ['$scope', '$http', 'ipCookie', function($scope, $http, ipCookie) {
    $scope.LOADING = {show: false};
    function show_loading() { $scope.LOADING.show = true; }
    function hide_loading() { $scope.LOADING.show = false; }

    $scope.LOGIN = {
        signed_in: is_logged_in()
    };

    $scope.company = '';
    $scope.is_admin = undefined;
    $scope.username = '';
    $scope.USER = {};

    $scope.COMMENT = {};

    $scope.status_counts = {
        open: 0,
        as_expected: 0,
        closed: 0
    };

    function show_msg(status, msg) {
        alert(msg);
    }

    $scope.show_msg = show_msg;

    function noe(i) { return [undefined, null, ''].indexOf(i) > -1; }

    function is_logged_in() {
        $scope.company = ipCookie('company');
        $scope.is_admin = ipCookie('is_admin');
        return !noe(ipCookie('__auth'));
    }

    var SERVICES = {
        get_bugs: "/api/bugs/list",
        get_bug: function (bug_id) { return "/api/bugs/" + bug_id; },
        report_bug: "/api/bugs/report",
        add_comment: "/api/bugs/comment",
        login: "/api/accounts/login",
        logout: "/api/accounts/logout",
        change_status: "/api/bugs/status"
    };

    $scope.ACTIVE_SECTION = "all_bugs";

    $scope.all_bugs = [];
    $scope.current_bug = {};

    function init_bug() {
        $scope.current_bug = {
            priority: 'regular'
        };
    }

    $scope.show_report_screen = function () {
        init_bug();
        $scope.ACTIVE_SECTION = 'view_bug';
    };

    $scope.show_all_bugs = function () {
        $scope.ACTIVE_SECTION = 'all_bugs';
    };

    function get_bugs() {

        show_loading();

        $http({
            method: 'GET',
            url: SERVICES.get_bugs
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.all_bugs = data.data;
            update_status_counts();
        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    }

    function update_status_counts() {
        $scope.status_counts = {
            open: 0,
            as_expected: 0,
            closed: 0,
            regular: 0,
            major: 0,
            enhancement: 0
        };

        $scope.all_bugs.forEach(function (bug) {
            $scope.status_counts[bug.status] ++;
            $scope.status_counts[bug.priority] ++;
        });
    }

    $scope.get_bug = function (bug_id) {

        show_loading();

        $http({
            method: 'GET',
            url: SERVICES.get_bug(bug_id)
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.current_bug = data.data;

            $scope.ACTIVE_SECTION = 'view_bug';

        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    };

    $scope.login = function () {
        show_loading();

        $http({
            method: 'POST',
            url: SERVICES.login,
            data: {
                username: $scope.LOGIN.username,
                password: $scope.LOGIN.password
            }
        }).success(function(data) {
            hide_loading();
            if (!data.auth) {
                show_msg('error', 'Invalid Username or Password');
                return;
            }

            $scope.company = data.company;
            $scope.username = data.username;
            $scope.is_admin = data.is_admin;
            $scope.USER = data;

            $scope.LOGIN.signed_in = true;

            get_bugs();
        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    };

    $scope.logout = function () {
        show_loading();

        $http({
            method: 'GET',
            url: SERVICES.logout
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.LOGIN.signed_in = false;
        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    };

    $scope.report_bug = function () {
        show_loading();

        $http({
            method: 'POST',
            url: SERVICES.report_bug,
            data: $scope.current_bug
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.get_bug(data.data.id);

        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    };

    $scope.add_comment = function () {
        show_loading();

        $http({
            method: 'POST',
            url: SERVICES.add_comment,
            data: {
              "id": $scope.current_bug.id,
              "comment": $scope.COMMENT.comment
            }
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.COMMENT.comment = undefined;
            $scope.get_bug($scope.current_bug.id);
        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    };

    function change_status(status) {
        show_loading();

        $http({
            method: 'POST',
            url: SERVICES.change_status,
            data: {
                "id": $scope.current_bug.id,
                "status": status
            }
        }).success(function(data) {
            hide_loading();
            if (data.status !== 'success') {
                $scope.show_msg('error', data.data);
                return false;
            }

            $scope.get_bug($scope.current_bug.id);
        }).error(function(data) {
            hide_loading();
            $scope.show_msg('error', data.data);
        });
    }

    $scope.mark_resolved = function () {
        change_status('closed');
    };

    $scope.mark_as_expected = function () {
        change_status('as_expected');
    };

    if (is_logged_in()) {
        get_bugs();
    }

    init_bug();


}]);

Storm.filter('date_pretty', function() {
    return function(orig_date) {
        try {
            return orig_date.split('T')[0].split('-').reverse().join('-');
        } catch(e) {
            return orig_date;
        }
    };
});
