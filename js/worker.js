/* global chrome, registerCustomModule, registerMessageHandler */

(function () {
  const fetchURLContent = function (request, sender, sendResponse) {
    console.log('[Search Mirror] Fetching ' + request.url + '...')

    if (request.content === 'fetch_url_content') {
      const url = request.url

      fetch(url, {
        redirect: 'follow' // manual, *follow, error
      })
        .then(response => response.text())
        .then(function (textBody) {
          console.log('[Search Mirror] Fetched: ' + textBody)

          sendResponse(textBody)
        })

      return true
    }

    return false
  }

  const stringToId = function (str) {
    let id = str.length

    Array.from(str).forEach((it) => {
      id += it.charCodeAt()
    })

    return id * 10000 + 6794
  }

  registerCustomModule(function (config) {
    let urlFilters = [
      '||bing.com/',
      '||www.bing.com/',
      '||google.com/',
      '||www.google.com/',
      '||duckduckgo.com/'
    ]

    if (config['search-mirror'] !== undefined) {
      if (config['search-mirror']['url-filters'] !== undefined) {
        urlFilters = config['search-mirror']['url-filters']
      }
    }

    for (const urlFilter of urlFilters) {
      const stripRule = {
        id: stringToId('search-mirror-' + urlFilter),
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'x-frame-options', operation: 'remove' },
            { header: 'content-security-policy', operation: 'remove' }
          ]
        },
        condition: { urlFilter, resourceTypes: ['main_frame', 'sub_frame'] }
      }

      chrome.declarativeNetRequest.updateSessionRules({
        addRules: [stripRule]
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('[Search Mirror] ' + chrome.runtime.lastError.message)
        }
      })

      console.log('[Search Mirror] Added URL filter: ' + urlFilter)
    }

    registerMessageHandler('fetch_url_content', fetchURLContent)

    console.log('[Search Mirror] Initialized.')
  })
})()
