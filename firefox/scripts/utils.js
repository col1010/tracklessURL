/**
 * Checks the locally-stored rule list for a duplicate of the passed-in rule.
 * If a rule is found with the same ID, something went wrong and the promise is rejected.
 * If a rule is found with the same parameter, it is returned. Otherwise, undefined is returned if no duplicate is found.
 * 
 * @param {browser.declarativeNetRequest.Rule} rule The rule object to check for a duplicate of.
 * @returns {Promise} A promise representing the duplicate rule found or undefined if no duplicate was found.
 */
export function checkForDuplicateRule(rule, isGlobalWhitelistRule = false) {
    return new Promise((resolve, reject) => {

        getStoredRuleList()
            .then((ruleList) => {
                if (isGlobalWhitelistRule) {
                    ruleList = ruleList.filter(r => r.group === "GlobalWhitelist");
                } else {
                    ruleList = ruleList.filter(r => r.group !== "GlobalWhitelist");
                }
                for (let i = ruleList.length - 1; i >= 0; i--) {
                    const r = ruleList[i];
                    if (r.id === rule.id) {
                        reject(new Error("Rule with the same ID found! Something went wrong..."));
                    }
                    if (!isGlobalWhitelistRule) {
                        if (r.action.redirect.transform.queryTransform.removeParams[0] === rule.parameter) {
                            resolve(r);
                        }
                    } else {
                        if (r.condition.requestDomains[0] === rule.domain) {
                            resolve(r);
                        }
                    }
                }
                resolve();
            })
            .catch((err) => {
                reject(new Error("Error in checkForDuplicateRule():" + err));
            });
    });
}

/**
 * Returns an object containing group names as keys and arrays of the groups' rules as the values.
 * 
 * @param {browser.declarativeNetRequest.Rule[]} ruleList The locally-stored list of rules.
 * @returns {Promise} Promise that represents an object with group names as keys and arrays of the groups' rules as the values.
 */
export function getGroupArrays(ruleList) {
    return new Promise((resolve) => {
        const groups = {};

        for (const rule of ruleList) {
            if (!rule.group) {
                continue;
            }
            const group = rule.group;

            if (!groups[group]) {
                groups[group] = [];
            }

            groups[group].push(rule);
        }

        resolve(groups);
    })
}

/**
 * Returns the locally-stored list of declarativeNetRequest rules
 * 
 * Note: these rules contain an "enabled" field and optionally a "group" field,
 * both of which are not part of the declarativeNetRequest Rule object
 * 
 * @returns {Promise>} A Promise representing the locally-stored list of declarativeNetRequest rules
 */
export function getStoredRuleList() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get('rules')
            .then((result) => {
                const rules = result.rules || [];
                //console.log("Current rules in local storage: ", rules);
                resolve(rules);
            })
            .catch((err) => {
                reject(new Error("Error fetching rules from browser storage: " + err));
            })
    });
}

/**
 * Returns the list of dynamic rules currently in use by the browser
 * 
 * @returns {Promise} A promise representing the list of dynamic rules currently in use by the browser
 */
export function getDynamicRules() {
    return new Promise((resolve, reject) => {
        browser.declarativeNetRequest.getDynamicRules()
            .then((details => {
                //console.log("Current Dynamic rules: ", details);
                resolve(details);
            }))
            .catch((err) => {
                reject(new Error("Could not retrieve Dynamic Rules: " + err));
            });
    });
};

// Alerts

/**
 * Shows an alert at the bottom of the settings page.
 * 
 * @param {string} message The message for the alert to contain.
 * @param {string} alertType The type of Bootstrap alert. Valid types include "success", "warning", "danger", etc.
 */
export function showBottomAlert(message, alertType) {
    const alertContainer = document.getElementById("bottomAlertContainer");

    const alert = document.createElement("div");
    alert.className = `alert alert-${alertType} alert-dismissible`;
    alert.setAttribute("role", "alert");

    alert.innerHTML = [
        `<div>${message}</div>`,
        `<button typ="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`
    ].join('');

    alertContainer.append(alert);

    setTimeout(() => {
        alert.classList.add('show');
    }, 10);

    // keep success alerts on screen for a shorter time than errors / other alerts
    if (alertType === "success") {
        setTimeout(() => {
            alert.classList.remove('show');
            alert.addEventListener('transitionend', () => alert.remove());
        }, 5000);
    } else {
        setTimeout(() => {
            alert.classList.remove('show');
            alert.addEventListener('transitionend', () => alert.remove());
        }, 20000);
    }
}