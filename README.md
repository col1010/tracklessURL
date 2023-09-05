# tracklessURL
tracklessURL is an open-source privacy-focused extension that automatically removes tracking parameters from URLs before they're visited. Using the Declarative Net Request API, tracklessURL is able to modify URLs without ever requiring intrusive permissions. This means the extension is unable to view or store what websites you visit.

Features:

- Frequently updated built-in list of the most common URL trackers, such as UTM (Urchin Tracking Modules) parameters, Facebook trackers (fbclid), and multiple other social media and marketing website trackers.

- Fully user-customizable: Simple, intuitive user interface allows you to add your own rules for blocking parameters. Delete, edit, toggle, or group rules together at any time.

- Global whitelist feature provides an easy way to whitelist any websites that may behave incorrectly because of parameter removal.

- Multiple ways to add rules: Add a parameter manually by specifying the parameter to block and the websites to block it on or paste a URL containing tracking parameters to quickly add new rules to block them.

With tracklessURL, I hope to build and maintain the web's largest list of URL tracking parameters. Few lists currently exist, and none are near comprehensive enough. If you find parameters to add to the built-in list, please contact me with the information.

Some of the tracking parameters tracklessURL removes include:

- Google: Urchin Tracking Modules (utm_source, utm_medium, etc.), gclid
- Facebook: fbclid
- Instagram: igshid
- Piwik: pk_campaign, pk_keyword, etc.
- Reddit: share_id
- Youtube: si, ab_channel, feature, etc.
- Matomo: mtm_campaign, mtm_source, etc.
- Microsoft: msclkid
- Olytics: oly_enc_id, oly_anon_id
- Spotify: si, context
- Vero Marketing: vero_id
- Marketo: mkt_tok
- LinkedIn: trackingId, refId, trk, etc.
- Mailchimp: mc_cid
- HubSpot: hsa_cam, hsa_src, _hsenc, etc.
- Bronto: _bta_tid, _bta_c

And many more!
