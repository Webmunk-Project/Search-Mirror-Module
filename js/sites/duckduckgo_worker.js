/* global chrome, handleMessage */

(function () {
  chrome.webRequest.onCompleted.addListener(async function (details) {
    if (details.initiator === undefined || details.initiator.includes('chrome-extension://')) {
      return
    }

    // https://duckduckgo.com/ac/?q=wol&kl=wt-wt

    if (details.url.includes('duckduckgo.com/ac')) {
      console.log('[Search Mirror / duckduckgo] Autocomplete Request: ' + details.url)

      const searchUrl = new URL(details.url)

      const query = searchUrl.searchParams.get('q')

      if (query !== null && query !== '') {
        // console.log(details)

        fetch(details.url)
          .then(response => response.text())
          .then(function (data) {
            const payload = {
              engine: 'duckduckgo',
              query,
              initiator: details.initiator,
              search_url: details.url
            }

            const dataJson = JSON.parse(data)

            // console.log(dataJson)

            const dataPayload = []

            dataJson.forEach(function (suggestion) {
              dataPayload.push({
                term: suggestion.phrase,
                subtitle: '',
                data: suggestion
              })
            })

            // console.log('[Search Mirror / duckduckgo] Data Payload (Parsed):')
            // console.log(dataPayload)

            payload.suggestions = dataPayload

            handleMessage({
              content: 'record_data_point',
              generator: 'search-suggestions-result',
              payload: payload // eslint-disable-line object-shorthand
            }, {
              tab: {
                id: details.tabId
              }
            }, function (logResponse) {
              // console.log('[Search Mirror / duckduckgo] Data Point Logged:')
              // console.log(logResponse)
            })
          })
      }
    }
  }, {
    urls: ['<all_urls>']
  }, ['responseHeaders', 'extraHeaders'])
})(); // eslint-disable-line semi, no-trailing-spaces
