/* global chrome, registerCustomModule, registerMessageHandler */

(function () {
  const fetchURLContent = function (request, sender, sendResponse) {
    console.log('[Background Fetch] Fetching ' + request.url + '...')

    if (request.content === 'fetch_url_content') {
      const url = request.url

      fetch(url, {
        redirect: 'follow' // manual, *follow, error
      })
        .then(response => response.text())
        .then(function (textBody) {
          console.log('[Background Fetch] Fetched: ' + textBody)

          sendResponse(textBody)
        })

      return true
    }

    return false
  }

  registerCustomModule(function (config) {
    console.log('[Background Fetch] Initialized.')

    const stringToId = function (str) {
      let id = str.length
      Array.from(str).forEach((it) => {
        id += it.charCodeAt()
      })
      return id * 10000 + 6794
    }

    const stripRule = {
      id: stringToId('strip'),
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'x-frame-options', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' }
        ]
      },
      condition: { urlFilter: '*', resourceTypes: ['main_frame', 'sub_frame'] }
    }

    chrome.declarativeNetRequest.updateSessionRules({
      addRules: [stripRule]
    }, () => {
      if (chrome.runtime.lastError) {
        console.log('[Background Fetch] ' + chrome.runtime.lastError.message)
      }
    }
    )

    console.log('[Background Fetch] Added rule.')

    registerMessageHandler('fetch_url_content', fetchURLContent)
  })
})()
