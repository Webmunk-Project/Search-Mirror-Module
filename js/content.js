/* global */

(function () {
  window.searchMirrorSites = {}

  window.registerSearchMirrorSite = function (siteKey, siteObject) {
    window.searchMirrorSites[siteKey] = siteObject
  }

  window.registerModuleCallback(function (config) {
    console.log('[Search Mirror] Checking if ' + window.location.href + ' is search site...')

    const insertMirrorSite = function (identifier, location) {
      const wrapper = document.createElement('div')

      const htmlCode = '<iframe id="background_fetch_frame' + identifier + '" src="' + location + '" style="display: block; height: 40px; border: thin solid black; opacity: 1.0;"></iframe>'

      wrapper.innerHTML = htmlCode

      document.querySelector('body').appendChild(wrapper.firstChild)

      console.log('[Search Mirror] Inserted ' + identifier + ' background search: ' + location)
    }

    if (window.location === window.parent.location) { // Top frame
      let matchedSearchSiteKey = null

      for (const [siteKey, siteObject] of Object.entries(window.searchMirrorSites)) {
        if (siteObject.matchesSearchSite(window.location)) {
          matchedSearchSiteKey = siteKey
        }
      }

      if (matchedSearchSiteKey !== null) {
        console.log('[Search Mirror] ' + window.location.href + ' is a search site (primary).')

        const thisSearchSite = window.searchMirrorSites[matchedSearchSiteKey]

        const query = thisSearchSite.extractQuery(window.location)
        const queryType = thisSearchSite.extractQueryType(window.location)

        for (const [siteKey, siteObject] of Object.entries(window.searchMirrorSites)) {
          if (siteKey !== matchedSearchSiteKey) {
            const existingFrame = document.getElementById('background_fetch_frame_' + siteKey)
            const searchLocation = siteObject.searchUrl(query, queryType)

            if (existingFrame === null && searchLocation !== null) {
              insertMirrorSite(siteKey, searchLocation)
            }
          }
        }

        thisSearchSite.isPrimarySite = true

        window.registerModulePageChangeListener(thisSearchSite.extractResults)
      } else {
        console.log('[Search Mirror] ' + window.location.href + ' is not a search site. (primary)')
      }
    } else {
      let matchedSearchSiteKey = null

      for (const [siteKey, siteObject] of Object.entries(window.searchMirrorSites)) {
        if (siteObject.matchesSearchSite(window.location)) {
          matchedSearchSiteKey = siteKey
        }
      }

      if (matchedSearchSiteKey !== null) {
        console.log('[Search Mirror] ' + window.location.href + ' is a search site (secondary).')

        const thisSearchSite = window.searchMirrorSites[matchedSearchSiteKey]

        thisSearchSite.isPrimarySite = false

        window.registerModulePageChangeListener(thisSearchSite.extractResults)
      } else {
        console.log('[Search Mirror] ' + window.location.href + ' is not a search site (secondary).')
      }
    }
  })
})(); // eslint-disable-line semi, no-trailing-spaces
