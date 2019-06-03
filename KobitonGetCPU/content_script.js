function loadLocalVariables() {
  let username
  let apikey
  let sessionId
  let dropdown = document.getElementById("apiURL")
  let env = dropdown.options[dropdown.selectedIndex].text
  let url
  switch (env) {
    case 'Test':
      username = localStorage.usernameTest || document.getElementById("username").value
      apikey = localStorage.apikeyTest || document.getElementById("apikey").value
      sessionId = localStorage.sessionIdTest || document.getElementById("sessionId").value
      url = 'https://portal-test.kobiton.com'
      break
    case 'Staging':
      username = localStorage.usernameStaging
      apikey = localStorage.apikeyStaging
      sessionId = localStorage.sessionIdStaging
      url = 'https://portal-staging.kobiton.com'
      break
    case 'Production':
      username = localStorage.usernameProduction
      apikey = localStorage.apikeyProduction
      sessionId = localStorage.sessionIdProduction
      url = 'https://portal.kobiton.com'
      break
    default:
      username = localStorage.usernameTest
      apikey = localStorage.apikeyTest
      sessionId = localStorage.sessionIdTest
      url = 'https://portal-test.kobiton.com'
  }

  document.getElementById("apiURLInfo").innerHTML = 'Environment: <a target="_blank" href="' + url + '">' + url + '</a>'
  document.getElementById("SessionsLink").innerHTML = 'All Sessions: <a target="_blank" href="' + url + '/sessions">' + url + '/sessions</a>'
  document.getElementById("SessionDetailsLink").innerHTML = 'Session Details: <a target="_blank" href="' + url + '/sessions/"' + sessionId + '>' + url + '/sessions/' + sessionId + '</a>'

  document.getElementById("username").innerHTML = username
  document.getElementById("username").value = username
  document.getElementById("apikey").innerHTML = apikey
  document.getElementById("apikey").value = apikey
  document.getElementById("sessionId").innerHTML = sessionId
  document.getElementById("sessionId").value = sessionId
}

$(document).ready(function() {
  loadLocalVariables()
})

$(document).ready(function() {
  $('#apiURL').change(function() {
    let env = document.getElementById("apiURL").value
    loadLocalVariables(env)
  })
})

$(document).ready(function() {
  $('#save').click(function() {

    let dropdown = document.getElementById("apiURL")
    let env = dropdown.options[dropdown.selectedIndex].text
    console.log(env)
    let username
    let apikey
    let sessionId
    switch (env) {
      case 'Test':
        username = 'usernameTest'
        apikey = 'apikeyTest'
        sessionId = 'sessionIdTest'
        break;
      case 'Staging':
        username = 'usernameStaging'
        apikey = 'apikeyStaging'
        sessionId = 'sessionIdStaging'
        break;
      case 'Production':
        username = 'usernameProduction'
        apikey = 'apikeyProduction'
        sessionId = 'sessionIdProduction'
        break;
      default:
        username = 'usernameTest'
        apikey = 'apikeyTest'
        sessionId = 'sessionIdTest'
    }
    localStorage.setItem(username, document.getElementById('username').value)
    localStorage.setItem(apikey, document.getElementById('apikey').value)
    localStorage.setItem(sessionId, document.getElementById('sessionId').value)
    dropdown = document.getElementById("apiURL")
    env = dropdown.options[dropdown.selectedIndex].text
    localStorage.setItem("apiURL", env)
  })
})

$(document).ready(function() {
  $('#connect').click(function() {
    const apiURL = document.getElementById('apiURL').value
    const username = document.getElementById('username').value
    const apikey = document.getElementById('apikey').value
    const sessionId = document.getElementById('sessionId').value
    const interval = document.getElementById('interval').value
    const threads = document.getElementById('connections').value
    const basicAuth = "Basic " + btoa(`${username}:${apikey}`)
    console.log(basicAuth)
    const headers = {
      Authorization: basicAuth,
      Accept: 'application/json'
    }
    getWsURL(apiURL, sessionId, interval, threads, headers)
  })
})

$(document).ready(function() {
  $('#sessionInfo').click(function() {
    document.getElementById("sInfo").innerHTML = ''
    const sessionId = document.getElementById('sessionId').value
    const username = document.getElementById('username').value
    const apikey = document.getElementById('apikey').value
    const apiURL = document.getElementById('apiURL').value
    const basicAuth = "Basic " + btoa(`${username}:${apikey}`)
    const headers = {
      Authorization: basicAuth,
      Accept: 'application/json'
    }
    getASession(apiURL, sessionId, headers)
  })
})

$(document).ready(function() {
  $('#clearLog').click(function() {
    document.getElementById("log").innerHTML = ''
  })
})

function getASession(apiURL, sessionId, headers) {
  $.ajax({
    url: `${apiURL}/v1/sessions/${sessionId}`,
    method: 'get',
    headers,
    success: function(data) {
      document.getElementById("sInfo").innerHTML = JSON.stringify(data)
    },
    error: function(xhr, ajaxOptions, thrownError) {
      document.getElementById("sError").innerHTML = 'Error: Status code: ' + xhr.status + ' Message: ' + thrownError
    }
  })
}

function getWsURL(apiURL, id, interval, threads = 1, headers) {
  $.ajax({
    url: `${apiURL}/v1/sessions/${id}/getDeviceMetricsUrlStream?interval=${interval}`,
    method: 'get',
    headers,
    error: function(xhr, ajaxOptions, thrownError) {
      document.getElementById("sError").innerHTML = 'Error: Status code: ' + xhr.status + ' Message: ' + thrownError
    },
    success: function({
      url
    }) {
      stop = true
      for (let i = 1; i <= threads; i++) {
        connectWs(url)
      }
    }
  })
}

function connectWs(url) {
  const socket = new WebSocket(url)
  socket.onopen = () => console.log(`${url} is open.`)
  socket.onmessage = (msg) => {
    if (msg) {
      const ws_url = msg.currentTarget.url
      let data = $.parseJSON(msg.data)
      const date = new Date(data.at)
      console.log('data', data)
      if (data.cpu !== undefined) {

        $("#log").append("<tr>" +
          "<td>" + ws_url.substr(ws_url.length - 5) + "</td>" +
          "<td>" + dateToYMD(date) + "</td>" +
          "<td>" + data.cpu + "</td>" +
          "<td>" + data.memory + "</td>" +
          "<td>" + data.wifi.receivedBytes + "</td>" +
          "<td>" + data.wifi.transmittedBytes + "</td>" +
          "</tr>")
      }
    }
  }
  socket.onclose = (msg) => {
    console.log('msg', msg)
  }
}

function dateToYMD(date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  return '' + h + ':' + (m <= 9 ? '0' + m : m) + ':' + (s <= 9 ? '0' + s : s)
}