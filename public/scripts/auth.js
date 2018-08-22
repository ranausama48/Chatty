function Auth(){
    var self = this;
    //Data
    this.url = 'http://localhost:8080';
    this.state = {
        auth: 'signin'
    }

    //Event Listeners
    $('#showSignUpBtn').click(this.showSignUp.bind(this));
    $('#showSignInBtn').click(this.showSignIn.bind(this));
    $('#authForm').submit(this.submitForm.bind(this));
}

Auth.prototype.submitForm = function(e) {
    e.preventDefault();
    var user = {};

    if(this.state.auth === 'signup'){
        if($('#confirmPassword').val() === $('#password').val()){
            user.username = $('#username').val();
            user.password = $('#password').val();
            user.firstName = $('#firstName').val();
            user.lastName = $('#lastName').val();

            $.post(this.url + '/api/auth/signUp', user)
            .then(function(data){
                $('#authAlert').removeClass('d-none alert-danger');
                $('#authAlert').addClass('alert-success');
                $('#authAlert').html(data.message);
            })
            .catch(function(err){
                $('#authAlert').removeClass('d-none alert-success');
                $('#authAlert').addClass('alert-danger');
                $('#authAlert').html('There was a problem signing in with your account');
            })
        } else {
            $('#authAlert').removeClass('d-none');
            $('#authAlert').addClass('alert-danger');
            $('#authAlert').html('Please check the fields.');            
        }
    } 
    
    if(this.state.auth === 'signin'){
        console.log("HERE I AM");

        user.username = $('#username').val();
        user.password = $('#password').val();

        $.post(this.url + '/api/auth/signIn', user)
        .then(function(data){
            window.localStorage.setItem('token', data.token);
            $(location).attr('href', 'chat.html')
        })
        .catch(function(err){
            $('#authAlert').removeClass('d-none');
            $('#authAlert').addClass('alert-danger');
            $('#authAlert').html('Please check the fields.');              
        })
    }
}

Auth.prototype.clearForm = function(){
    $("#authForm").trigger('reset');
    $('#authAlert').addClass('d-none');
}

Auth.prototype.showSignUp = function() {
    this.clearForm();

    $('#authTitle').text('Sign up now!');
    $('#submitBtn').html('Sign up');
 
    $('#rememberMe').addClass('d-none');
    $('#showSignUpBtn').addClass('d-none');

    $('#confirmPassword').removeClass('d-none');
    $('#showSignInBtn').removeClass('d-none');
    $('#firstName').removeClass('d-none');
    $('#lastName').removeClass('d-none');

    this.state.auth = 'signup';
}

Auth.prototype.showSignIn = function() {
    this.clearForm();

    $('#authTitle').text('Sign in');
    $('#submitBtn').html('Sign in');

    $('#rememberMe').removeClass('d-none');
    $('#showSignUpBtn').removeClass('d-none');

    $('#showSignInBtn').addClass('d-none');
    $('#confirmPassword').addClass('d-none');
    $('#firstName').addClass('d-none');
    $('#lastName').addClass('d-none');

    this.state.auth = 'signin';
}

$(document).ready(function(){
    var auth = new Auth();
})