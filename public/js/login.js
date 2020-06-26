'use strict';

$(() => {
  const usernameInput = $('#username-input');
  const passwordInput = $('#password-input');
  const loginButton = $('#login-button');
  const signupButton = $('#signup-button');
  const errorMessageBox = $('#login-error-message-box');
  const errorMessageText = $('#login-error-message-text');

  loginButton.on('click', () => {
    loginButton.addClass(['disabled', 'elastic', 'loading']);
    signupButton.addClass('disabled');
    errorMessageBox.addClass('hidden');

    const username = usernameInput.val();
    const password = passwordInput.val();

    $.ajax({
      method: 'POST',
      url: '/login',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      contentType: 'application/json',
      timeout: 10000
    }).done(() => {
      const url = new URL(window.location);
      window.location.href = url.searchParams.has('dest') ? url.searchParams.get('dest') : '/';
    }).fail((xhr, statusText) => {
      let errorMessage = '';
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      } else if (statusText === 'timeout') {
        errorMessage = 'The login request timed out. Please check your internet connection and try again.';
      } else {
        console.log(xhr);
        errorMessage = 'The login request encountered an unknown error. Please contact the system administrator.';
      }
      errorMessageText.text(errorMessage);

      loginButton.removeClass(['disabled', 'elastic', 'loading']);
      signupButton.removeClass('disabled');
      errorMessageBox.removeClass('hidden');
    });
  });

  signupButton.on('click', () => {
    loginButton.addClass('disabled');
    signupButton.addClass(['disabled', 'elastic', 'loading']);
    errorMessageBox.addClass('hidden');

    const username = usernameInput.val();
    const password = passwordInput.val();

    $.ajax({
      method: 'POST',
      url: '/signup',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      contentType: 'application/json',
      timeout: 10000
    }).done(() => {
      const url = new URL(window.location);
      window.location.href = url.searchParams.has('dest') ? url.searchParams.get('dest') : '/';
    }).fail((xhr, statusText) => {
      let errorMessage = '';
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      } else if (statusText === 'timeout') {
        errorMessage = 'The signup request timed out. Please check your internet connection and try again.';
      } else {
        console.log(xhr);
        errorMessage = 'The signup request encountered an unknown error. Please contact the system administrator.';
      }
      errorMessageText.text(errorMessage);

      loginButton.removeClass('disabled');
      signupButton.removeClass(['disabled', 'elastic', 'loading']);
      errorMessageBox.removeClass('hidden');
    });
  });
});
