$(() => {
  $('.ui.dropdown').dropdown({
    on: 'hover'
  });

  $('.tooltip-element').popup({
    hoverable: true,
    position: 'top center'
  });

  $('#log-out-button').on('click', () => {
    $.ajax({
      method: 'POST',
      url: '/logout',
      timeout: 10000
    }).done(() => {
      window.location.href = '/';
    }).fail(() => {
      // This should never happen because the server always sends status 200 OK
      console.error('Error logging out');
    });
  });
});
