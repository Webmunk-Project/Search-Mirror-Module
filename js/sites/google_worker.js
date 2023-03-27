/* global chrome, handleMessage */

(function () {
  chrome.webRequest.onCompleted.addListener(async function (details) {
    if (details.initiator === undefined || details.initiator.includes('chrome-extension://')) {
      return
    }

    if (details.url.includes('google.com/complete/search')) {
      console.log('[Search Mirror / google] Autocomplete Request: ' + details.url)

      const searchUrl = new URL(details.url)

      const query = searchUrl.searchParams.get('q')

      if (query !== null && query !== '') {
        // console.log(details)

        fetch(details.url)
          .then(response => response.text())
          .then(function (data) {
            const payload = {
              engine: 'google',
              query,
              initiator: details.initiator,
              search_url: details.url
            }

            if (data.startsWith(')]}\'')) {
              data = data.substring(4)

              const dataJson = JSON.parse(data)

              console.log(dataJson)

              const dataPayload = []

              const suggestions = dataJson[0]

              suggestions.forEach(function (suggestion) {
                let subtitle = ''

                if (suggestion.length > 3) {
                  subtitle = suggestion[3].zi
                }

                dataPayload.push({
                  term: suggestion[0],
                  subtitle,
                  data: suggestion
                })
              })

              console.log('[Search Mirror / google] Data Payload (Parsed):')
              console.log(dataPayload)

              payload.suggestions = dataPayload
            } else {
              console.log('[Search Mirror / google] Data Payload (Raw):')
              console.log(data)

              payload.raw_suggestions = data
            }

            handleMessage({
              content: 'record_data_point',
              generator: 'search-suggestions-result',
              payload: payload // eslint-disable-line object-shorthand
            }, {
              tab: {
                id: details.tabId
              }
            }, function (logResponse) {
              // console.log('[Search Mirror / google] Data Point Logged:')
              // console.log(logResponse)
            })
          })
      }
    }
  }, {
    urls: ['<all_urls>']
  }, ['responseHeaders', 'extraHeaders'])
})(); // eslint-disable-line semi, no-trailing-spaces
