import { processAddRule } from "./rule-management.js";
import { CustomRule } from "../resources/CustomRuleClass.js";
import { getDynamicRules } from "./utils.js";

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Add default rules from default_rules.json to localstorage
        // Enable all default rules
        console.log("Extension installed!");
        removeCurrentRules()
            .then(() => {
                console.log("All current rules removed successfully!");
                addDefaultRules();
            })
            .catch((error) => {
                console.error(error);
            });

    } else if (details.reason === 'update') {
        // Re-add all default rules in case new rules were added to default_rules.json
        console.log("Extension updated!");
        addDefaultRules();
    }
});

// Open settings page when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: "settings/settings.html" });
});

/**
 * Removes all rules in the browser dynamic rule list
 * 
 * @returns {Promise} A void Promise
 */
function removeCurrentRules() {
    return new Promise(async (resolve, reject) => {
        getDynamicRules()
            .then((rules) => {
                const ruleIds = rules.map(rule => rule.id);
                chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds })
                    .then(() => {
                        resolve();
                    })
                    .catch((err) => {
                        reject(new Error("Current rules failed to be removed:" + err));
                    });
            })
            .catch((err) => {
                reject(new Error("Current rules failed to be removed:" + err));
            });
    });
}

/**
 * Adds all rules in default_rules.json to the browser dynamic rule list and browser local storage
 * Enables all rules by default
 * Note that this function does not currently account for global whitelist rules being present in the default rules file
 */
function addDefaultRules() {
    fetch('../rules/default_rules.json')
        .then((response) => response.json())
        .then(async (jsonData) => {

            for (let i = 0; i < jsonData.length; i++) {
                const param = jsonData[i].action.redirect.transform.queryTransform.removeParams[0];
                let groupName;
                jsonData[i].group ? groupName = jsonData[i].group : groupName = "";
                let listType, domains;
                if (jsonData[i].condition.requestDomains) {
                    listType = "Blacklist";
                    domains = jsonData[i].condition.requestDomains.join(",");
                } else if (jsonData[i].condition.excludedRequestDomains) {
                    listType = "Whitelist";
                    domains = jsonData[i].condition.excludedRequestDomains.join(",");
                } else {
                    listType = "Whitelist";
                    domains = "";
                }
                const newRule = new CustomRule(param, groupName, listType, domains);

                console.log("Adding rule: ", newRule);
                await processAddRule(newRule, true);
            }
        })
        .catch((err) => {
            console.error('addDefaultRules(): Error reading default rules file:', err);
        });
}


// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((matchedRule) => {
//     console.log("Matched rule:", matchedRule);
//     // chrome.declarativeNetRequest.getMatchedRules()
//     // .then((details) => {
//     //     console.log(details);
//     // });
// });