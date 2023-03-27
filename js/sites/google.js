/* global chrome, Node */

(function () {
  const searchSite = {
    isPrimarySite: false,
    resultCount: 0,
    linkCache: {}
  }

  searchSite.extractQuery = function (location) {
    const params = new URLSearchParams(location.search)

    return params.get('q')
  }

  searchSite.matchesSearchSite = function (location) {
    if (['google.com', 'www.google.com'].includes(location.host) === false) {
      return false
    }

    if (location.href.includes('/uviewer')) {
      return false
    }

    const searchQuery = this.extractQuery(location)

    if (searchQuery === null || searchQuery === undefined || searchQuery === '') {
      return false
    }

    return true
  }

  searchSite.extractQueryType = function (location) {
    const params = new URLSearchParams(location.search)

    const tbm = params.get('tbm')

    if (tbm === 'isch') {
      return 'image'
    }

    if (tbm === 'nws') {
      return 'news'
    }

    if (tbm === 'shop') {
      return 'shopping'
    }

    return 'web'
  }

  searchSite.searchUrl = function (query, queryType) {
    if (queryType === 'image') {
      return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(query)
    }

    if (queryType === 'news') {
      return 'https://www.google.com/search?tbm=nws&q=' + encodeURIComponent(query)
    }

    if (queryType === 'shopping') {
      return 'https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(query)
    }

    return 'https://www.google.com/search?q=' + encodeURIComponent(query)
  }

  searchSite.extractResults = function () {
    const me = searchSite

    const query = searchSite.extractQuery(window.location)
    const queryType = searchSite.extractQueryType(window.location)

    if (queryType === 'image') {
      const results = document.querySelectorAll('div[data-ved][data-ow][data-oh]')

      results.forEach(function (element) {
        const titles = element.querySelectorAll('h3')

        if (titles.length > 0) {
          const hrefs = element.querySelectorAll('a[target="_blank"]')

          let href = null

          hrefs.forEach(function (hrefElement) {
            const url = hrefElement.getAttribute('href')

            const lowerUrl = url.toLowerCase()

            if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
              href = url
            }
          })

          if (href !== null && me.linkCache[href] === undefined) {
            let title = ''

            titles.forEach(function (titleElement) {
              titleElement.childNodes.forEach(function (childNode) {
                if (childNode.nodeType === Node.TEXT_NODE) {
                  title += childNode.nodeValue
                }
              })
            })

            let imageHref = null

            const images = element.querySelectorAll('img[alt][width][height]')

            images.forEach(function (image) {
              if (image.getAttribute('src') !== null) {
                imageHref = image.getAttribute('src')
              }
            })

            const content = element.outerHTML

            me.resultCount += 1

            const payload = {
              title,
              link: href,
              search_url: window.location.href,
              'image_url@': imageHref,
              content,
              query,
              type: queryType,
              foreground: me.isPrimarySite,
              engine: 'google',
              index: me.resultCount
            }

            if (imageHref !== null) {
              window.cookieManagerPopulateContent(imageHref, title, payload, 'image_url@', function () {
                chrome.runtime.sendMessage({
                  content: 'record_data_point',
                  generator: 'search-mirror-result',
                  payload: payload // eslint-disable-line object-shorthand
                })
              })
            } else {
              delete payload['image_url@']

              chrome.runtime.sendMessage({
                content: 'record_data_point',
                generator: 'search-mirror-result',
                payload: payload // eslint-disable-line object-shorthand
              })
            }

            me.linkCache[href] = payload
          }
        }
      })
    } else if (queryType === 'web') {
      const results = document.querySelectorAll('a[href][data-ved][ping]')

      results.forEach(function (element) {
        const titles = element.querySelectorAll('h3')
        const cites = element.querySelectorAll('cite')

        if (titles.length > 0 && cites.length > 0) {
          const href = element.getAttribute('href')

          if (me.linkCache[href] === undefined) {
            let title = ''

            titles.forEach(function (titleElement) {
              titleElement.childNodes.forEach(function (childNode) {
                if (childNode.nodeType === Node.TEXT_NODE) {
                  title += childNode.nodeValue
                }
              })
            })

            let citation = ''

            cites.forEach(function (citeElement) {
              citeElement.childNodes.forEach(function (childNode) {
                if (childNode.nodeType === Node.TEXT_NODE) {
                  citation += childNode.nodeValue
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                  childNode.childNodes.forEach(function (grandChildNode) {
                    if (grandChildNode.nodeType === Node.TEXT_NODE) {
                      citation += grandChildNode.nodeValue
                    }
                  })
                }
              })
            })

            const content = element.parentNode.parentNode.parentNode.outerHTML

            me.resultCount += 1

            const payload = {
              title,
              citation,
              link: href,
              search_url: window.location.href,
              content,
              query,
              type: queryType,
              foreground: me.isPrimarySite,
              engine: 'google',
              index: me.resultCount
            }

            console.log('[Search Mirror / google] Got result[' + me.resultCount + ']: ' + title)
            // console.log(payload)

            chrome.runtime.sendMessage({
              content: 'record_data_point',
              generator: 'search-mirror-result',
              payload: payload // eslint-disable-line object-shorthand
            })

            me.linkCache[href] = payload
          }
        }
      })
    }
  }

  window.registerSearchMirrorSite('google', searchSite)
})(); // eslint-disable-line semi, no-trailing-spaces
