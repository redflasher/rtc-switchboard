  //UI Volume
  $(function()//ready
  {

    localVideo = document.getElementById("localVideo");
    remoteVideo = document.getElementById("remoteVideo");

    autoReconnect = (getCookie("autoReconnect") == "true" ? true : false);

    if(autoReconnect)
    {
      $("[name=autoReconnectCheckbox]").prop( "checked",true );
      initialize();
    }

  });
  //end UI Volume
  